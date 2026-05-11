import logging
import os
import uuid

from flask import Flask, g, request
from flasgger import Swagger

from app.api.screenings_routes import screenings_bp
from app.common.db import mongo


def create_app(testing: bool = False) -> Flask:
    app = Flask(__name__)
    app.config["TESTING"] = testing
    app.config["SWAGGER"] = {
        "title": "Screenings Service API",
        "uiversion": 3,
        "specs_route": "/api-docs/",
    }
    app.config["MONGO_URI"] = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    app.config["DB_NAME"] = os.getenv("DB_NAME", "screenings_db")

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(level=getattr(logging, log_level, logging.INFO))
    log = logging.getLogger("screenings-service")

    @app.before_request
    def assign_request_id():
        incoming = request.headers.get("X-Request-Id")
        g.request_id = (
            incoming.strip()
            if incoming and str(incoming).strip()
            else str(uuid.uuid4())
        )
        log.info("%s %s request_id=%s", request.method, request.path, g.request_id)

    @app.after_request
    def echo_request_id(response):
        rid = getattr(g, "request_id", None)
        if rid:
            response.headers["X-Request-Id"] = rid
        return response

    mongo.init_app(app)
    Swagger(app)

    app.register_blueprint(screenings_bp, url_prefix="/api/screenings")

    @app.get("/health")
    def health():
        return {"status": "healthy", "service": "screenings-service"}, 200

    return app
