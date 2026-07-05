package config

import (
    "database/sql"
    "fmt"
    "log"
    "os"
    "time"

    _ "github.com/tursodatabase/libsql-client-go/libsql"
)

var DB *sql.DB

func InitDB() {
    var err error
    dbURL := os.Getenv("DB_URL")
    
    DB, err = sql.Open("libsql", dbURL)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    DB.SetMaxOpenConns(10)
    DB.SetMaxIdleConns(5)
    DB.SetConnMaxLifetime(30 * time.Minute)

    if err = DB.Ping(); err != nil {
        log.Fatal("Failed to ping database:", err)
    }

    fmt.Println("Database connected successfully!")
    createTables()
}

func createTables() {
    queries := []string{
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'owner',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price_per_kg REAL NOT NULL,
            estimated_day INTEGER DEFAULT 2,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            customer_id INTEGER REFERENCES customers(id),
            service_id INTEGER REFERENCES services(id),
            weight REAL NOT NULL,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'pending_pickup',
            note TEXT,
            order_source TEXT DEFAULT 'website',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS status_histories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER REFERENCES orders(id),
            status TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS feedbacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_code TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            rating INTEGER NOT NULL,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
        `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`,
        `CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(code)`,
        `CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`,
        `CREATE INDEX IF NOT EXISTS idx_status_histories_order_id ON status_histories(order_id)`,
    }

    for _, query := range queries {
        _, err := DB.Exec(query)
        if err != nil {
            log.Printf("Error creating table: %v", err)
        }
    }

    // Insert default services if not exists
    var count int
    DB.QueryRow("SELECT COUNT(*) FROM services").Scan(&count)
    if count == 0 {
        defaultServices := []string{
            `INSERT INTO services (name, price_per_kg, estimated_day) VALUES 
                ('Cuci Biasa', 7000, 2)`,
            `INSERT INTO services (name, price_per_kg, estimated_day) VALUES 
                ('Cuci + Setrika', 10000, 3)`,
            `INSERT INTO services (name, price_per_kg, estimated_day) VALUES 
                ('Express', 20000, 1)`,
        }
        for _, query := range defaultServices {
            DB.Exec(query)
        }
        fmt.Println("Default services created")
    }

    fmt.Println("Tables created successfully")
}