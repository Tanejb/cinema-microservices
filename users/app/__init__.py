import logging
import os

from flask import Flask
from flasgger import Swagger

from app.api.users_routes import users_bp
from app.common.db import mongo
from app.common.indexes import ensure_user_indexes


def create_app(testing: bool = False) -> Flask:
    app = Flask(__name__)
    app.config["TESTING"] = testing

    app.config["SWAGGER"] = {
        "title": "Users Service API",
        "uiversion": 3,
        "specs_route": "/api-docs/",
    }

    app.config["MONGO_URI"] = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    app.config["DB_NAME"] = os.getenv("DB_NAME", "users_db")
    app.config["SERVICE_NAME"] = "users-service"

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(level=getattr(logging, log_level, logging.INFO))

    mongo.init_app(app)
    Swagger(app)

    if not testing:
        ensure_user_indexes(app.config["MONGO_URI"], app.config["DB_NAME"])

    app.register_blueprint(users_bp, url_prefix="/api/users")

    @app.get("/health")
    def health():
        return {"status": "healthy", "service": "users-service"}, 200

    return app
