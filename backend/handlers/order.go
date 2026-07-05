package handlers

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const dbTimeout = 5 * time.Second

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type AdminOrderRequest struct {
	CustomerName    string  `json:"customer_name" binding:"required"`
	CustomerPhone   string  `json:"customer_phone"`
	CustomerAddress string  `json:"customer_address"`
	ServiceID       int     `json:"service_id" binding:"required"`
	Weight          float64 `json:"weight" binding:"required"`
	Note            string  `json:"note"`
	OrderSource     string  `json:"order_source"`
}

type OrderResponse struct {
	ID              int       `json:"id"`
	Code            string    `json:"code"`
	CustomerName    string    `json:"customer_name"`
	CustomerPhone   string    `json:"customer_phone"`
	CustomerAddress string    `json:"customer_address"`
	Weight          float64   `json:"weight"`
	TotalPrice      float64   `json:"total_price"`
	Status          string    `json:"status"`
	Note            string    `json:"note"`
	OrderSource     string    `json:"order_source"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	ServiceName     string    `json:"service_name"`
	EstimatedDay    int       `json:"estimated_day"`
}

func CreateAdminOrder(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req AdminOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.OrderSource == "" {
			req.OrderSource = "walk_in"
		}
		initialStatus := "pending_pickup"
		if req.OrderSource == "walk_in" {
			initialStatus = "washing"
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), dbTimeout)
		defer cancel()

		var customerID int64
		if req.CustomerPhone != "" {
			var existingID int
			if err := db.QueryRowContext(ctx, `SELECT id FROM customers WHERE phone = ?`, req.CustomerPhone).Scan(&existingID); err == nil {
				customerID = int64(existingID)
			}
		}

		if customerID == 0 {
			result, err := db.ExecContext(ctx,
				`INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)`,
				req.CustomerName, req.CustomerPhone, req.CustomerAddress,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan data pelanggan"})
				return
			}
			customerID, _ = result.LastInsertId()
		}

		var pricePerKg float64
		if err := db.QueryRowContext(ctx, "SELECT price_per_kg FROM services WHERE id = ?", req.ServiceID).Scan(&pricePerKg); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Layanan tidak ditemukan"})
			return
		}

		totalPrice := pricePerKg * req.Weight
		code := fmt.Sprintf("LW%s", strings.ToUpper(uuid.New().String()[:8]))

		orderResult, err := db.ExecContext(ctx,
			`INSERT INTO orders (code, customer_id, service_id, weight, total_price, status, note, order_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			code, customerID, req.ServiceID, req.Weight, totalPrice, initialStatus, req.Note, req.OrderSource,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pesanan"})
			return
		}
		orderID, _ := orderResult.LastInsertId()

		db.ExecContext(ctx, "INSERT INTO status_histories (order_id, status) VALUES (?, ?)", orderID, initialStatus)

		c.JSON(http.StatusCreated, gin.H{
			"message":     "Pesanan berhasil dibuat",
			"order_id":    orderID,
			"code":        code,
			"total_price": totalPrice,
		})
	}
}

func GetOrders(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		status := c.Query("status")
		date := c.Query("date")
		search := c.Query("search")
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		if page < 1 {
			page = 1
		}
		const pageSize = 50
		offset := (page - 1) * pageSize

		ctx, cancel := context.WithTimeout(c.Request.Context(), dbTimeout)
		defer cancel()

		baseWhere := " FROM orders o JOIN customers c ON o.customer_id = c.id JOIN services s ON o.service_id = s.id WHERE 1=1"
		args := []interface{}{}

		if status != "" && status != "all" {
			baseWhere += " AND o.status = ?"
			args = append(args, status)
		}
		if date != "" {
			baseWhere += " AND DATE(o.created_at) = ?"
			args = append(args, date)
		}
		if search != "" {
			baseWhere += " AND (c.name LIKE ? OR o.code LIKE ?)"
			args = append(args, "%"+search+"%", "%"+search+"%")
		}

		var total int
		db.QueryRowContext(ctx, "SELECT COUNT(*) "+baseWhere, args...).Scan(&total)

		query := `SELECT o.id, o.code, c.name, c.phone, c.address,
				   o.weight, o.total_price, o.status, o.note, o.order_source,
				   o.created_at, o.updated_at, s.name, s.estimated_day` +
			baseWhere + " ORDER BY o.created_at DESC LIMIT ? OFFSET ?"
		args = append(args, pageSize, offset)

		rows, err := db.QueryContext(ctx, query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		orders := []OrderResponse{}
		for rows.Next() {
			var o OrderResponse
			if err := rows.Scan(
				&o.ID, &o.Code, &o.CustomerName, &o.CustomerPhone, &o.CustomerAddress,
				&o.Weight, &o.TotalPrice, &o.Status, &o.Note, &o.OrderSource,
				&o.CreatedAt, &o.UpdatedAt, &o.ServiceName, &o.EstimatedDay,
			); err != nil {
				continue
			}
			orders = append(orders, o)
		}

		totalPages := (total + pageSize - 1) / pageSize
		c.JSON(http.StatusOK, gin.H{
			"data":        orders,
			"total":       total,
			"page":        page,
			"total_pages": totalPages,
		})
	}
}

