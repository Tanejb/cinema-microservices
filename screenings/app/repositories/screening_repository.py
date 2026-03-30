from __future__ import annotations

from bson import ObjectId
from pymongo import ReturnDocument


class ScreeningRepository:
    def __init__(self, db):
        self.collection = db["screenings"]

    def create(self, document: dict) -> dict:
        result = self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return self._to_response(document)

    def list_all(self) -> list[dict]:
        items = []
        for doc in self.collection.find():
            items.append(self._to_response(doc))
        return items

    def get_by_id(self, screening_id: str) -> dict | None:
        if not ObjectId.is_valid(screening_id):
            return None
        doc = self.collection.find_one({"_id": ObjectId(screening_id)})
        return self._to_response(doc) if doc else None

    def list_by_movie_id(self, movie_id: str) -> list[dict]:
        items = []
        for doc in self.collection.find({"movie_id": movie_id}):
            items.append(self._to_response(doc))
        return items

    def update(self, screening_id: str, document: dict) -> dict | None:
        if not ObjectId.is_valid(screening_id):
            return None
        updated = self.collection.find_one_and_update(
            {"_id": ObjectId(screening_id)},
            {"$set": document},
            return_document=ReturnDocument.AFTER,
        )
        return self._to_response(updated) if updated else None

    def delete(self, screening_id: str) -> bool:
        if not ObjectId.is_valid(screening_id):
            return False
        result = self.collection.delete_one({"_id": ObjectId(screening_id)})
        return result.deleted_count == 1

    @staticmethod
    def _to_response(doc: dict | None) -> dict | None:
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "movie_id": doc["movie_id"],
            "screening_date": doc["screening_date"],
            "screening_time": doc["screening_time"],
            "hall": doc["hall"],
            "total_seats": doc["total_seats"],
        }
