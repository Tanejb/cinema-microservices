from app import create_app


class FakeResponse:
    def __init__(self, status_code, body):
        self.status_code = status_code
        self._body = body

    def json(self):
        return self._body


class FakeRestClient:
    def __init__(self):
        self.routes = {}

    def register(self, method, url, status_code, body):
        self.routes[(method, url)] = FakeResponse(status_code, body)

    def request(self, method, url, **kwargs):
        key = (method, url)
        if key not in self.routes:
            return FakeResponse(404, {"success": False, "message": "not found"})
        return self.routes[key]


def build_client(fake):
    app = create_app(rest_client=fake)
    app.config["TESTING"] = True
    return app.test_client()


def test_health():
    client = build_client(FakeRestClient())
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json()["service"] == "api-gateway-mobile"


def test_mobile_home_feed():
    fake = FakeRestClient()
    fake.register(
        "GET",
        "http://localhost:3001/api/movies",
        200,
        {"data": [{"id": "m1", "title": "Matrix", "genre": "Sci-Fi"}]},
    )
    fake.register(
        "GET",
        "http://localhost:3003/api/screenings",
        200,
        {"data": [{"id": "s1", "movie_id": "m1", "screening_date": "2026-05-01", "screening_time": "20:00", "hall": "Hall 1"}]},
    )
    client = build_client(fake)
    r = client.get("/api/mobile/home")
    assert r.status_code == 200
    body = r.get_json()
    assert body["data"]["featured_movies"][0]["id"] == "m1"


def test_movie_details_aggregate():
    fake = FakeRestClient()
    fake.register(
        "GET",
        "http://localhost:3001/api/movies/m1",
        200,
        {"data": {"id": "m1", "title": "Matrix"}},
    )
    fake.register(
        "GET",
        "http://localhost:3003/api/screenings/movie/m1",
        200,
        {"data": [{"id": "s1"}]},
    )
    client = build_client(fake)
    r = client.get("/api/mobile/movies/m1/details")
    assert r.status_code == 200
    assert r.get_json()["data"]["movie"]["id"] == "m1"
    assert len(r.get_json()["data"]["screenings"]) == 1


def test_create_reservation_bridge():
    fake = FakeRestClient()
    fake.register(
        "POST",
        "http://localhost:8080/api/web/reservations",
        201,
        {"success": True, "data": {"id": "r1"}},
    )
    client = build_client(fake)
    r = client.post(
        "/api/mobile/reservations",
        json={
            "screening_id": "s1",
            "seat_number": "A1",
            "user_name": "Test",
            "user_email": "t@example.com",
        },
    )
    assert r.status_code == 201
    assert r.get_json()["data"]["id"] == "r1"


def test_delete_reservation_soft_delete():
    fake = FakeRestClient()
    fake.register(
        "POST",
        "http://localhost:8080/api/web/reservations/r1/cancel",
        200,
        {"success": True, "data": {"id": "r1", "status": "cancelled"}},
    )
    client = build_client(fake)
    r = client.delete("/api/mobile/reservations/r1")
    assert r.status_code == 200
    assert r.get_json()["data"]["status"] == "cancelled"
