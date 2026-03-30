from unittest.mock import patch

from app import create_app


def _client():
    app = create_app(testing=True)
    return app.test_client()


def test_health():
    resp = _client().get("/health")
    assert resp.status_code == 200
    assert resp.get_json()["service"] == "screenings-service"


@patch("app.api.screenings_routes._service")
def test_create_screening_validation_error(mock_service):
    mock_service.return_value.create_screening.side_effect = ValueError("movie_id is required")
    resp = _client().post("/api/screenings", json={})
    assert resp.status_code == 400
    assert resp.get_json()["success"] is False


@patch("app.api.screenings_routes._service")
def test_create_screening_success(mock_service):
    mock_service.return_value.create_screening.return_value = {
        "id": "abc",
        "movie_id": "movie-001",
        "screening_date": "2026-04-02",
        "screening_time": "19:30",
        "hall": "Hall 1",
        "total_seats": 120,
    }
    resp = _client().post(
        "/api/screenings",
        json={
            "movie_id": "movie-001",
            "screening_date": "2026-04-02",
            "screening_time": "19:30",
            "hall": "Hall 1",
            "total_seats": 120,
        },
    )
    assert resp.status_code == 201
    assert resp.get_json()["data"]["id"] == "abc"


@patch("app.api.screenings_routes._service")
def test_list_screenings(mock_service):
    mock_service.return_value.list_screenings.return_value = [
        {
            "id": "1",
            "movie_id": "movie-001",
            "screening_date": "2026-04-02",
            "screening_time": "19:30",
            "hall": "Hall 1",
            "total_seats": 120,
        }
    ]
    resp = _client().get("/api/screenings")
    assert resp.status_code == 200
    assert resp.get_json()["count"] == 1


@patch("app.api.screenings_routes._service")
def test_get_screening_not_found(mock_service):
    mock_service.return_value.get_screening.return_value = None
    resp = _client().get("/api/screenings/507f1f77bcf86cd799439011")
    assert resp.status_code == 404


@patch("app.api.screenings_routes._service")
def test_get_screening_success(mock_service):
    mock_service.return_value.get_screening.return_value = {
        "id": "507f1f77bcf86cd799439011",
        "movie_id": "movie-001",
        "screening_date": "2026-04-02",
        "screening_time": "19:30",
        "hall": "Hall 1",
        "total_seats": 120,
    }
    resp = _client().get("/api/screenings/507f1f77bcf86cd799439011")
    assert resp.status_code == 200
    assert resp.get_json()["data"]["movie_id"] == "movie-001"


@patch("app.api.screenings_routes._service")
def test_list_screenings_by_movie(mock_service):
    mock_service.return_value.list_screenings_by_movie.return_value = [
        {"id": "1", "movie_id": "movie-001", "screening_date": "2026-04-02", "screening_time": "19:30", "hall": "Hall 1", "total_seats": 120}
    ]
    resp = _client().get("/api/screenings/movie/movie-001")
    assert resp.status_code == 200
    assert resp.get_json()["count"] == 1


@patch("app.api.screenings_routes._service")
def test_update_screening_validation_error(mock_service):
    mock_service.return_value.update_screening.side_effect = ValueError("hall is required")
    resp = _client().put("/api/screenings/507f1f77bcf86cd799439011", json={})
    assert resp.status_code == 400


@patch("app.api.screenings_routes._service")
def test_update_screening_not_found(mock_service):
    mock_service.return_value.update_screening.return_value = None
    resp = _client().put(
        "/api/screenings/507f1f77bcf86cd799439011",
        json={
            "movie_id": "movie-001",
            "screening_date": "2026-04-02",
            "screening_time": "20:00",
            "hall": "Hall 2",
            "total_seats": 100,
        },
    )
    assert resp.status_code == 404


@patch("app.api.screenings_routes._service")
def test_update_screening_success(mock_service):
    mock_service.return_value.update_screening.return_value = {
        "id": "507f1f77bcf86cd799439011",
        "movie_id": "movie-001",
        "screening_date": "2026-04-02",
        "screening_time": "20:00",
        "hall": "Hall 2",
        "total_seats": 100,
    }
    resp = _client().put(
        "/api/screenings/507f1f77bcf86cd799439011",
        json={
            "movie_id": "movie-001",
            "screening_date": "2026-04-02",
            "screening_time": "20:00",
            "hall": "Hall 2",
            "total_seats": 100,
        },
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["hall"] == "Hall 2"


@patch("app.api.screenings_routes._service")
def test_delete_screening_not_found(mock_service):
    mock_service.return_value.delete_screening.return_value = False
    resp = _client().delete("/api/screenings/507f1f77bcf86cd799439011")
    assert resp.status_code == 404


@patch("app.api.screenings_routes._service")
def test_delete_screening_success(mock_service):
    mock_service.return_value.delete_screening.return_value = True
    resp = _client().delete("/api/screenings/507f1f77bcf86cd799439011")
    assert resp.status_code == 200
