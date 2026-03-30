from __future__ import annotations

import logging

from flask import Blueprint, request

from app.common.db import mongo
from app.repositories.screening_repository import ScreeningRepository
from app.services.screening_service import ScreeningService

screenings_bp = Blueprint("screenings", __name__)
logger = logging.getLogger(__name__)


def _service() -> ScreeningService:
    return ScreeningService(ScreeningRepository(mongo.get_db()))


@screenings_bp.post("")
def create_screening():
    """
    Create screening
    ---
    tags:
      - Screenings
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [movie_id, screening_date, screening_time, hall, total_seats]
          example:
            movie_id: movie-001
            screening_date: 2026-04-02
            screening_time: "19:30"
            hall: Hall 1
            total_seats: 120
    responses:
      201:
        description: Created screening
      400:
        description: Validation error
    """
    payload = request.get_json(silent=True) or {}
    try:
        created = _service().create_screening(payload)
        logger.info("Screening created: %s", created["id"])
        return {"success": True, "data": created}, 201
    except ValueError as exc:
        return {"success": False, "message": str(exc)}, 400


@screenings_bp.get("")
def list_screenings():
    """
    List screenings
    ---
    tags:
      - Screenings
    responses:
      200:
        description: List of screenings
    """
    data = _service().list_screenings()
    return {"success": True, "count": len(data), "data": data}, 200


@screenings_bp.get("/<screening_id>")
def get_screening(screening_id: str):
    """
    Get screening by id
    ---
    tags:
      - Screenings
    parameters:
      - in: path
        name: screening_id
        schema:
          type: string
        required: true
        example: 507f1f77bcf86cd799439011
    responses:
      200:
        description: Found screening
      404:
        description: Screening not found
    """
    screening = _service().get_screening(screening_id)
    if not screening:
        return {"success": False, "message": "Screening not found"}, 404
    return {"success": True, "data": screening}, 200


@screenings_bp.get("/movie/<movie_id>")
def list_screenings_by_movie(movie_id: str):
    """
    List screenings by movie
    ---
    tags:
      - Screenings
    parameters:
      - in: path
        name: movie_id
        schema:
          type: string
        required: true
        example: movie-001
    responses:
      200:
        description: List of movie screenings
    """
    data = _service().list_screenings_by_movie(movie_id)
    return {"success": True, "count": len(data), "data": data}, 200


@screenings_bp.put("/<screening_id>")
def update_screening(screening_id: str):
    """
    Update screening
    ---
    tags:
      - Screenings
    parameters:
      - in: path
        name: screening_id
        schema:
          type: string
        required: true
        example: 507f1f77bcf86cd799439011
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [movie_id, screening_date, screening_time, hall, total_seats]
          example:
            movie_id: movie-001
            screening_date: 2026-04-02
            screening_time: "21:00"
            hall: Hall 2
            total_seats: 100
    responses:
      200:
        description: Updated screening
      400:
        description: Validation error
      404:
        description: Screening not found
    """
    payload = request.get_json(silent=True) or {}
    try:
        updated = _service().update_screening(screening_id, payload)
    except ValueError as exc:
        return {"success": False, "message": str(exc)}, 400
    if not updated:
        return {"success": False, "message": "Screening not found"}, 404
    return {"success": True, "data": updated}, 200


@screenings_bp.delete("/<screening_id>")
def delete_screening(screening_id: str):
    """
    Delete screening
    ---
    tags:
      - Screenings
    parameters:
      - in: path
        name: screening_id
        schema:
          type: string
        required: true
    responses:
      200:
        description: Deleted
      404:
        description: Screening not found
    """
    deleted = _service().delete_screening(screening_id)
    if not deleted:
        return {"success": False, "message": "Screening not found"}, 404
    return {"success": True, "message": "Screening deleted successfully"}, 200
