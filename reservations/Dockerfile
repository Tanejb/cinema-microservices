FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o reservations-service ./cmd/server

FROM alpine:3.21

WORKDIR /app
COPY --from=builder /app/reservations-service /usr/local/bin/reservations-service

EXPOSE 50051

ENTRYPOINT ["/usr/local/bin/reservations-service"]
