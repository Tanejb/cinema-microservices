package service

import (
	"context"
	"errors"
	"testing"
	"time"

	reservationsv1 "cinema-microservices/reservations/gen"
	"cinema-microservices/reservations/internal/domain"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type mockReservationRepo struct {
	createFn          func(ctx context.Context, reservation *domain.Reservation) (*domain.Reservation, error)
	getByIDFn         func(ctx context.Context, id string) (*domain.Reservation, error)
	listByScreeningFn func(ctx context.Context, screeningID string) ([]domain.Reservation, error)
	cancelFn          func(ctx context.Context, id string) (*domain.Reservation, error)
}

func (m mockReservationRepo) Create(ctx context.Context, reservation *domain.Reservation) (*domain.Reservation, error) {
	return m.createFn(ctx, reservation)
}
func (m mockReservationRepo) GetByID(ctx context.Context, id string) (*domain.Reservation, error) {
	return m.getByIDFn(ctx, id)
}
func (m mockReservationRepo) ListByScreeningID(ctx context.Context, screeningID string) ([]domain.Reservation, error) {
	return m.listByScreeningFn(ctx, screeningID)
}
func (m mockReservationRepo) Cancel(ctx context.Context, id string) (*domain.Reservation, error) {
	return m.cancelFn(ctx, id)
}

func TestCreateReservation_Success(t *testing.T) {
	now := time.Now().UTC()
	expected := &domain.Reservation{
		ID:          bson.NewObjectID(),
		ScreeningID: "screening-1",
		SeatNumber:  "A10",
		UserName:    "John Doe",
		UserEmail:   "john@example.com",
		Status:      domain.StatusConfirmed,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	svc := NewReservationsGRPCService(mockReservationRepo{
		createFn: func(ctx context.Context, reservation *domain.Reservation) (*domain.Reservation, error) {
			return expected, nil
		},
	})

	resp, err := svc.CreateReservation(context.Background(), &reservationsv1.CreateReservationRequest{
		ScreeningId: "screening-1",
		SeatNumber:  "A10",
		UserName:    "John Doe",
		UserEmail:   "john@example.com",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.GetReservation().GetId() == "" {
		t.Fatalf("expected reservation id")
	}
	if resp.GetReservation().GetStatus() != reservationsv1.ReservationStatus_RESERVATION_STATUS_CONFIRMED {
		t.Fatalf("expected confirmed status")
	}
}

func TestCreateReservation_InvalidArgument(t *testing.T) {
	svc := NewReservationsGRPCService(mockReservationRepo{
		createFn: func(ctx context.Context, reservation *domain.Reservation) (*domain.Reservation, error) {
			return nil, errors.New("user_email is invalid")
		},
	})

	_, err := svc.CreateReservation(context.Background(), &reservationsv1.CreateReservationRequest{})
	if err == nil {
		t.Fatalf("expected error")
	}
	if status.Code(err) != codes.InvalidArgument {
		t.Fatalf("expected InvalidArgument, got %v", status.Code(err))
	}
}

func TestGetReservationByID_NotFound(t *testing.T) {
	svc := NewReservationsGRPCService(mockReservationRepo{
		getByIDFn: func(ctx context.Context, id string) (*domain.Reservation, error) {
			return nil, errors.New("reservation not found")
		},
	})

	_, err := svc.GetReservationById(context.Background(), &reservationsv1.GetReservationByIdRequest{Id: "abc"})
	if err == nil {
		t.Fatalf("expected error")
	}
	if status.Code(err) != codes.NotFound {
		t.Fatalf("expected NotFound, got %v", status.Code(err))
	}
}

func TestListReservationsByScreening_EmptyScreeningID(t *testing.T) {
	svc := NewReservationsGRPCService(mockReservationRepo{
		listByScreeningFn: func(ctx context.Context, screeningID string) ([]domain.Reservation, error) {
			return nil, nil
		},
	})

	_, err := svc.ListReservationsByScreening(context.Background(), &reservationsv1.ListReservationsByScreeningRequest{})
	if err == nil {
		t.Fatalf("expected error")
	}
	if status.Code(err) != codes.InvalidArgument {
		t.Fatalf("expected InvalidArgument, got %v", status.Code(err))
	}
}

func TestCancelReservation_MapsNotFound(t *testing.T) {
	svc := NewReservationsGRPCService(mockReservationRepo{
		cancelFn: func(ctx context.Context, id string) (*domain.Reservation, error) {
			return nil, errors.New("reservation not found")
		},
	})

	_, err := svc.CancelReservation(context.Background(), &reservationsv1.CancelReservationRequest{Id: "abc"})
	if err == nil {
		t.Fatalf("expected error")
	}
	if status.Code(err) != codes.NotFound {
		t.Fatalf("expected NotFound, got %v", status.Code(err))
	}
}
