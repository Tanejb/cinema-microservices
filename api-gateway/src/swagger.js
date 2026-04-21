const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Web API Gateway",
    version: "1.0.0",
    description: "Web gateway entrypoint for cinema microservices.",
  },
  servers: [{ url: "http://localhost:8080", description: "Gateway local" }],
  components: {
    schemas: {
      MovieCreate: {
        type: "object",
        required: ["title", "description", "genre", "duration", "ageRating"],
        example: {
          title: "Inception",
          description: "A mind-bending sci-fi heist thriller.",
          genre: "Sci-Fi",
          duration: 148,
          ageRating: "PG-13",
        },
      },
      UserCreate: {
        type: "object",
        required: ["first_name", "last_name", "email"],
        example: {
          first_name: "Ana",
          last_name: "Novak",
          email: "ana.novak@example.com",
        },
      },
      ScreeningCreate: {
        type: "object",
        required: ["movie_id", "screening_date", "screening_time", "hall", "total_seats"],
        example: {
          movie_id: "movie-001",
          screening_date: "2026-04-20",
          screening_time: "19:30",
          hall: "Hall 2",
          total_seats: 120,
        },
      },
      ReservationCreate: {
        type: "object",
        required: ["screening_id", "seat_number", "user_name", "user_email"],
        example: {
          screening_id: "screening-demo-001",
          seat_number: "C7",
          user_name: "Ana Novak",
          user_email: "ana@example.com",
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Gateway health",
        responses: { 200: { description: "Healthy" } },
      },
    },
    "/api/web/movies": {
      get: {
        summary: "List movies (proxy)",
        parameters: [
          { in: "query", name: "genre", required: false, schema: { type: "string" }, example: "Sci-Fi" },
          { in: "query", name: "search", required: false, schema: { type: "string" }, example: "matrix" },
        ],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                example: {
                  success: true,
                  count: 1,
                  data: [
                    {
                      id: "507f1f77bcf86cd799439011",
                      title: "The Matrix",
                      description: "Sci-fi classic",
                      genre: "Sci-Fi",
                      duration: 136,
                      ageRating: "R",
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create movie (proxy)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MovieCreate" } } },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/api/web/movies/{id}": {
      get: {
        summary: "Get movie by id (proxy)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
        responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
      },
      put: {
        summary: "Update movie (proxy)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MovieCreate" } } },
        },
        responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
      },
      delete: {
        summary: "Delete movie (proxy)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
        responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } },
      },
    },
    "/api/web/users": {
      get: {
        summary: "List users (proxy)",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                example: {
                  success: true,
                  count: 1,
                  data: [
                    {
                      id: "507f1f77bcf86cd799439011",
                      first_name: "Ana",
                      last_name: "Novak",
                      email: "ana.novak@example.com",
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create user (proxy)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserCreate" } } },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/api/web/users/{id}": {
      get: {
        summary: "Get user by id (proxy)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
        responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
      },
      put: {
        summary: "Update user (proxy)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserCreate" } } },
        },
        responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
      },
    },
    "/api/web/screenings": {
      get: {
        summary: "List screenings (proxy)",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                example: {
                  success: true,
                  count: 1,
                  data: [
                    {
                      id: "507f1f77bcf86cd799439011",
                      movie_id: "movie-001",
                      screening_date: "2026-04-20",
                      screening_time: "19:30",
                      hall: "Hall 2",
                      total_seats: 120,
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create screening (proxy)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ScreeningCreate" } } },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/api/web/screenings/{id}": {
      get: {
        summary: "Get screening by id (proxy)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
        responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
      },
      put: {
        summary: "Update screening (proxy)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ScreeningCreate" } } },
        },
        responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
      },
      delete: {
        summary: "Delete screening (proxy)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
        responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } },
      },
    },
    "/api/web/screenings/movie/{movieId}": {
      get: {
        summary: "List screenings by movie (proxy)",
        parameters: [{ in: "path", name: "movieId", required: true, schema: { type: "string" }, example: "movie-001" }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/web/reservations": {
      post: {
        summary: "Create reservation via gRPC",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReservationCreate" },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/api/web/reservations/{id}": {
      get: {
        summary: "Get reservation by id via gRPC",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "67f8f20b92f0cbf2c6100001" }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/web/reservations/screening/{screeningId}": {
      get: {
        summary: "List reservations by screening via gRPC",
        parameters: [{ in: "path", name: "screeningId", required: true, schema: { type: "string" }, example: "screening-demo-001" }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/web/reservations/{id}/cancel": {
      post: {
        summary: "Cancel reservation via gRPC",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "67f8f20b92f0cbf2c6100001" }],
        responses: { 200: { description: "Cancelled" } },
      },
    },
  },
};

module.exports = { swaggerSpec };
