package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	reservationsv1 "cinema-microservices/reservations/gen"
	"cinema-microservices/reservations/internal/config"
	"cinema-microservices/reservations/internal/database"
	"cinema-microservices/reservations/internal/logger"
	"cinema-microservices/reservations/internal/repository"
	"cinema-microservices/reservations/internal/service"
	"cinema-microservices/reservations/internal/server"
	"google.golang.org/grpc"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}

	log := logger.New(cfg.ServiceName)

	ctx := context.Background()
	store, err := database.NewMongoStore(ctx, cfg.MongoURI, cfg.DBName)
	if err != nil {
		log.Fatalf("failed to connect to mongodb: %v", err)
	}
	defer func() {
		if discErr := store.Disconnect(context.Background()); discErr != nil {
			log.Printf("mongodb disconnect error: %v", discErr)
		}
	}()

	reservationsRepo, err := repository.NewMongoReservationRepository(store.DB)
	if err != nil {
		log.Fatalf("failed to initialize reservations repository: %v", err)
	}
	log.Printf("mongodb connected: db=%s", cfg.DBName)

	reservationsService := service.NewReservationsGRPCService(reservationsRepo)
	grpcServer, err := server.NewGRPC(cfg.GRPCPort, func(s *grpc.Server) {
		reservationsv1.RegisterReservationsServiceServer(s, reservationsService)
	})
	if err != nil {
		log.Fatalf("failed to create gRPC server: %v", err)
	}

	go func() {
		log.Printf("gRPC server listening on :%s", cfg.GRPCPort)
		if serveErr := grpcServer.Start(); serveErr != nil {
			log.Fatalf("gRPC server failed: %v", serveErr)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	log.Println("shutdown signal received, stopping gRPC server")
	grpcServer.Stop()
	log.Println("server stopped")
}
