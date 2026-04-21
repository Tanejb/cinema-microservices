from __future__ import annotations

import logging
import os

from flask import Flask, jsonify, request
from flasgger import Swagger

from app.clients.rest_client import RestClient
from app.swagger import swagger_spec


def create_app(rest_client: RestClient | None = None) -> Flask:
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

    client = rest_client or RestClient(timeout=10)
    movies_url = os.getenv("MOVIES_SERVICE_URL", "http://localhost:3001")
    users_url = os.getenv("USERS_SERVICE_URL", "http://localhost:3002")
    screenings_url = os.getenv("SCREENINGS_SERVICE_URL", "http://localhost:3003")
    reservations_bridge = os.getenv(
        "RESERVATIONS_BRIDGE_URL",
        "http://localhost:8080/api/web/reservations",
    )

    def _proxy_rest(service_url: str, target_prefix: str, path_suffix: str = ""):
        payload = request.get_json(silent=True)
        url = f"{service_url}{target_prefix}{path_suffix}"
        resp = client.request(
            request.method,
            url,
            json=payload if payload else None,
            params=request.args,
        )
        return jsonify(resp.json()), resp.status_code

    @app.get("/health")
    def health():
        return {"status": "healthy", "service": "api-gateway-mobile"}, 200

    @app.get("/api/mobile/home")
    def home_feed():
        movies_resp = client.request("GET", f"{movies_url}/api/movies")
        screenings_resp = client.request("GET", f"{screenings_url}/api/screenings")
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
        resp = client.request("GET", f"{movies_url}/api/movies", params=request.args)
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
        return _proxy_rest(movies_url, "/api/movies")

    @app.get("/api/mobile/movies/<movie_id>")
    def get_movie_mobile(movie_id: str):
        return _proxy_rest(movies_url, "/api/movies", f"/{movie_id}")

    @app.put("/api/mobile/movies/<movie_id>")
    def update_movie_mobile(movie_id: str):
        return _proxy_rest(movies_url, "/api/movies", f"/{movie_id}")

    @app.delete("/api/mobile/movies/<movie_id>")
    def delete_movie_mobile(movie_id: str):
        return _proxy_rest(movies_url, "/api/movies", f"/{movie_id}")

    @app.get("/api/mobile/movies/<movie_id>/details")
    def movie_details(movie_id: str):
        movie_resp = client.request("GET", f"{movies_url}/api/movies/{movie_id}")
        if movie_resp.status_code >= 400:
            return jsonify(movie_resp.json()), movie_resp.status_code
        screenings_resp = client.request(
            "GET", f"{screenings_url}/api/screenings/movie/{movie_id}"
        )
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
        resp = client.request("GET", f"{users_url}/api/users/{user_id}")
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
        return _proxy_rest(users_url, "/api/users")

    @app.post("/api/mobile/users")
    def create_user_mobile():
        return _proxy_rest(users_url, "/api/users")

    @app.get("/api/mobile/users/<user_id>")
    def get_user_mobile(user_id: str):
        return _proxy_rest(users_url, "/api/users", f"/{user_id}")

    @app.put("/api/mobile/users/<user_id>")
    def update_user_mobile(user_id: str):
        return _proxy_rest(users_url, "/api/users", f"/{user_id}")

    @app.delete("/api/mobile/users/<user_id>")
    def delete_user_mobile(user_id: str):
        return _proxy_rest(users_url, "/api/users", f"/{user_id}")

    @app.get("/api/mobile/screenings")
    def list_screenings_mobile():
        return _proxy_rest(screenings_url, "/api/screenings")

    @app.post("/api/mobile/screenings")
    def create_screening_mobile():
        return _proxy_rest(screenings_url, "/api/screenings")

    @app.get("/api/mobile/screenings/<screening_id>")
    def get_screening_mobile(screening_id: str):
        return _proxy_rest(screenings_url, "/api/screenings", f"/{screening_id}")

    @app.put("/api/mobile/screenings/<screening_id>")
    def update_screening_mobile(screening_id: str):
        return _proxy_rest(screenings_url, "/api/screenings", f"/{screening_id}")

    @app.delete("/api/mobile/screenings/<screening_id>")
    def delete_screening_mobile(screening_id: str):
        return _proxy_rest(screenings_url, "/api/screenings", f"/{screening_id}")

    @app.get("/api/mobile/screenings/movie/<movie_id>")
    def list_screenings_by_movie_mobile(movie_id: str):
        return _proxy_rest(screenings_url, "/api/screenings", f"/movie/{movie_id}")

    @app.post("/api/mobile/reservations")
    def create_reservation_mobile():
        payload = request.get_json(silent=True) or {}
        resp = client.request("POST", reservations_bridge, json=payload)
        return jsonify(resp.json()), resp.status_code

    @app.get("/api/mobile/reservations/<reservation_id>")
    def get_reservation_mobile(reservation_id: str):
        resp = client.request("GET", f"{reservations_bridge}/{reservation_id}")
        return jsonify(resp.json()), resp.status_code

    @app.delete("/api/mobile/reservations/<reservation_id>")
    def delete_reservation_mobile(reservation_id: str):
        resp = client.request("POST", f"{reservations_bridge}/{reservation_id}/cancel")
        return jsonify(resp.json()), resp.status_code

    @app.get("/api/mobile/reservations/screening/<screening_id>")
    def list_reservations_by_screening_mobile(screening_id: str):
        resp = client.request(
            "GET", f"{reservations_bridge}/screening/{screening_id}"
        )
        return jsonify(resp.json()), resp.status_code

    @app.post("/api/mobile/reservations/<reservation_id>/cancel")
    def cancel_reservation_mobile(reservation_id: str):
        resp = client.request("POST", f"{reservations_bridge}/{reservation_id}/cancel")
        return jsonify(resp.json()), resp.status_code

    @app.errorhandler(Exception)
    def handle_error(exc):
        logger.exception("Unhandled gateway error")
        return jsonify({"success": False, "message": "Mobile gateway error", "details": str(exc)}), 502

    return app
