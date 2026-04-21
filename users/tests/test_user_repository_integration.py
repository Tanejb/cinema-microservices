import os
import uuid

import pytest
from pymongo import MongoClient

from app.exceptions import DuplicateEmailError
from app.repositories.user_repository import UserRepository


def test_repository_unique_email_and_crud():
    mongo_uri = os.getenv("TEST_MONGODB_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017"
    db_name = f"test_users_{uuid.uuid4().hex}"

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
    try:
        client.admin.command("ping")
    except Exception as exc:
        pytest.skip(f"mongodb unavailable: {exc}")

    try:
        db = client[db_name]
        repo = UserRepository(db)
        repo.ensure_indexes()

        u1 = repo.create(
            {"first_name": "A", "last_name": "B", "email": "only@example.com"}
        )
        assert "id" in u1

        with pytest.raises(DuplicateEmailError):
            repo.create(
                {"first_name": "C", "last_name": "D", "email": "only@example.com"}
            )

        got = repo.get_by_id(u1["id"])
        assert got["email"] == "only@example.com"

        all_users = repo.list_all()
        assert len(all_users) == 1

        upd = repo.update(
            u1["id"],
            {"first_name": "A2", "last_name": "B2", "email": "new@example.com"},
        )
        assert upd["email"] == "new@example.com"

        u2 = repo.create(
            {"first_name": "X", "last_name": "Y", "email": "only@example.com"}
        )
        assert u2["id"] != u1["id"]

        with pytest.raises(DuplicateEmailError):
            repo.update(u2["id"], {"first_name": "X", "last_name": "Y", "email": "new@example.com"})

        deleted = repo.delete(u1["id"])
        assert deleted is True
        assert repo.get_by_id(u1["id"]) is None
    finally:
        client.drop_database(db_name)
        client.close()
