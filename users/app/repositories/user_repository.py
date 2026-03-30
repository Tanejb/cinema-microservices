from __future__ import annotations

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.exceptions import DuplicateEmailError


class UserRepository:
    def __init__(self, db):
        self.collection = db["users"]

    def ensure_indexes(self) -> None:
        self.collection.create_index([("email", 1)], unique=True, name="uniq_user_email")

    def create(self, document: dict) -> dict:
        try:
            result = self.collection.insert_one(document)
        except DuplicateKeyError as exc:
            raise DuplicateEmailError("Email already registered") from exc
        document["_id"] = result.inserted_id
        return self._to_response(document)

    def list_all(self) -> list[dict]:
        users = []
        for doc in self.collection.find():
            users.append(self._to_response(doc))
        return users

    def get_by_id(self, user_id: str) -> dict | None:
        if not ObjectId.is_valid(user_id):
            return None
        doc = self.collection.find_one({"_id": ObjectId(user_id)})
        return self._to_response(doc) if doc else None

    def update(self, user_id: str, document: dict) -> dict | None:
        if not ObjectId.is_valid(user_id):
            return None
        try:
            updated = self.collection.find_one_and_update(
                {"_id": ObjectId(user_id)},
                {"$set": document},
                return_document=ReturnDocument.AFTER,
            )
        except DuplicateKeyError as exc:
            raise DuplicateEmailError("Email already registered") from exc
        return self._to_response(updated) if updated else None

    @staticmethod
    def _to_response(doc: dict | None) -> dict | None:
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "first_name": doc["first_name"],
            "last_name": doc["last_name"],
            "email": doc["email"],
        }
