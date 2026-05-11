const request = require("supertest");
const { createApp } = require("../src/app");
const { createCircuitBreaker } = require("../src/circuitBreaker");

describe("api-gateway-web", () => {
  test("GET /health returns healthy", async () => {
    const app = createApp({
      axiosClient: jest.fn(),
      reservationsClient: {},
    });

    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.service).toBe("api-gateway-web");
  });

  test("proxy movies list", async () => {
    const axiosClient = jest.fn().mockResolvedValue({
      status: 200,
      data: { success: true, count: 1, data: [{ id: "1" }] },
    });

    const app = createApp({
      axiosClient,
      reservationsClient: {},
    });

    const response = await request(app).get("/api/web/movies");
    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(1);
    expect(axiosClient).toHaveBeenCalled();
  });

  test("proxy users create trims trailing slash", async () => {
    const axiosClient = jest.fn().mockResolvedValue({
      status: 201,
      data: { success: true, data: { id: "u1" } },
    });

    const app = createApp({
      axiosClient,
      reservationsClient: {},
    });

    const response = await request(app).post("/api/web/users").send({
      first_name: "Ana",
      last_name: "Novak",
      email: "ana@example.com",
    });

    expect(response.statusCode).toBe(201);
    expect(axiosClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringMatching(/\/api\/users$/),
      }),
    );
  });

  test("create reservation via grpc bridge", async () => {
    const reservationsClient = {
      createReservation: jest.fn().mockResolvedValue({
        reservation: { id: "r1", screening_id: "s1" },
      }),
      getReservationById: jest.fn(),
      listReservationsByScreening: jest.fn(),
      cancelReservation: jest.fn(),
    };

    const app = createApp({
      axiosClient: jest.fn(),
      reservationsClient,
    });

    const response = await request(app).post("/api/web/reservations").send({
      screening_id: "s1",
      seat_number: "A1",
      user_name: "Test",
      user_email: "test@example.com",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.id).toBe("r1");
    expect(reservationsClient.createReservation).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
    );
  });

  test("delete reservation maps to grpc cancel", async () => {
    const reservationsClient = {
      createReservation: jest.fn(),
      getReservationById: jest.fn(),
      listReservationsByScreening: jest.fn(),
      cancelReservation: jest.fn().mockResolvedValue({
        reservation: { id: "r1", status: "cancelled" },
      }),
    };

    const app = createApp({
      axiosClient: jest.fn(),
      reservationsClient,
    });

    const response = await request(app).delete("/api/web/reservations/r1");
    expect(response.statusCode).toBe(200);
    expect(response.body.data.status).toBe("cancelled");
    expect(reservationsClient.cancelReservation).toHaveBeenCalledWith(
      "r1",
      expect.any(String),
    );
  });

  test("proxy forwards X-Request-Id to downstream", async () => {
    const axiosClient = jest.fn().mockResolvedValue({
      status: 200,
      data: { success: true, count: 0, data: [] },
    });

    const app = createApp({
      axiosClient,
      reservationsClient: {},
    });

    const response = await request(app)
      .get("/api/web/movies")
      .set("X-Request-Id", "trace-demo-123");

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe("trace-demo-123");
    expect(axiosClient).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-request-id": "trace-demo-123",
        }),
      }),
    );
  });

  test("REST circuit breaker opens after repeated 5xx from downstream", async () => {
    const axiosClient = jest.fn().mockResolvedValue({
      status: 503,
      data: { success: false, message: "down" },
    });

    const app = createApp({
      axiosClient,
      reservationsClient: {},
      circuitBreakers: {
        movies: createCircuitBreaker({
          name: "movies",
          errorThreshold: 2,
          resetTimeoutMs: 60000,
        }),
      },
    });

    const r1 = await request(app).get("/api/web/movies");
    const r2 = await request(app).get("/api/web/movies");
    const r3 = await request(app).get("/api/web/movies");

    expect(r1.statusCode).toBe(503);
    expect(r2.statusCode).toBe(503);
    expect(r3.statusCode).toBe(503);
    expect(r3.body.reason).toBe("circuit_open");
    expect(axiosClient).toHaveBeenCalledTimes(2);
  });

  test("gRPC reservations circuit opens after repeated failures", async () => {
    const err = new Error("unavailable");
    const reservationsClient = {
      createReservation: jest.fn().mockRejectedValue(err),
      getReservationById: jest.fn(),
      listReservationsByScreening: jest.fn(),
      cancelReservation: jest.fn(),
    };

    const app = createApp({
      axiosClient: jest.fn(),
      reservationsClient,
      circuitBreakers: {
        reservations: createCircuitBreaker({
          name: "reservations",
          errorThreshold: 2,
          resetTimeoutMs: 60000,
        }),
      },
    });

    const r1 = await request(app).post("/api/web/reservations").send({
      screening_id: "s1",
      seat_number: "A1",
      user_name: "Test",
      user_email: "test@example.com",
    });
    const r2 = await request(app).post("/api/web/reservations").send({
      screening_id: "s1",
      seat_number: "A2",
      user_name: "Test",
      user_email: "test@example.com",
    });
    const r3 = await request(app).post("/api/web/reservations").send({
      screening_id: "s1",
      seat_number: "A3",
      user_name: "Test",
      user_email: "test@example.com",
    });

    expect(r1.statusCode).toBe(502);
    expect(r2.statusCode).toBe(502);
    expect(r3.statusCode).toBe(503);
    expect(r3.body.reason).toBe("circuit_open");
    expect(reservationsClient.createReservation).toHaveBeenCalledTimes(2);
  });
});
