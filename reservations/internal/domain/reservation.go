package domain

import (
	"errors"
	"net/mail"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type ReservationStatus string

const (
	StatusConfirmed ReservationStatus = "CONFIRMED"
	StatusCancelled ReservationStatus = "CANCELLED"
)

type Reservation struct {
	ID          bson.ObjectID     `bson:"_id,omitempty"`
	ScreeningID string            `bson:"screening_id"`
	SeatNumber  string            `bson:"seat_number"`
	UserName    string            `bson:"user_name"`
	UserEmail   string            `bson:"user_email"`
	Status      ReservationStatus `bson:"status"`
	CreatedAt   time.Time         `bson:"created_at"`
	UpdatedAt   time.Time         `bson:"updated_at"`
}

func (r Reservation) IDHex() string {
	if r.ID.IsZero() {
		return ""
	}
	return r.ID.Hex()
}

func (r *Reservation) Normalize() {
	r.ScreeningID = strings.TrimSpace(r.ScreeningID)
	r.SeatNumber = strings.TrimSpace(strings.ToUpper(r.SeatNumber))
	r.UserName = strings.TrimSpace(r.UserName)
	r.UserEmail = strings.TrimSpace(strings.ToLower(r.UserEmail))
}

func (r *Reservation) ValidateForCreate() error {
	r.Normalize()

	if r.ScreeningID == "" {
		return errors.New("screening_id is required")
	}
	if r.SeatNumber == "" {
		return errors.New("seat_number is required")
	}
	if r.UserName == "" {
		return errors.New("user_name is required")
	}
	if r.UserEmail == "" {
		return errors.New("user_email is required")
	}
	if _, err := mail.ParseAddress(r.UserEmail); err != nil {
		return errors.New("user_email is invalid")
	}
	return nil
}
