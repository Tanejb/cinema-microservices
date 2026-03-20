package server

import (
	"fmt"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Server struct {
	grpcServer *grpc.Server
	listener   net.Listener
}

func NewGRPC(port string, register func(s *grpc.Server)) (*Server, error) {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		return nil, fmt.Errorf("failed to listen on gRPC port %s: %w", port, err)
	}

	s := grpc.NewServer()
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
