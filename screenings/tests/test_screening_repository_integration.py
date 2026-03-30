import os
import uuid

import pytest
from pymongo import MongoClient

from app.repositories.screening_repository import ScreeningRepository


def test_repository_crud_and_movie_filter():
    mongo_uri = os.getenv("TEST_MONGODB_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017"
    db_name = f"test_screenings_{uuid.uuid4().hex}"

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
    try:
        client.admin.command("ping")
    except Exception as exc:
        pytest.skip(f"mongodb unavailable: {exc}")

    try:
        db = client[db_name]
        repo = ScreeningRepository(db)

        created = repo.create(
            {
                "movie_id": "movie-001",
                "screening_date": "2026-04-02",
                "screening_time": "19:30",
                "hall": "Hall 1",
                "total_seats": 120,
            }
        )
        assert created["id"]

        got = repo.get_by_id(created["id"])
        assert got["movie_id"] == "movie-001"

        movie_items = repo.list_by_movie_id("movie-001")
        assert len(movie_items) == 1

        updated = repo.update(
            created["id"],
            {
                "movie_id": "movie-001",
                "screening_date": "2026-04-02",
                "screening_time": "20:00",
                "hall": "Hall 2",
                "total_seats": 100,
            },
        )
        assert updated["hall"] == "Hall 2"

        all_items = repo.list_all()
        assert len(all_items) == 1

        assert repo.delete(created["id"]) is True
        assert repo.get_by_id(created["id"]) is None
    finally:
        client.drop_database(db_name)
        client.close()
