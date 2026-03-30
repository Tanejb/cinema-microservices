from dataclasses import dataclass
from typing import Any


@dataclass
class Screening:
    movie_id: str
    screening_date: str
    screening_time: str
    hall: str
    total_seats: int

    @staticmethod
    def from_dict(data: dict[str, Any]) -> "Screening":
        return Screening(
            movie_id=str(data.get("movie_id", "")).strip(),
            screening_date=str(data.get("screening_date", "")).strip(),
            screening_time=str(data.get("screening_time", "")).strip(),
            hall=str(data.get("hall", "")).strip(),
            total_seats=int(data.get("total_seats", 0)),
        )

    def validate(self) -> None:
        if not self.movie_id:
            raise ValueError("movie_id is required")
        if not self.screening_date:
            raise ValueError("screening_date is required")
        if not self.screening_time:
            raise ValueError("screening_time is required")
        if not self.hall:
            raise ValueError("hall is required")
        if self.total_seats <= 0:
            raise ValueError("total_seats must be greater than 0")

    def to_document(self) -> dict[str, Any]:
        return {
            "movie_id": self.movie_id,
            "screening_date": self.screening_date,
            "screening_time": self.screening_time,
            "hall": self.hall,
            "total_seats": self.total_seats,
        }
