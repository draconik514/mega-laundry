package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DashboardStats struct {
	TotalOrders      int          `json:"total_orders"`
	ProcessingOrders int          `json:"processing_orders"`
	CompletedOrders  int          `json:"completed_orders"`
	LateOrders       int          `json:"late_orders"`
	RevenueToday     float64      `json:"revenue_today"`
	WeeklyData       []WeeklyOrder `json:"weekly_data"`
	RecentOrders     []RecentOrder `json:"recent_orders"`
}

type WeeklyOrder struct {
	Day   string `json:"day"`
	Count int    `json:"count"`
}

type RecentOrder struct {
	ID         int     `json:"id"`
	Code       string  `json:"code"`
	Customer   string  `json:"customer"`
	Weight     float64 `json:"weight"`
	Status     string  `json:"status"`
	TotalPrice float64 `json:"total_price"`
}

func GetDashboardStats(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		stats := DashboardStats{}

		db.QueryRow("SELECT COUNT(*) FROM orders").Scan(&stats.TotalOrders)

		db.QueryRow(
			"SELECT COUNT(*) FROM orders WHERE status NOT IN ('completed', 'cancelled')",
		).Scan(&stats.ProcessingOrders)

		db.QueryRow(
			"SELECT COUNT(*) FROM orders WHERE status = 'completed'",
		).Scan(&stats.CompletedOrders)

		// Late orders - SQLite syntax
		db.QueryRow(`
            SELECT COUNT(*) FROM orders o 
            JOIN services s ON o.service_id = s.id 
            WHERE o.created_at < datetime('now', '-' || s.estimated_day || ' days')
            AND o.status NOT IN ('completed', 'cancelled')
        `).Scan(&stats.LateOrders)

		// Revenue today - SQLite syntax
		db.QueryRow(`
            SELECT COALESCE(SUM(total_price), 0) 
            FROM orders 
            WHERE DATE(created_at) = DATE('now') 
            AND status = 'completed'
        `).Scan(&stats.RevenueToday)

		// Weekly data - SQLite syntax
		days := []string{"Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"}
		stats.WeeklyData = make([]WeeklyOrder, 7)
		for i := range stats.WeeklyData {
			stats.WeeklyData[i].Day = days[i]
		}
		rows, err := db.Query(`
            SELECT strftime('%w', created_at) as day, COUNT(*) 
            FROM orders 
            WHERE created_at >= date('now', '-6 days')
            GROUP BY strftime('%w', created_at)
            ORDER BY day
        `)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var day int
				var count int
				rows.Scan(&day, &count)
				if day >= 0 && day < 7 {
					stats.WeeklyData[day].Count = count
				}
			}
		}

		// Recent orders
		rows, err = db.Query(`
            SELECT o.id, o.code, c.name, o.weight, o.status, o.total_price 
            FROM orders o 
            JOIN customers c ON o.customer_id = c.id 
            ORDER BY o.created_at DESC 
            LIMIT 5
        `)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var order RecentOrder
				rows.Scan(&order.ID, &order.Code, &order.Customer, &order.Weight, &order.Status, &order.TotalPrice)
				stats.RecentOrders = append(stats.RecentOrders, order)
			}
		}

		c.JSON(http.StatusOK, stats)
	}
}
