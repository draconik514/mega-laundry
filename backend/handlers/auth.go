package handlers

import (
    "database/sql"
    "net/http"
    "os"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
    Email    string `json:"email" binding:"required"`
    Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
    Name     string `json:"name" binding:"required"`
    Email    string `json:"email" binding:"required"`
    Password string `json:"password" binding:"required"`
}

func Register(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req RegisterRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
            return
        }

        result, err := db.Exec(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            req.Name, req.Email, string(hashedPassword),
        )
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
            return
        }

        id, _ := result.LastInsertId()
        c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully", "id": id})
    }
}

func Login(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req LoginRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        var user struct {
            ID       int
            Name     string
            Email    string
            Password string
            Role     string
        }

        err := db.QueryRow(
            "SELECT id, name, email, password, role FROM users WHERE email = ?",
            req.Email,
        ).Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.Role)

        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
            return
        }

        if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
            return
        }

        token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
            "id":   user.ID,
            "name": user.Name,
            "role": user.Role,
            "exp":  time.Now().Add(time.Hour * 24).Unix(),
        })

        tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "token": tokenString,
            "user": gin.H{
                "id":   user.ID,
                "name": user.Name,
                "email": user.Email,
                "role": user.Role,
            },
        })
    }
}