package main

import (
	"context"
	"log"
	"time"

	reservationsv1 "cinema-microservices/reservations/gen"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect: %v", err)
	}
	defer conn.Close()

	client := reservationsv1.NewReservationsServiceClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := client.CreateReservation(ctx, &reservationsv1.CreateReservationRequest{
		ScreeningId: "screening-demo-001",
		SeatNumber:  "B12",
		UserName:    "Demo User",
		UserEmail:   "demo.user@example.com",
	})
	if err != nil {
		log.Fatalf("CreateReservation failed: %v", err)
	}

	log.Printf("Reservation created: id=%s screening=%s seat=%s status=%s",
		resp.GetReservation().GetId(),
		resp.GetReservation().GetScreeningId(),
		resp.GetReservation().GetSeatNumber(),
		resp.GetReservation().GetStatus().String(),
	)
}
