# API Gateway

## Opis

API Gateway predstavlja enotno vstopno točko v mikrostoritveni sistem za upravljanje kino predstav in rezervacij sedežev.

Namen API Gateway komponente je poenostaviti komunikacijo med spletno aplikacijo in posameznimi mikrostoritvami.

---

## Odgovornosti komponente

API Gateway skrbi za:

- sprejem zahtev iz spletne aplikacije
- usmerjanje zahtev do ustreznih mikrostoritev
- centralizirano dostopno točko do sistema

---

## Povezane mikrostoritve

API Gateway posreduje zahteve naslednjim storitvam:

- Users Service
- Movies Service
- Screenings Service
- Reservations Service

---

## Primer poteka

1. uporabnik dostopa do spletne aplikacije
2. spletna aplikacija pošlje zahtevo na API Gateway
3. API Gateway zahtevo usmeri do ustrezne mikrostoritve
4. mikrostoritev obdela zahtevo in vrne odgovor
5. API Gateway vrne odgovor spletni aplikaciji

---

## Komunikacija

Komunikacija med API Gateway in mikrostoritvami poteka preko REST API.

API Gateway ne vsebuje poslovne logike, ampak skrbi predvsem za:

- usmerjanje zahtev
- povezovanje storitev
- poenoten dostop do sistema

---

## Web Gateway (implementacija)

Ta komponenta trenutno predstavlja **web API gateway**:

- tece na portu `8080`
- Swagger: `http://localhost:8080/api-docs`
- REST proxy do:
  - `movies-service` (`/api/web/movies`)
  - `users-service` (`/api/web/users`)
  - `screenings-service` (`/api/web/screenings`)
- gRPC bridge do `reservations-service`:
  - `POST /api/web/reservations`
  - `GET /api/web/reservations/:id`
  - `GET /api/web/reservations/screening/:screeningId`
  - `POST /api/web/reservations/:id/cancel`

### Lokalni zagon

```bash
npm install
npm start
```

### Testi

```bash
npm test
```
