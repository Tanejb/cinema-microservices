package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type MongoStore struct {
	Client *mongo.Client
	DB     *mongo.Database
}

func NewMongoStore(ctx context.Context, uri, dbName string) (*MongoStore, error) {
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to mongodb: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := client.Ping(pingCtx, nil); err != nil {
		_ = client.Disconnect(ctx)
		return nil, fmt.Errorf("failed to ping mongodb: %w", err)
	}

	return &MongoStore{
		Client: client,
		DB:     client.Database(dbName),
	}, nil
}

func (m *MongoStore) Disconnect(ctx context.Context) error {
	return m.Client.Disconnect(ctx)
}
