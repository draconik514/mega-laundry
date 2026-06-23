package models

import "time"

type StatusHistory struct {
    ID        int       `json:"id"`
    OrderID   int       `json:"order_id"`
    Status    string    `json:"status"`
    UpdatedAt time.Time `json:"updated_at"`
}