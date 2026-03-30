from __future__ import annotations

from app.models.screening import Screening
from app.repositories.screening_repository import ScreeningRepository


class ScreeningService:
    def __init__(self, repository: ScreeningRepository):
        self.repository = repository

    def create_screening(self, payload: dict) -> dict:
        screening = Screening.from_dict(payload)
        screening.validate()
        return self.repository.create(screening.to_document())

    def list_screenings(self) -> list[dict]:
        return self.repository.list_all()

    def get_screening(self, screening_id: str) -> dict | None:
        return self.repository.get_by_id(screening_id)

    def list_screenings_by_movie(self, movie_id: str) -> list[dict]:
        return self.repository.list_by_movie_id(movie_id)

    def update_screening(self, screening_id: str, payload: dict) -> dict | None:
        screening = Screening.from_dict(payload)
        screening.validate()
        return self.repository.update(screening_id, screening.to_document())

    def delete_screening(self, screening_id: str) -> bool:
        return self.repository.delete(screening_id)
