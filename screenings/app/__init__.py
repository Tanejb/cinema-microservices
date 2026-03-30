import logging
import os

from flask import Flask
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

    mongo.init_app(app)
    Swagger(app)

    app.register_blueprint(screenings_bp, url_prefix="/api/screenings")

    @app.get("/health")
    def health():
        return {"status": "healthy", "service": "screenings-service"}, 200

    return app
