package models

import "time"

type Service struct {
    ID           int       `json:"id"`
    Name         string    `json:"name"`
    PricePerKg   float64   `json:"price_per_kg"`
    EstimatedDay int       `json:"estimated_day"`
    CreatedAt    time.Time `json:"created_at"`
}