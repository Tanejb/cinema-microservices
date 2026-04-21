const request = require("supertest");
const { createApp } = require("../src/app");

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
    expect(reservationsClient.createReservation).toHaveBeenCalled();
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
    expect(reservationsClient.cancelReservation).toHaveBeenCalledWith("r1");
  });
});
