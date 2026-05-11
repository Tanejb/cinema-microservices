from __future__ import annotations

import logging
import os
import uuid

from flask import Flask, g, jsonify, make_response, request
from flasgger import Swagger

from app.circuit_breaker import CircuitBreaker, CircuitOpenError
from app.clients.rest_client import RestClient
from app.swagger import swagger_spec


def create_app(
    rest_client: RestClient | None = None,
    circuit_breakers: dict[str, CircuitBreaker] | None = None,
) -> Flask:
    app = Flask(__name__)

    app.config["SWAGGER"] = {
        "title": "Mobile API Gateway",
        "uiversion": 3,
        "specs_route": "/api-docs/",
    }
    Swagger(app, template=swagger_spec)

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(level=getattr(logging, log_level, logging.INFO))
    logger = logging.getLogger("mobile-gateway")

    @app.before_request
    def assign_request_id():
        incoming = request.headers.get("X-Request-Id")
        g.request_id = (
            incoming.strip()
            if incoming and str(incoming).strip()
            else str(uuid.uuid4())
        )
        logger.info("%s %s request_id=%s", request.method, request.path, g.request_id)

    @app.after_request
    def echo_request_id(response):
        rid = getattr(g, "request_id", None)
        if rid:
            response.headers["X-Request-Id"] = rid
        return response

    client = rest_client or RestClient(timeout=10)
    movies_url = os.getenv("MOVIES_SERVICE_URL", "http://localhost:3001")
    users_url = os.getenv("USERS_SERVICE_URL", "http://localhost:3002")
    screenings_url = os.getenv("SCREENINGS_SERVICE_URL", "http://localhost:3003")
    reservations_bridge = os.getenv(
        "RESERVATIONS_BRIDGE_URL",
        "http://localhost:8080/api/web/reservations",
    )

    circuit_reset_ms = int(os.getenv("CIRCUIT_BREAKER_RESET_MS", "15000"))
    circuit_threshold = int(os.getenv("CIRCUIT_BREAKER_ERROR_THRESHOLD", "5"))

    def _breaker(key: str) -> CircuitBreaker:
        if circuit_breakers and key in circuit_breakers:
            return circuit_breakers[key]
        return CircuitBreaker(
            key,
            error_threshold=circuit_threshold,
            reset_timeout_ms=circuit_reset_ms,
        )

    movies_breaker = _breaker("movies")
    users_breaker = _breaker("users")
    screenings_breaker = _breaker("screenings")
    reservations_breaker = _breaker("reservations")

    def _circuit_open_response(service: str):
        body = jsonify(
            {
                "success": False,
                "message": "Service temporarily unavailable (circuit open)",
                "service": service,
                "reason": "circuit_open",
            }
        )
        resp = make_response(body, 503)
        resp.headers["Retry-After"] = str(max(1, (circuit_reset_ms + 999) // 1000))
        return resp

    def _proxy_rest(
        breaker: CircuitBreaker,
        service_url: str,
        target_prefix: str,
        path_suffix: str = "",
    ):
        payload = request.get_json(silent=True)
        url = f"{service_url}{target_prefix}{path_suffix}"
        try:
            resp = breaker.run(
                lambda: client.request(
                    request.method,
                    url,
                    json=payload if payload else None,
                    params=request.args,
                ),
                http_response=True,
            )
            return jsonify(resp.json()), resp.status_code
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)

    @app.get("/health")
    def health():
        return {"status": "healthy", "service": "api-gateway-mobile"}, 200

    @app.get("/api/mobile/home")
    def home_feed():
        try:
            movies_resp = movies_breaker.run(
                lambda: client.request("GET", f"{movies_url}/api/movies"),
                http_response=True,
            )
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)
        try:
            screenings_resp = screenings_breaker.run(
                lambda: client.request("GET", f"{screenings_url}/api/screenings"),
                http_response=True,
            )
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)
        movies = (movies_resp.json() or {}).get("data", [])[:5]
        screenings = (screenings_resp.json() or {}).get("data", [])[:5]
        compact_movies = [
            {"id": m.get("id"), "title": m.get("title"), "genre": m.get("genre")}
            for m in movies
        ]
        compact_screenings = [
            {
                "id": s.get("id"),
                "movie_id": s.get("movie_id"),
                "date": s.get("screening_date"),
                "time": s.get("screening_time"),
                "hall": s.get("hall"),
            }
            for s in screenings
        ]
        return jsonify(
            {
                "success": True,
                "data": {
                    "featured_movies": compact_movies,
                    "upcoming_screenings": compact_screenings,
                },
            }
        )

    @app.get("/api/mobile/movies")
    def list_movies_mobile():
        try:
            resp = movies_breaker.run(
                lambda: client.request(
                    "GET", f"{movies_url}/api/movies", params=request.args
                ),
                http_response=True,
            )
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)
        data = (resp.json() or {}).get("data", [])
        compact = [
            {
                "id": item.get("id"),
                "title": item.get("title"),
                "genre": item.get("genre"),
                "duration": item.get("duration"),
            }
            for item in data
        ]
        return jsonify({"success": True, "count": len(compact), "data": compact}), resp.status_code

    @app.post("/api/mobile/movies")
    def create_movie_mobile():
        return _proxy_rest(movies_breaker, movies_url, "/api/movies")

    @app.get("/api/mobile/movies/<movie_id>")
    def get_movie_mobile(movie_id: str):
        return _proxy_rest(movies_breaker, movies_url, "/api/movies", f"/{movie_id}")

    @app.put("/api/mobile/movies/<movie_id>")
    def update_movie_mobile(movie_id: str):
        return _proxy_rest(movies_breaker, movies_url, "/api/movies", f"/{movie_id}")

    @app.delete("/api/mobile/movies/<movie_id>")
    def delete_movie_mobile(movie_id: str):
        return _proxy_rest(movies_breaker, movies_url, "/api/movies", f"/{movie_id}")

    @app.get("/api/mobile/movies/<movie_id>/details")
    def movie_details(movie_id: str):
        try:
            movie_resp = movies_breaker.run(
                lambda: client.request("GET", f"{movies_url}/api/movies/{movie_id}"),
                http_response=True,
            )
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)
        if movie_resp.status_code >= 400:
            return jsonify(movie_resp.json()), movie_resp.status_code
        try:
            screenings_resp = screenings_breaker.run(
                lambda: client.request(
                    "GET", f"{screenings_url}/api/screenings/movie/{movie_id}"
                ),
                http_response=True,
            )
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)
        movie = (movie_resp.json() or {}).get("data", {})
        screenings = (screenings_resp.json() or {}).get("data", [])
        return jsonify(
            {
                "success": True,
                "data": {
                    "movie": movie,
                    "screenings": screenings,
                },
            }
        )

    @app.get("/api/mobile/users/<user_id>/profile")
    def user_profile(user_id: str):
        try:
            resp = users_breaker.run(
                lambda: client.request("GET", f"{users_url}/api/users/{user_id}"),
                http_response=True,
            )
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)
        if resp.status_code >= 400:
            return jsonify(resp.json()), resp.status_code
        user = (resp.json() or {}).get("data", {})
        profile = {
            "id": user.get("id"),
            "full_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            "email": user.get("email"),
        }
        return jsonify({"success": True, "data": profile}), 200

    @app.get("/api/mobile/users")
    def list_users_mobile():
        return _proxy_rest(users_breaker, users_url, "/api/users")

    @app.post("/api/mobile/users")
    def create_user_mobile():
        return _proxy_rest(users_breaker, users_url, "/api/users")

    @app.get("/api/mobile/users/<user_id>")
    def get_user_mobile(user_id: str):
        return _proxy_rest(users_breaker, users_url, "/api/users", f"/{user_id}")

    @app.put("/api/mobile/users/<user_id>")
    def update_user_mobile(user_id: str):
        return _proxy_rest(users_breaker, users_url, "/api/users", f"/{user_id}")

    @app.delete("/api/mobile/users/<user_id>")
    def delete_user_mobile(user_id: str):
        return _proxy_rest(users_breaker, users_url, "/api/users", f"/{user_id}")

    @app.get("/api/mobile/screenings")
    def list_screenings_mobile():
        return _proxy_rest(screenings_breaker, screenings_url, "/api/screenings")

    @app.post("/api/mobile/screenings")
    def create_screening_mobile():
        return _proxy_rest(screenings_breaker, screenings_url, "/api/screenings")

    @app.get("/api/mobile/screenings/<screening_id>")
    def get_screening_mobile(screening_id: str):
        return _proxy_rest(
            screenings_breaker, screenings_url, "/api/screenings", f"/{screening_id}"
        )

    @app.put("/api/mobile/screenings/<screening_id>")
    def update_screening_mobile(screening_id: str):
        return _proxy_rest(
            screenings_breaker, screenings_url, "/api/screenings", f"/{screening_id}"
        )

    @app.delete("/api/mobile/screenings/<screening_id>")
    def delete_screening_mobile(screening_id: str):
        return _proxy_rest(
            screenings_breaker, screenings_url, "/api/screenings", f"/{screening_id}"
        )

    @app.get("/api/mobile/screenings/movie/<movie_id>")
    def list_screenings_by_movie_mobile(movie_id: str):
        return _proxy_rest(
            screenings_breaker,
            screenings_url,
            "/api/screenings",
            f"/movie/{movie_id}",
        )

    @app.post("/api/mobile/reservations")
    def create_reservation_mobile():
        payload = request.get_json(silent=True) or {}
        try:
            resp = reservations_breaker.run(
                lambda: client.request("POST", reservations_bridge, json=payload),
                http_response=True,
            )
            return jsonify(resp.json()), resp.status_code
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)

    @app.get("/api/mobile/reservations/<reservation_id>")
    def get_reservation_mobile(reservation_id: str):
        try:
            resp = reservations_breaker.run(
                lambda: client.request(
                    "GET", f"{reservations_bridge}/{reservation_id}"
                ),
                http_response=True,
            )
            return jsonify(resp.json()), resp.status_code
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)

    @app.delete("/api/mobile/reservations/<reservation_id>")
    def delete_reservation_mobile(reservation_id: str):
        try:
            resp = reservations_breaker.run(
                lambda: client.request(
                    "POST", f"{reservations_bridge}/{reservation_id}/cancel"
                ),
                http_response=True,
            )
            return jsonify(resp.json()), resp.status_code
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)

    @app.get("/api/mobile/reservations/screening/<screening_id>")
    def list_reservations_by_screening_mobile(screening_id: str):
        try:
            resp = reservations_breaker.run(
                lambda: client.request(
                    "GET", f"{reservations_bridge}/screening/{screening_id}"
                ),
                http_response=True,
            )
            return jsonify(resp.json()), resp.status_code
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)

    @app.post("/api/mobile/reservations/<reservation_id>/cancel")
    def cancel_reservation_mobile(reservation_id: str):
        try:
            resp = reservations_breaker.run(
                lambda: client.request(
                    "POST", f"{reservations_bridge}/{reservation_id}/cancel"
                ),
                http_response=True,
            )
            return jsonify(resp.json()), resp.status_code
        except CircuitOpenError as exc:
            return _circuit_open_response(exc.service)

    @app.errorhandler(Exception)
    def handle_error(exc):
        logger.exception("Unhandled gateway error")
        return jsonify({"success": False, "message": "Mobile gateway error", "details": str(exc)}), 502

    return app
