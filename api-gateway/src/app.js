const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const axios = require("axios");
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("./swagger");
const { createReservationsClient } = require("./clients/reservationsClient");
const { createCircuitBreaker, CircuitOpenError } = require("./circuitBreaker");

function createApp(options = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  morgan.token("requestId", (req) => req.requestId || "-");
  app.use((req, res, next) => {
    const incoming = req.get("x-request-id");
    const requestId =
      incoming && String(incoming).trim()
        ? String(incoming).trim()
        : crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
  });
  app.use(
    morgan(
      ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" reqId=:requestId',
    ),
  );

  const axiosClient = options.axiosClient || axios;
  const reservationsClient =
    options.reservationsClient ||
    createReservationsClient(
      process.env.RESERVATIONS_GRPC_ADDR || "localhost:50051",
    );

  const moviesBase = process.env.MOVIES_SERVICE_URL || "http://localhost:3001";
  const usersBase = process.env.USERS_SERVICE_URL || "http://localhost:3002";
  const screeningsBase =
    process.env.SCREENINGS_SERVICE_URL || "http://localhost:3003";

  const circuitResetMs = parseInt(
    process.env.CIRCUIT_BREAKER_RESET_MS || "15000",
    10,
  );
  const circuitErrorThreshold = parseInt(
    process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || "5",
    10,
  );
  const breakerDefaults = {
    errorThreshold: circuitErrorThreshold,
    resetTimeoutMs: circuitResetMs,
  };
  const breakers = options.circuitBreakers || {};
  const moviesBreaker =
    breakers.movies || createCircuitBreaker({ name: "movies", ...breakerDefaults });
  const usersBreaker =
    breakers.users || createCircuitBreaker({ name: "users", ...breakerDefaults });
  const screeningsBreaker =
    breakers.screenings ||
    createCircuitBreaker({ name: "screenings", ...breakerDefaults });
  const reservationsBreaker =
    breakers.reservations ||
    createCircuitBreaker({ name: "reservations", ...breakerDefaults });

  function sendCircuitOpen(res, service) {
    res.set("Retry-After", String(Math.max(1, Math.ceil(circuitResetMs / 1000))));
    res.status(503).json({
      success: false,
      message: "Service temporarily unavailable (circuit open)",
      service,
      reason: "circuit_open",
    });
  }

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "healthy", service: "api-gateway-web" });
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  function restProxy(serviceBaseUrl, targetPrefix, breaker) {
    return async (req, res) => {
      try {
        const pathSuffix = req.path === "/" ? "" : req.path;
        const targetUrl = `${serviceBaseUrl}${targetPrefix}${pathSuffix}`;
        const response = await breaker.run(
          () =>
            axiosClient({
              method: req.method,
              url: targetUrl,
              data: req.body,
              params: req.query,
              headers: {
                "content-type": "application/json",
                "x-request-id": req.requestId,
              },
              validateStatus: () => true,
            }),
          { httpResponse: true },
        );
        res.status(response.status).json(response.data);
      } catch (error) {
        if (error instanceof CircuitOpenError || error.code === "CIRCUIT_OPEN") {
          return sendCircuitOpen(res, error.service || breaker.getState().name);
        }
        res.status(502).json({
          success: false,
          message: "Bad gateway",
          details: error.message,
        });
      }
    };
  }

  app.use("/api/web/movies", restProxy(moviesBase, "/api/movies", moviesBreaker));
  app.use("/api/web/users", restProxy(usersBase, "/api/users", usersBreaker));
  app.use(
    "/api/web/screenings",
    restProxy(screeningsBase, "/api/screenings", screeningsBreaker),
  );

  app.post("/api/web/reservations", async (req, res) => {
    try {
      const response = await reservationsBreaker.run(() =>
        reservationsClient.createReservation(req.body, req.requestId),
      );
      res.status(201).json({ success: true, data: response.reservation });
    } catch (error) {
      if (error instanceof CircuitOpenError || error.code === "CIRCUIT_OPEN") {
        return sendCircuitOpen(res, "reservations");
      }
      res.status(502).json({
        success: false,
        message: "Reservations service unavailable",
        details: error.message,
      });
    }
  });

  app.get("/api/web/reservations/:id", async (req, res) => {
    try {
      const response = await reservationsBreaker.run(() =>
        reservationsClient.getReservationById(req.params.id, req.requestId),
      );
      res.status(200).json({ success: true, data: response.reservation });
    } catch (error) {
      if (error instanceof CircuitOpenError || error.code === "CIRCUIT_OPEN") {
        return sendCircuitOpen(res, "reservations");
      }
      res.status(502).json({
        success: false,
        message: "Reservations service unavailable",
        details: error.message,
      });
    }
  });

  app.get("/api/web/reservations/screening/:screeningId", async (req, res) => {
    try {
      const response = await reservationsBreaker.run(() =>
        reservationsClient.listReservationsByScreening(
          req.params.screeningId,
          req.requestId,
        ),
      );
      res
        .status(200)
        .json({ success: true, count: response.reservations.length, data: response.reservations });
    } catch (error) {
      if (error instanceof CircuitOpenError || error.code === "CIRCUIT_OPEN") {
        return sendCircuitOpen(res, "reservations");
      }
      res.status(502).json({
        success: false,
        message: "Reservations service unavailable",
        details: error.message,
      });
    }
  });

  app.post("/api/web/reservations/:id/cancel", async (req, res) => {
    try {
      const response = await reservationsBreaker.run(() =>
        reservationsClient.cancelReservation(req.params.id, req.requestId),
      );
      res.status(200).json({ success: true, data: response.reservation });
    } catch (error) {
      if (error instanceof CircuitOpenError || error.code === "CIRCUIT_OPEN") {
        return sendCircuitOpen(res, "reservations");
      }
      res.status(502).json({
        success: false,
        message: "Reservations service unavailable",
        details: error.message,
      });
    }
  });

  app.delete("/api/web/reservations/:id", async (req, res) => {
    try {
      const response = await reservationsBreaker.run(() =>
        reservationsClient.cancelReservation(req.params.id, req.requestId),
      );
      res.status(200).json({ success: true, data: response.reservation });
    } catch (error) {
      if (error instanceof CircuitOpenError || error.code === "CIRCUIT_OPEN") {
        return sendCircuitOpen(res, "reservations");
      }
      res.status(502).json({
        success: false,
        message: "Reservations service unavailable",
        details: error.message,
      });
    }
  });

  return app;
}

module.exports = { createApp };
