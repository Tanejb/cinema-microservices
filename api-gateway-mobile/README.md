# API Gateway Mobile

## Opis

Mobile API gateway je druga enotna vstopna tocka za odjemalce in je implementiran v drugi tehnologiji (Flask/Python).

## Namen

Gateway izpostavlja mobile-orientirane endpoint-e z drugacnimi payloadi:

- kompaktni seznami
- agregirani odzivi (`movie details + screenings`)
- reservations endpointi prek reservations HTTP bridge

## Endpointi

- `GET /health`
- `GET /api/mobile/home`
- `GET /api/mobile/movies`
- `GET /api/mobile/movies/{movie_id}/details`
- `GET /api/mobile/users/{user_id}/profile`
- `POST /api/mobile/reservations`
- `GET /api/mobile/reservations/{reservation_id}`
- `GET /api/mobile/reservations/screening/{screening_id}`
- `POST /api/mobile/reservations/{reservation_id}/cancel`
- `DELETE /api/mobile/reservations/{reservation_id}`

Swagger:

- `http://localhost:8081/api-docs/`

## Lokalni zagon

```bash
pip install -r requirements.txt
python run.py
```

## Testi

```bash
pytest -q
```
