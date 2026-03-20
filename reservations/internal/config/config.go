package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	GRPCPort    string
	MongoURI    string
	DBName      string
	ServiceName string
	LogLevel    string
}

func Load() (Config, error) {
	_ = godotenv.Load()

	cfg := Config{
		GRPCPort:    getEnv("GRPC_PORT", "50051"),
		MongoURI:    getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		DBName:      getEnv("DB_NAME", "reservations_db"),
		ServiceName: getEnv("SERVICE_NAME", "reservations-service"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
	}

	if cfg.GRPCPort == "" {
		return Config{}, fmt.Errorf("GRPC_PORT is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
