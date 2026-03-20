package domain

import "testing"

func TestValidateForCreate_SuccessAndNormalize(t *testing.T) {
	reservation := &Reservation{
		ScreeningID: " screening-1 ",
		SeatNumber:  " a10 ",
		UserName:    " John Doe ",
		UserEmail:   " John.Doe@Email.com ",
	}

	err := reservation.ValidateForCreate()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if reservation.ScreeningID != "screening-1" {
		t.Fatalf("expected normalized screening id, got %q", reservation.ScreeningID)
	}
	if reservation.SeatNumber != "A10" {
		t.Fatalf("expected normalized seat number A10, got %q", reservation.SeatNumber)
	}
	if reservation.UserEmail != "john.doe@email.com" {
		t.Fatalf("expected normalized user email, got %q", reservation.UserEmail)
	}
}

func TestValidateForCreate_MissingFields(t *testing.T) {
	tests := []struct {
		name        string
		reservation Reservation
	}{
		{
			name: "missing screening id",
			reservation: Reservation{
				SeatNumber: "A1",
				UserName:   "Test",
				UserEmail:  "test@example.com",
			},
		},
		{
			name: "missing seat number",
			reservation: Reservation{
				ScreeningID: "screening-1",
				UserName:    "Test",
				UserEmail:   "test@example.com",
			},
		},
		{
			name: "missing user name",
			reservation: Reservation{
				ScreeningID: "screening-1",
				SeatNumber:  "A1",
				UserEmail:   "test@example.com",
			},
		},
		{
			name: "missing user email",
			reservation: Reservation{
				ScreeningID: "screening-1",
				SeatNumber:  "A1",
				UserName:    "Test",
			},
		},
		{
			name: "invalid user email",
			reservation: Reservation{
				ScreeningID: "screening-1",
				SeatNumber:  "A1",
				UserName:    "Test",
				UserEmail:   "bad-email",
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			reservation := tc.reservation
			err := reservation.ValidateForCreate()
			if err == nil {
				t.Fatalf("expected validation error, got nil")
			}
		})
	}
}
