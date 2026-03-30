from __future__ import annotations

from app.messaging.events import publish_user_event
from app.models.user import User
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def create_user(self, payload: dict) -> dict:
        user = User.from_dict(payload)
        user.validate()
        created = self.repository.create(user.to_document())
        publish_user_event(
            "user.created",
            {"user_id": created["id"], "email": created["email"]},
        )
        return created

    def get_users(self) -> list[dict]:
        return self.repository.list_all()

    def get_user_by_id(self, user_id: str) -> dict | None:
        return self.repository.get_by_id(user_id)

    def update_user(self, user_id: str, payload: dict) -> dict | None:
        user = User.from_dict(payload)
        user.validate()
        updated = self.repository.update(user_id, user.to_document())
        if updated:
            publish_user_event(
                "user.updated",
                {"user_id": updated["id"], "email": updated["email"]},
            )
        return updated
