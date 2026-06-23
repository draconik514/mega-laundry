package models

import "time"

type Order struct {
    ID          int       `json:"id"`
    Code        string    `json:"code"`
    CustomerID  int       `json:"customer_id"`
    ServiceID   int       `json:"service_id"`
    Weight      float64   `json:"weight"`
    TotalPrice  float64   `json:"total_price"`
    Status      string    `json:"status"`
    Note        string    `json:"note"`
    OrderSource string    `json:"order_source"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type OrderWithDetails struct {
    Order
    CustomerName string `json:"customer_name"`
    CustomerPhone string `json:"customer_phone"`
    CustomerAddress string `json:"customer_address"`
    ServiceName  string `json:"service_name"`
    EstimatedDay int    `json:"estimated_day"`
}