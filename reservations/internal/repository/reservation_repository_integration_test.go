package repository

import (
	"context"
	"os"
	"testing"
	"time"

	"cinema-microservices/reservations/internal/database"
	"cinema-microservices/reservations/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestMongoReservationRepository_Integration(t *testing.T) {
	ctx := context.Background()

	mongoURI := os.Getenv("TEST_MONGODB_URI")
	if mongoURI == "" {
		mongoURI = os.Getenv("MONGODB_URI")
	}
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	dbName := "test_reservations_db_" + bson.NewObjectID().Hex()

	store, err := database.NewMongoStore(ctx, mongoURI, dbName)
	if err != nil {
		t.Skipf("skipping integration test; mongodb unavailable (%v)", err)
	}
	defer func() {
		_ = store.DB.Drop(context.Background())
		_ = store.Disconnect(context.Background())
	}()

	repo, err := NewMongoReservationRepository(store.DB)
	if err != nil {
		t.Fatalf("failed to create repository: %v", err)
	}

	first, err := repo.Create(ctx, &domain.Reservation{
		ScreeningID: "screening-1",
		SeatNumber:  "A1",
		UserName:    "John",
		UserEmail:   "john@example.com",
	})
	if err != nil {
		t.Fatalf("failed to create reservation: %v", err)
	}
	if first.Status != domain.StatusConfirmed {
		t.Fatalf("expected confirmed status, got %s", first.Status)
	}

	_, err = repo.Create(ctx, &domain.Reservation{
		ScreeningID: "screening-1",
		SeatNumber:  "A1",
		UserName:    "Jane",
		UserEmail:   "jane@example.com",
	})
	if err == nil {
		t.Fatalf("expected duplicate seat error")
	}

	fetched, err := repo.GetByID(ctx, first.IDHex())
	if err != nil {
		t.Fatalf("failed to fetch reservation by id: %v", err)
	}
	if fetched.SeatNumber != "A1" {
		t.Fatalf("expected seat A1, got %s", fetched.SeatNumber)
	}

	list, err := repo.ListByScreeningID(ctx, "screening-1")
	if err != nil {
		t.Fatalf("failed to list reservations: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 reservation, got %d", len(list))
	}

	cancelled, err := repo.Cancel(ctx, first.IDHex())
	if err != nil {
		t.Fatalf("failed to cancel reservation: %v", err)
	}
	if cancelled.Status != domain.StatusCancelled {
		t.Fatalf("expected cancelled status, got %s", cancelled.Status)
	}
	if cancelled.UpdatedAt.Before(cancelled.CreatedAt.Add(-1 * time.Second)) {
		t.Fatalf("expected updated_at to be set correctly")
	}
}
