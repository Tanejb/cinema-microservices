package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"cinema-microservices/reservations/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const reservationsCollection = "reservations"

type ReservationRepository interface {
	Create(ctx context.Context, reservation *domain.Reservation) (*domain.Reservation, error)
	GetByID(ctx context.Context, id string) (*domain.Reservation, error)
	ListByScreeningID(ctx context.Context, screeningID string) ([]domain.Reservation, error)
	Cancel(ctx context.Context, id string) (*domain.Reservation, error)
}

type MongoReservationRepository struct {
	collection *mongo.Collection
}

func NewMongoReservationRepository(db *mongo.Database) (*MongoReservationRepository, error) {
	repo := &MongoReservationRepository{
		collection: db.Collection(reservationsCollection),
	}

	// Prevent duplicate active seat reservations per screening.
	index := mongo.IndexModel{
		Keys: bson.D{
			{Key: "screening_id", Value: 1},
			{Key: "seat_number", Value: 1},
			{Key: "status", Value: 1},
		},
		Options: options.Index().SetUnique(true).SetName("uniq_screening_seat_status"),
	}

	_, err := repo.collection.Indexes().CreateOne(context.Background(), index)
	if err != nil {
		return nil, fmt.Errorf("failed creating reservation indexes: %w", err)
	}

	return repo, nil
}

func (r *MongoReservationRepository) Create(ctx context.Context, reservation *domain.Reservation) (*domain.Reservation, error) {
	if err := reservation.ValidateForCreate(); err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	reservation.Status = domain.StatusConfirmed
	reservation.CreatedAt = now
	reservation.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, reservation)
	if err != nil {
		// Duplicate key from unique index means seat is already reserved for screening.
		if strings.Contains(err.Error(), "E11000") {
			return nil, errors.New("seat is already reserved for this screening")
		}
		return nil, fmt.Errorf("failed to insert reservation: %w", err)
	}

	return reservation, nil
}

func (r *MongoReservationRepository) GetByID(ctx context.Context, id string) (*domain.Reservation, error) {
	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("invalid reservation id")
	}

	var reservation domain.Reservation
	if err := r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&reservation); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("reservation not found")
		}
		return nil, fmt.Errorf("failed to fetch reservation: %w", err)
	}

	return &reservation, nil
}

func (r *MongoReservationRepository) ListByScreeningID(ctx context.Context, screeningID string) ([]domain.Reservation, error) {
	filter := bson.M{"screening_id": screeningID}
	cursor, err := r.collection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}))
	if err != nil {
		return nil, fmt.Errorf("failed to list reservations: %w", err)
	}
	defer cursor.Close(ctx)

	var reservations []domain.Reservation
	for cursor.Next(ctx) {
		var reservation domain.Reservation
		if err := cursor.Decode(&reservation); err != nil {
			return nil, fmt.Errorf("failed to decode reservation: %w", err)
		}
		reservations = append(reservations, reservation)
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error while listing reservations: %w", err)
	}

	return reservations, nil
}

func (r *MongoReservationRepository) Cancel(ctx context.Context, id string) (*domain.Reservation, error) {
	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("invalid reservation id")
	}

	update := bson.M{
		"$set": bson.M{
			"status":     domain.StatusCancelled,
			"updated_at": time.Now().UTC(),
		},
	}

	result, err := r.collection.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel reservation: %w", err)
	}
	if result.MatchedCount == 0 {
		return nil, errors.New("reservation not found")
	}

	return r.GetByID(ctx, id)
}
