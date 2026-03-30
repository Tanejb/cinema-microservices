from unittest.mock import MagicMock, patch

import pytest

from app.exceptions import DuplicateEmailError
from app.services.user_service import UserService


def test_create_user_publishes_event():
    repo = MagicMock()
    repo.create.return_value = {
        "id": "507f1f77bcf86cd799439011",
        "first_name": "A",
        "last_name": "B",
        "email": "a@b.com",
    }
    with patch("app.services.user_service.publish_user_event") as pub:
        svc = UserService(repo)
        out = svc.create_user(
            {"first_name": "A", "last_name": "B", "email": "a@b.com"}
        )
    assert out["id"] == "507f1f77bcf86cd799439011"
    pub.assert_called_once()
    assert pub.call_args[0][0] == "user.created"
    assert pub.call_args[0][1]["email"] == "a@b.com"


def test_update_user_publishes_on_success():
    repo = MagicMock()
    repo.update.return_value = {
        "id": "507f1f77bcf86cd799439011",
        "first_name": "A",
        "last_name": "B",
        "email": "new@b.com",
    }
    with patch("app.services.user_service.publish_user_event") as pub:
        svc = UserService(repo)
        svc.update_user(
            "507f1f77bcf86cd799439011",
            {"first_name": "A", "last_name": "B", "email": "new@b.com"},
        )
    pub.assert_called_once()
    assert pub.call_args[0][0] == "user.updated"


def test_create_user_propagates_duplicate_email():
    repo = MagicMock()
    repo.create.side_effect = DuplicateEmailError("Email already registered")
    svc = UserService(repo)
    with pytest.raises(DuplicateEmailError):
        svc.create_user({"first_name": "A", "last_name": "B", "email": "dup@b.com"})
