from dataclasses import dataclass
from typing import Any


@dataclass
class User:
    first_name: str
    last_name: str
    email: str

    @staticmethod
    def from_dict(data: dict[str, Any]) -> "User":
        return User(
            first_name=str(data.get("first_name", "")).strip(),
            last_name=str(data.get("last_name", "")).strip(),
            email=str(data.get("email", "")).strip().lower(),
        )

    def validate(self) -> None:
        if not self.first_name:
            raise ValueError("first_name is required")
        if not self.last_name:
            raise ValueError("last_name is required")
        if not self.email or "@" not in self.email:
            raise ValueError("valid email is required")

    def to_document(self) -> dict[str, str]:
        return {
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
        }
