package middleware

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type client struct {
	limiter *rate.Limiter
}

var (
	clients = make(map[string]*client)
	mu      sync.Mutex
)

func getLimiter(ip string, r rate.Limit, b int) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	if c, exists := clients[ip]; exists {
		return c.limiter
	}

	l := rate.NewLimiter(r, b)
	clients[ip] = &client{limiter: l}
	return l
}

// RateLimit - general API (60 req/menit)
func RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := getLimiter(ip, 1, 60) // 1 req/detik, burst 60
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Terlalu banyak request. Coba lagi nanti.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// RateLimitAuth - khusus login/register (5 req/menit)
func RateLimitAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := getLimiter("auth:"+ip, rate.Every(12), 5) // 5 req per menit
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Terlalu banyak percobaan login. Tunggu 1 menit.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
