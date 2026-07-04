package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateFeedback(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			OrderCode  string `json:"order_code" binding:"required"`
			CustomerName string `json:"customer_name" binding:"required"`
			Rating     int    `json:"rating" binding:"required"`
			Message    string `json:"message"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if req.Rating < 1 || req.Rating > 5 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Rating harus antara 1-5"})
			return
		}

		// Cek apakah order ada
		var exists int
		db.QueryRow("SELECT COUNT(*) FROM orders WHERE code = ?", req.OrderCode).Scan(&exists)
		if exists == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order tidak ditemukan"})
			return
		}

		// Cek apakah sudah pernah feedback
		var already int
		db.QueryRow("SELECT COUNT(*) FROM feedbacks WHERE order_code = ?", req.OrderCode).Scan(&already)
		if already > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Feedback untuk order ini sudah dikirim"})
			return
		}

		_, err := db.Exec(
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
		rows, err := db.Query(`
			SELECT id, order_code, customer_name, rating, message, created_at
			FROM feedbacks ORDER BY created_at DESC
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data"})
			return
		}
		defer rows.Close()

		type Feedback struct {
			ID           int     `json:"id"`
			OrderCode    string  `json:"order_code"`
			CustomerName string  `json:"customer_name"`
			Rating       int     `json:"rating"`
			Message      string  `json:"message"`
			CreatedAt    string  `json:"created_at"`
		}

		feedbacks := []Feedback{}
		var totalRating int
		for rows.Next() {
			var f Feedback
			rows.Scan(&f.ID, &f.OrderCode, &f.CustomerName, &f.Rating, &f.Message, &f.CreatedAt)
			feedbacks = append(feedbacks, f)
			totalRating += f.Rating
		}

		avgRating := 0.0
		if len(feedbacks) > 0 {
			avgRating = float64(totalRating) / float64(len(feedbacks))
		}

		c.JSON(http.StatusOK, gin.H{
			"feedbacks":  feedbacks,
			"total":      len(feedbacks),
			"avg_rating": avgRating,
		})
	}
}
