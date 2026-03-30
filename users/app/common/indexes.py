from __future__ import annotations

from pymongo import MongoClient

from app.repositories.user_repository import UserRepository


def ensure_user_indexes(mongo_uri: str, db_name: str) -> None:
    """Create indexes on startup (short-lived client, not request-scoped)."""
    client = MongoClient(mongo_uri)
    try:
        repo = UserRepository(client[db_name])
        repo.ensure_indexes()
    finally:
        client.close()
