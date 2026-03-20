package service

import (
	"context"
	"errors"
	"strings"

	reservationsv1 "cinema-microservices/reservations/gen"
	"cinema-microservices/reservations/internal/domain"
	"cinema-microservices/reservations/internal/repository"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type ReservationsGRPCService struct {
	reservationsv1.UnimplementedReservationsServiceServer
	repo repository.ReservationRepository
}

func NewReservationsGRPCService(repo repository.ReservationRepository) *ReservationsGRPCService {
	return &ReservationsGRPCService{repo: repo}
}

func (s *ReservationsGRPCService) CreateReservation(ctx context.Context, req *reservationsv1.CreateReservationRequest) (*reservationsv1.CreateReservationResponse, error) {
	res := &domain.Reservation{
		ScreeningID: req.GetScreeningId(),
		SeatNumber:  req.GetSeatNumber(),
		UserName:    req.GetUserName(),
		UserEmail:   req.GetUserEmail(),
	}

	created, err := s.repo.Create(ctx, res)
	if err != nil {
		return nil, mapError(err)
	}

	return &reservationsv1.CreateReservationResponse{
		Reservation: toProtoReservation(*created),
	}, nil
}

func (s *ReservationsGRPCService) GetReservationById(ctx context.Context, req *reservationsv1.GetReservationByIdRequest) (*reservationsv1.GetReservationByIdResponse, error) {
	reservation, err := s.repo.GetByID(ctx, req.GetId())
	if err != nil {
		return nil, mapError(err)
	}

	return &reservationsv1.GetReservationByIdResponse{
		Reservation: toProtoReservation(*reservation),
	}, nil
}

func (s *ReservationsGRPCService) ListReservationsByScreening(ctx context.Context, req *reservationsv1.ListReservationsByScreeningRequest) (*reservationsv1.ListReservationsByScreeningResponse, error) {
	screeningID := strings.TrimSpace(req.GetScreeningId())
	if screeningID == "" {
		return nil, status.Error(codes.InvalidArgument, "screening_id is required")
	}

	items, err := s.repo.ListByScreeningID(ctx, screeningID)
	if err != nil {
		return nil, mapError(err)
	}

	reservations := make([]*reservationsv1.Reservation, 0, len(items))
	for _, item := range items {
		reservations = append(reservations, toProtoReservation(item))
	}

	return &reservationsv1.ListReservationsByScreeningResponse{
		Reservations: reservations,
	}, nil
}

func (s *ReservationsGRPCService) CancelReservation(ctx context.Context, req *reservationsv1.CancelReservationRequest) (*reservationsv1.CancelReservationResponse, error) {
	reservation, err := s.repo.Cancel(ctx, req.GetId())
	if err != nil {
		return nil, mapError(err)
	}

	return &reservationsv1.CancelReservationResponse{
		Reservation: toProtoReservation(*reservation),
	}, nil
}

func toProtoReservation(res domain.Reservation) *reservationsv1.Reservation {
	statusValue := reservationsv1.ReservationStatus_RESERVATION_STATUS_UNSPECIFIED
	switch res.Status {
	case domain.StatusConfirmed:
		statusValue = reservationsv1.ReservationStatus_RESERVATION_STATUS_CONFIRMED
	case domain.StatusCancelled:
		statusValue = reservationsv1.ReservationStatus_RESERVATION_STATUS_CANCELLED
	}

	return &reservationsv1.Reservation{
		Id:          res.IDHex(),
		ScreeningId: res.ScreeningID,
		SeatNumber:  res.SeatNumber,
		UserName:    res.UserName,
		UserEmail:   res.UserEmail,
		Status:      statusValue,
		CreatedAt:   res.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   res.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}

func mapError(err error) error {
	msg := err.Error()

	switch {
	case strings.Contains(msg, "is required"), strings.Contains(msg, "invalid"):
		return status.Error(codes.InvalidArgument, msg)
	case strings.Contains(msg, "not found"):
		return status.Error(codes.NotFound, msg)
	case strings.Contains(msg, "already reserved"):
		return status.Error(codes.AlreadyExists, msg)
	default:
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			return status.Error(codes.DeadlineExceeded, msg)
		}
		return status.Error(codes.Internal, "internal server error")
	}
}
