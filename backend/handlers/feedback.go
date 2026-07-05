package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateFeedback(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			OrderCode    string `json:"order_code" binding:"required"`
			CustomerName string `json:"customer_name" binding:"required"`
			Rating       int    `json:"rating" binding:"required"`
			Message      string `json:"message"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if req.Rating < 1 || req.Rating > 5 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Rating harus antara 1-5"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), dbTimeout)
		defer cancel()

		var exists int
		db.QueryRowContext(ctx, "SELECT COUNT(*) FROM orders WHERE code = ?", req.OrderCode).Scan(&exists)
		if exists == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order tidak ditemukan"})
			return
		}

		var already int
		db.QueryRowContext(ctx, "SELECT COUNT(*) FROM feedbacks WHERE order_code = ?", req.OrderCode).Scan(&already)
		if already > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Feedback untuk order ini sudah dikirim"})
			return
		}

		_, err := db.ExecContext(ctx,
			"INSERT INTO feedbacks (order_code, customer_name, rating, message) VALUES (?, ?, ?, ?)",
			req.OrderCode, req.CustomerName, req.Rating, req.Message,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan feedback"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "Terima kasih atas feedback Anda!"})
	}
}

func GetFeedbacks(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		if page < 1 {
			page = 1
		}
		const pageSize = 20
		offset := (page - 1) * pageSize

		ctx, cancel := context.WithTimeout(c.Request.Context(), dbTimeout)
		defer cancel()

		var total int
		var totalRating int
		db.QueryRowContext(ctx, "SELECT COUNT(*), COALESCE(SUM(rating), 0) FROM feedbacks").Scan(&total, &totalRating)

		rows, err := db.QueryContext(ctx, `
			SELECT id, order_code, customer_name, rating, message, created_at
			FROM feedbacks
			ORDER BY created_at DESC
			LIMIT ? OFFSET ?
		`, pageSize, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data"})
			return
		}
		defer rows.Close()

		type Feedback struct {
			ID           int    `json:"id"`
			OrderCode    string `json:"order_code"`
			CustomerName string `json:"customer_name"`
			Rating       int    `json:"rating"`
			Message      string `json:"message"`
			CreatedAt    string `json:"created_at"`
		}

		feedbacks := []Feedback{}
		for rows.Next() {
			var f Feedback
			rows.Scan(&f.ID, &f.OrderCode, &f.CustomerName, &f.Rating, &f.Message, &f.CreatedAt)
			feedbacks = append(feedbacks, f)
		}

		avgRating := 0.0
		if total > 0 {
			avgRating = float64(totalRating) / float64(total)
		}

		totalPages := (total + pageSize - 1) / pageSize
		c.JSON(http.StatusOK, gin.H{
			"feedbacks":   feedbacks,
			"avg_rating":  avgRating,
			"total":       total,
			"page":        page,
			"total_pages": totalPages,
		})
	}
}