// GetNotifications — endpoint ringan khusus bell, max 10 baris
func GetNotifications(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		type NotifOrder struct {
			ID           int       `json:"id"`
			Code         string    `json:"code"`
			CustomerName string    `json:"customer_name"`
			Status       string    `json:"status"`
			ServiceName  string    `json:"service_name"`
			EstimatedDay int       `json:"estimated_day"`
			CreatedAt    time.Time `json:"created_at"`
			IsLate       bool      `json:"is_late"`
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), dbTimeout)
		defer cancel()

		rows, err := db.QueryContext(ctx, `
			SELECT o.id, o.code, c.name, o.status, s.name, s.estimated_day, o.created_at,
				CASE WHEN o.created_at < datetime('now', '-' || s.estimated_day || ' days') THEN 1 ELSE 0 END as is_late
			FROM orders o
			JOIN customers c ON o.customer_id = c.id
			JOIN services s ON o.service_id = s.id
			WHERE o.status NOT IN ('completed', 'cancelled')
			ORDER BY is_late DESC, o.created_at DESC
			LIMIT 10
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		notifs := []NotifOrder{}
		for rows.Next() {
			var n NotifOrder
			var isLate int
			if err := rows.Scan(&n.ID, &n.Code, &n.CustomerName, &n.Status, &n.ServiceName, &n.EstimatedDay, &n.CreatedAt, &isLate); err != nil {
				continue
			}
			n.IsLate = isLate == 1
			notifs = append(notifs, n)
		}
		c.JSON(http.StatusOK, notifs)
	}
}

func GetOrderByCode(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		code := strings.TrimSpace(c.Param("code"))

		ctx, cancel := context.WithTimeout(c.Request.Context(), dbTimeout)
		defer cancel()

		var order struct {
			ID              int       `json:"id"`
			Code            string    `json:"code"`
			CustomerName    string    `json:"customer_name"`
			CustomerPhone   string    `json:"customer_phone"`
			CustomerAddress string    `json:"customer_address"`
			Weight          float64   `json:"weight"`
			TotalPrice      float64   `json:"total_price"`
			Status          string    `json:"status"`
			Note            string    `json:"note"`
			OrderSource     string    `json:"order_source"`
			CreatedAt       time.Time `json:"created_at"`
			UpdatedAt       time.Time `json:"updated_at"`
			ServiceName     string    `json:"service_name"`
			ServiceID       int       `json:"service_id"`
			EstimatedDay    int       `json:"estimated_day"`
		}

		err := db.QueryRowContext(ctx, `
            SELECT o.id, o.code, c.name, c.phone, c.address,
                   o.weight, o.total_price, o.status, o.note, o.order_source,
                   o.created_at, o.updated_at,
                   s.id, s.name, s.estimated_day
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            JOIN services s ON o.service_id = s.id
            WHERE o.code = ?
        `, code).Scan(
			&order.ID, &order.Code, &order.CustomerName, &order.CustomerPhone, &order.CustomerAddress,
			&order.Weight, &order.TotalPrice, &order.Status, &order.Note, &order.OrderSource,
			&order.CreatedAt, &order.UpdatedAt, &order.ServiceID, &order.ServiceName, &order.EstimatedDay,
		)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		rows, err := db.QueryContext(ctx, `
            SELECT status, updated_at
            FROM status_histories
            WHERE order_id = ?
            ORDER BY updated_at ASC
        `, order.ID)
		if err == nil {
			defer rows.Close()
			history := []map[string]interface{}{}
			for rows.Next() {
				var status string
				var updatedAt time.Time
				rows.Scan(&status, &updatedAt)
				history = append(history, map[string]interface{}{
					"status":     status,
					"updated_at": updatedAt,
				})
			}
			c.JSON(http.StatusOK, gin.H{"order": order, "history": history})
			return
		}

		c.JSON(http.StatusOK, gin.H{"order": order})
	}
}

func UpdateOrderStatus(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		var req UpdateOrderStatusRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), dbTimeout)
		defer cancel()

		// Cek apakah status sudah sama — hindari update duplikat
		var currentStatus string
		db.QueryRowContext(ctx, "SELECT status FROM orders WHERE id = ?", id).Scan(&currentStatus)
		if currentStatus == req.Status {
			c.JSON(http.StatusOK, gin.H{"message": "Status tidak berubah"})
			return
		}

		_, err := db.ExecContext(ctx,
			"UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			req.Status, id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
			return
		}

		db.ExecContext(ctx, "INSERT INTO status_histories (order_id, status) VALUES (?, ?)", id, req.Status)

		c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
	}
}

func DeleteOrder(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		if id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), dbTimeout)
		defer cancel()

		db.ExecContext(ctx, "DELETE FROM status_histories WHERE order_id = ?", id)

		_, err := db.ExecContext(ctx, "DELETE FROM orders WHERE id = ?", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus pesanan"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Pesanan berhasil dihapus"})
	}
}
