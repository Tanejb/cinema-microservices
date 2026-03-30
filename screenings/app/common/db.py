from __future__ import annotations

from flask import Flask, g
from pymongo import MongoClient


class MongoExtension:
    def init_app(self, app: Flask) -> None:
        app.teardown_appcontext(self.teardown)

    def _get_client(self) -> MongoClient:
        if "mongo_client" not in g:
            from flask import current_app
            g.mongo_client = MongoClient(current_app.config["MONGO_URI"])
        return g.mongo_client

    def get_db(self):
        from flask import current_app
        return self._get_client()[current_app.config["DB_NAME"]]

    @staticmethod
    def teardown(_exc=None) -> None:
        client = g.pop("mongo_client", None)
        if client is not None:
            client.close()


mongo = MongoExtension()
