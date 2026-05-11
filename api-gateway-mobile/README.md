# API Gateway Mobile

## Opis

Mobile API gateway je druga enotna vstopna tocka za odjemalce in je implementiran v drugi tehnologiji (Flask/Python).

## Namen

Gateway izpostavlja mobile-orientirane endpoint-e z drugacnimi payloadi:

- kompaktni seznami
- agregirani odzivi (`movie details + screenings`)
- reservations endpointi prek reservations HTTP bridge

Za **odpornost** in **observabilnost** sta implementirana ista vzorca kot pri web gatewayu (podrobnosti v razdelkih spodaj):

1. **Correlation ID** (`X-Request-Id`)
2. **Circuit breaker**

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

---

## Correlation ID (sledljivost zahtevkov)

**Correlation ID** je skupni identifikator enega logičnega zahtevka. Mobile gateway ga izvaja prek glave **`X-Request-Id`** (glej tudi Swagger `http://localhost:8081/api-docs/`).

### Obnašanje

- Če odjemalec pošlje **`X-Request-Id`**, ga gateway **ohrani**; sicer ustvari **UUID**.
- Isti ID je v odgovoru v glavi **`X-Request-Id`**.
- Pri klicih z **`requests`** se ID posreduje naprej do REST mikrostoritev; pri rezervacijah gre promet prek **HTTP bridge** do web gatewaya, kjer se vzorec nadaljuje (vključno z gRPC do reservations).

### Kje ID vidiš

Enako kot pri direktnem klicu web gatewaya: npr. **`requestId`** v `movies/logs/combined.log`, **`request_id`** v logih users/screenings, gRPC log reservations — ob predvidenem prehodu skozi verigo storitev.

### Preverjanje

V Swagger UI nastavi **`X-Request-Id`** in primerjaj z logi downstream storitev za isti zahtevek.

---

## Circuit breaker

Mobile gateway za outbound promet vodi **ločene** circuit breakerje za **movies**, **users**, **screenings** in **reservations** (HTTP bridge do web gatewaya). Obnašanje je enako kot pri web gatewayu: po dovolj zaporednih neuspehih vezje **odpre** odzive do odjemalca pa so **503** z `reason: "circuit_open"` in glavo **`Retry-After`**.

### Zakaj privzeto 5 zaporednih napak

Število **5** je zgolj **privzeta vrednost** v kodi: en sam neuspeh ne sme takoj sprožiti „odklopa“, več zaporednih pa pomeni verjetnejši izpad storitve. Prag nastavi **`CIRCUIT_BREAKER_ERROR_THRESHOLD`**, čas do poskusa obnove **`CIRCUIT_BREAKER_RESET_MS`** (privzeto `15000` ms).

Kot neuspeh se štejejo **izjeme** pri `requests` klicu in **HTTP status ≥ 500** v odgovoru downstreama.

### Ročno preverjanje

Enako kot pri web stacku: ustavi npr. `movies-service`, pošlji dovolj zaporednih zahtev na `GET /api/mobile/movies` glede na prag; nato pričakuj **503** z `circuit_open`.

### Možne nadgradnje

Metrike, javno stanje vezij, finejša politika po endpointu, retry z omejitvijo samo v half-open fazi.
