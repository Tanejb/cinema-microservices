from unittest.mock import patch

from app import create_app


def _client():
    app = create_app(testing=True)
    return app.test_client()


def test_health():
    client = _client()
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json()["service"] == "users-service"


@patch("app.api.users_routes._service")
def test_create_user_validation_error(mock_service):
    mock_service.return_value.create_user.side_effect = ValueError("valid email is required")
    client = _client()
    resp = client.post("/api/users", json={"first_name": "A"})
    assert resp.status_code == 400
    assert resp.get_json()["success"] is False


@patch("app.api.users_routes._service")
def test_create_user_duplicate_email(mock_service):
    from app.exceptions import DuplicateEmailError

    mock_service.return_value.create_user.side_effect = DuplicateEmailError(
        "Email already registered"
    )
    client = _client()
    resp = client.post(
        "/api/users",
        json={"first_name": "A", "last_name": "B", "email": "dup@example.com"},
    )
    assert resp.status_code == 409
    assert resp.get_json()["success"] is False


@patch("app.api.users_routes._service")
def test_create_user_success(mock_service):
    mock_service.return_value.create_user.return_value = {
        "id": "abc",
        "first_name": "Ana",
        "last_name": "Novak",
        "email": "ana@example.com",
    }
    client = _client()
    resp = client.post(
        "/api/users",
        json={"first_name": "Ana", "last_name": "Novak", "email": "ana@example.com"},
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"]["id"] == "abc"


@patch("app.api.users_routes._service")
def test_list_users(mock_service):
    mock_service.return_value.get_users.return_value = [
        {"id": "1", "first_name": "A", "last_name": "B", "email": "a@b.com"}
    ]
    client = _client()
    resp = client.get("/api/users")
    assert resp.status_code == 200
    assert resp.get_json()["count"] == 1
