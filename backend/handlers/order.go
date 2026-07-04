package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

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

		// Cari customer yang sudah ada berdasarkan nomor HP, kalau tidak ada buat baru
		var customerID int64
		if req.CustomerPhone != "" {
			var existingID int
			err := db.QueryRow(`SELECT id FROM customers WHERE phone = ?`, req.CustomerPhone).Scan(&existingID)
			if err == nil {
				customerID = int64(existingID)
			}
		}

		if customerID == 0 {
			result, err := db.Exec(
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
		if err := db.QueryRow("SELECT price_per_kg FROM services WHERE id = ?", req.ServiceID).Scan(&pricePerKg); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Layanan tidak ditemukan"})
			return
		}

		totalPrice := pricePerKg * req.Weight
		code := fmt.Sprintf("LW%s", strings.ToUpper(uuid.New().String()[:8]))

		orderResult, err := db.Exec(
			`INSERT INTO orders (code, customer_id, service_id, weight, total_price, status, note, order_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			code, customerID, req.ServiceID, req.Weight, totalPrice, initialStatus, req.Note, req.OrderSource,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pesanan"})
			return
		}
		orderID, _ := orderResult.LastInsertId()

		db.Exec("INSERT INTO status_histories (order_id, status) VALUES (?, ?)", orderID, initialStatus)

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

		query := `
            SELECT o.id, o.code, c.name, c.phone, c.address, 
                   o.weight, o.total_price, o.status, o.note, o.order_source,
                   o.created_at, o.updated_at,
                   s.name as service_name, s.estimated_day
            FROM orders o 
            JOIN customers c ON o.customer_id = c.id 
            JOIN services s ON o.service_id = s.id 
            WHERE 1=1
        `
		args := []interface{}{}

		if status != "" && status != "all" {
			query += " AND o.status = ?"
			args = append(args, status)
		}
		if date != "" {
			query += " AND DATE(o.created_at) = ?"
			args = append(args, date)
		}
		if search != "" {
			query += " AND c.name LIKE ?"
			args = append(args, "%"+search+"%")
		}

		query += " ORDER BY o.created_at DESC"

		rows, err := db.Query(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

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

		orders := []OrderResponse{}
		for rows.Next() {
			var o OrderResponse
			err := rows.Scan(
				&o.ID, &o.Code, &o.CustomerName, &o.CustomerPhone, &o.CustomerAddress,
				&o.Weight, &o.TotalPrice, &o.Status, &o.Note, &o.OrderSource,
				&o.CreatedAt, &o.UpdatedAt, &o.ServiceName, &o.EstimatedDay,
			)
			if err != nil {
				continue
			}
			orders = append(orders, o)
		}

		c.JSON(http.StatusOK, orders)
	}
}

func GetOrderByCode(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		code := strings.TrimSpace(c.Param("code"))

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

		err := db.QueryRow(`
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

		rows, err := db.Query(`
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

		_, err := db.Exec(
			"UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			req.Status, id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
			return
		}

		db.Exec("INSERT INTO status_histories (order_id, status) VALUES (?, ?)", id, req.Status)

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

		// Hapus status histories dulu (foreign key constraint)
		db.Exec("DELETE FROM status_histories WHERE order_id = ?", id)

		_, err := db.Exec("DELETE FROM orders WHERE id = ?", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus pesanan"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Pesanan berhasil dihapus"})
	}
}
