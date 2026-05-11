package server

import (
	"context"
	"fmt"
	"log"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/reflection"
)

func unaryRequestIDInterceptor(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	rid := "-"
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if v := md.Get("x-request-id"); len(v) > 0 {
			rid = v[0]
		}
	}
	log.Printf("reservations-service grpc request_id=%s method=%s", rid, info.FullMethod)
	return handler(ctx, req)
}

type Server struct {
	grpcServer *grpc.Server
	listener   net.Listener
}

func NewGRPC(port string, register func(s *grpc.Server)) (*Server, error) {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		return nil, fmt.Errorf("failed to listen on gRPC port %s: %w", port, err)
	}

	s := grpc.NewServer(grpc.ChainUnaryInterceptor(unaryRequestIDInterceptor))
	if register != nil {
		register(s)
	}
	reflection.Register(s)

	return &Server{
		grpcServer: s,
		listener:   lis,
	}, nil
}

func (s *Server) Start() error {
	return s.grpcServer.Serve(s.listener)
}

func (s *Server) Stop() {
	s.grpcServer.GracefulStop()
}
