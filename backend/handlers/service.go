package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type ServiceRequest struct {
	Name         string  `json:"name" binding:"required"`
	PricePerKg   float64 `json:"price_per_kg" binding:"required"`
	EstimatedDay int     `json:"estimated_day" binding:"required"`
}

func GetServices(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`
            SELECT id, name, price_per_kg, estimated_day, created_at 
            FROM services 
            ORDER BY id
        `)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		type Service struct {
			ID           int       `json:"id"`
			Name         string    `json:"name"`
			PricePerKg   float64   `json:"price_per_kg"`
			EstimatedDay int       `json:"estimated_day"`
			CreatedAt    time.Time `json:"created_at"`
		}

		services := []Service{}
		for rows.Next() {
			var s Service
			rows.Scan(&s.ID, &s.Name, &s.PricePerKg, &s.EstimatedDay, &s.CreatedAt)
			services = append(services, s)
		}

		c.JSON(http.StatusOK, services)
	}
}

func CreateService(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req ServiceRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		result, err := db.Exec(
			`INSERT INTO services (name, price_per_kg, estimated_day) VALUES (?, ?, ?)`,
			req.Name, req.PricePerKg, req.EstimatedDay,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service"})
			return
		}

		id, _ := result.LastInsertId()
		c.JSON(http.StatusCreated, gin.H{"message": "Service created", "id": id})
	}
}

func UpdateService(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		var req ServiceRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		_, err := db.Exec(
			`UPDATE services SET name = ?, price_per_kg = ?, estimated_day = ? WHERE id = ?`,
			req.Name, req.PricePerKg, req.EstimatedDay, id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Service updated"})
	}
}

func DeleteService(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))

		_, err := db.Exec("DELETE FROM services WHERE id = ?", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Service deleted"})
	}
}
