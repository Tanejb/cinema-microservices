# Web Application (Micro Frontends)

## Opis

Spletna aplikacija je implementirana po slogu **Micro Frontends**:

- `host` aplikacija (shell)
- `movies` MFE
- `users` MFE
- `screenings` MFE
- `reservations` MFE

Host aplikacija prikazuje posamezen MFE po tabih (iframe kompozicija), vsak MFE pa vsebuje UI za testiranje endpointov prek `api-gateway-web`.

## Porti

- Host: `http://localhost:4310`
- Movies MFE: `http://localhost:4311`
- Users MFE: `http://localhost:4312`
- Screenings MFE: `http://localhost:4313`
- Reservations MFE: `http://localhost:4314`

## Lokalni zagon (brez Docker)

V 5 terminalih zaženite:

```bash
cd web-app/movies && npm run dev
cd web-app/users && npm run dev
cd web-app/screenings && npm run dev
cd web-app/reservations && npm run dev
cd web-app/host && npm run dev
```

## Docker zagon

Iz root mape projekta:

```bash
docker compose up -d --build web-movies web-users web-screenings web-reservations web-host
```
