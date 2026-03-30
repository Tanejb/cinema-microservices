from __future__ import annotations

import logging

from flask import Blueprint, request

from app.common.db import mongo
from app.exceptions import DuplicateEmailError
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService

users_bp = Blueprint("users", __name__)
logger = logging.getLogger(__name__)


def _service() -> UserService:
    return UserService(UserRepository(mongo.get_db()))


@users_bp.post("")
def create_user():
    """
    Create user
    ---
    tags:
      - Users
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [first_name, last_name, email]
          example:
            first_name: Ana
            last_name: Novak
            email: ana.novak@example.com
          properties:
            first_name:
              type: string
              example: Ana
            last_name:
              type: string
              example: Novak
            email:
              type: string
              example: ana.novak@example.com
    responses:
      201:
        description: Created user
        examples:
          application/json:
            success: true
            data:
              id: 507f1f77bcf86cd799439011
              first_name: Ana
              last_name: Novak
              email: ana.novak@example.com
      400:
        description: Validation error
      409:
        description: Duplicate email
    """
    payload = request.get_json(silent=True) or {}
    try:
        created = _service().create_user(payload)
        logger.info("User created: %s", created["id"])
        return {"success": True, "data": created}, 201
    except DuplicateEmailError as exc:
        return {"success": False, "message": str(exc)}, 409
    except ValueError as exc:
        return {"success": False, "message": str(exc)}, 400


@users_bp.get("")
def list_users():
    """
    List users
    ---
    tags:
      - Users
    responses:
      200:
        description: List of users
    """
    users = _service().get_users()
    return {"success": True, "count": len(users), "data": users}, 200


@users_bp.get("/<user_id>")
def get_user(user_id: str):
    """
    Get user by id
    ---
    tags:
      - Users
    parameters:
      - in: path
        name: user_id
        schema:
          type: string
        required: true
        example: 507f1f77bcf86cd799439011
    responses:
      200:
        description: Found user
      404:
        description: User not found
    """
    user = _service().get_user_by_id(user_id)
    if not user:
        return {"success": False, "message": "User not found"}, 404
    return {"success": True, "data": user}, 200


@users_bp.put("/<user_id>")
def update_user(user_id: str):
    """
    Update user
    ---
    tags:
      - Users
    parameters:
      - in: path
        name: user_id
        schema:
          type: string
        required: true
        example: 507f1f77bcf86cd799439011
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [first_name, last_name, email]
          example:
            first_name: Ana
            last_name: Novak
            email: ana.updated@example.com
          properties:
            first_name:
              type: string
              example: Ana
            last_name:
              type: string
              example: Novak
            email:
              type: string
              example: ana.updated@example.com
    responses:
      200:
        description: Updated user
      400:
        description: Validation error
      404:
        description: User not found
      409:
        description: Duplicate email
    """
    payload = request.get_json(silent=True) or {}
    try:
        updated = _service().update_user(user_id, payload)
    except DuplicateEmailError as exc:
        return {"success": False, "message": str(exc)}, 409
    except ValueError as exc:
        return {"success": False, "message": str(exc)}, 400

    if not updated:
        return {"success": False, "message": "User not found"}, 404
    return {"success": True, "data": updated}, 200
