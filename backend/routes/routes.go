package routes

import (
	"database/sql"
	"os"

	"github.com/gin-gonic/gin"
	"laundryflow/handlers"
	"laundryflow/middleware"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	router := gin.Default()

	// Rate limiting global
	router.Use(middleware.RateLimit())

	// CORS
	allowedOrigin := os.Getenv("CORS_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "*"
	}
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Public routes
	auth := router.Group("/api/auth")
	auth.Use(middleware.RateLimitAuth())
	{
		auth.POST("/login", handlers.Login(db))
		auth.POST("/register", handlers.Register(db))
	}

	// Public customer routes
	customer := router.Group("/api/customer")
	{
		customer.POST("/order", handlers.CreateCustomerOrder(db))
		customer.GET("/order/:code", handlers.GetCustomerOrder(db))
		customer.GET("/orders", handlers.GetCustomerOrders(db))
	}

	// Public service routes (for customer)
	router.GET("/api/services", handlers.GetServices(db))

	// Protected routes
	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// Dashboard
		api.GET("/dashboard", handlers.GetDashboardStats(db))

		// Orders
		api.GET("/orders", handlers.GetOrders(db))
		api.GET("/order/:code", handlers.GetOrderByCode(db))
		api.POST("/orders", handlers.CreateAdminOrder(db))
		api.PUT("/orders/:id/status", handlers.UpdateOrderStatus(db))
		api.DELETE("/orders/:id", handlers.DeleteOrder(db))

		// Services - Admin only
		api.POST("/services", handlers.CreateService(db))
		api.PUT("/services/:id", handlers.UpdateService(db))
		api.DELETE("/services/:id", handlers.DeleteService(db))

		// Reports
		api.GET("/reports/financial", handlers.GetFinancialReport(db))
	}

	return router
}
