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

Ta komponenta trenutno predstavlja **web API gateway**. Za odpornost in observabilnost sta implementirana dva vzorca:

1. **Correlation ID** (`X-Request-Id`) — en ID za celoten zahtevek skozi gateway in mikrostoritve.
2. **Circuit breaker** — zaščita pred neomejenim ponavljanjem klicev v nedosegljiv ali napako vračajoč downstream.

Tehnične podrobnosti sta v spodnjih razdelkih.

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

---

## Correlation ID (sledljivost zahtevkov)

**Correlation ID** je skupni identifikator enega logičnega zahtevka, ki poteka skozi več procesov. V tem projektu ga nosi HTTP glava **`X-Request-Id`**.

### Obnašanje web gatewaya

- Če odjemalec pošlje **`X-Request-Id`**, ga gateway **ohrani** in uporabi kot ID zahtevka.
- Če glava manjka ali je prazna, gateway ustvari **nov UUID**.
- Isti ID je v odgovoru v glavi **`X-Request-Id`** in se posreduje naprej:
  - pri **REST** proxy klicih kot glava do movies / users / screenings,
  - pri **gRPC** klicih do reservations kot metadata **`x-request-id`**.

### Kje ID vidiš v logih

Odvisno od storitve (isti niz, različni zapisi):

- **movies-service:** strukturiran log (npr. `movies/logs/combined.log`) — polje **`requestId`**.
- **users-service** in **screenings-service:** običajni logi (npr. `docker compose logs`) — vrstice z **`request_id=...`**.
- **reservations-service (gRPC):** log vrstice z **`request_id=...`** ob klicu.

### Preverjanje

- Swagger UI (`/api-docs`): pri operacijah je parameter **`X-Request-Id`**; nastavi npr. `swagger-trace-001` in preveri odgovorno glavo ter zgoraj omenjene loge.
- Zunanji odjemalec: poljuben HTTP klient z glavo `X-Request-Id`.

---

## Circuit breaker

Gateway za vsako downstream celino (**movies**, **users**, **screenings**, **reservations**) vodi **lasten** circuit breaker. Namen je, da ob dolgotrajni nedostopnosti storitve ne pošiljamo neomejeno novih zahtev v prazno (ščitimo padlo storitev in stabilnost gatewaya).

### Zakaj privzeto 5 zaporednih napak

Število **5** je **privzeta konfiguracija**, ne fizikalni zakon:

- ena sama napaka (omrežni šum, kratkotrajni restart kontejnerja) **ne sme** takoj odpreti vezja, sicer bi uporabniki dobivali `503` brez resne potrebe;
- **pet zaporednih** neuspehov je smiseln kompromis med občutljivostjo in odzivnostjo: jasen signal, da gre verjetno za resnejši izpad, ne za enkratni glitch.

Mejo lahko poljubno spremeniš z okoljem (npr. `2` za hitrejše demonstracije v laboratoriju).

### Kaj šteje kot neuspeh

- **REST proxy (axios):** izjema pri klicu (npr. povezava zavrnjena) ali **HTTP status ≥ 500** v odgovoru mikrostoritve.
- **Reservations (gRPC):** zavrnjena operacija (napaka v gRPC klicu).

Uspešni odgovori z **4xx** (npr. 404) **ne** odpirajo vezja, ker to pomeni, da je storitev živa in je le zavrnila zahtevo.

### Odzivi do odjemalca

- **502** – zahteva je bila posredovana naprej, downstream je spodletel (npr. napaka gRPC).
- **503** z `reason: "circuit_open"` – vezje je **odprto**; klic do te celote se **sploh ne izvede**; v glavi je še **`Retry-After`** (sekunde do priporčenega ponovnega poskusa).

Po poteku časa resetiranja gateway dovoli **en poskus** (half-open); ob uspehu se vezje zapre, ob neuspehu spet odpre.

### Okoljske spremenljivke

| Spremenljivka | Privzeto | Pomen |
|---------------|----------|--------|
| `CIRCUIT_BREAKER_ERROR_THRESHOLD` | `5` | Po koliko **zaporednih** neuspehih se vezje odpre. |
| `CIRCUIT_BREAKER_RESET_MS` | `15000` | Po koliko ms brez odprtja polja za poskus obnove (half-open). |

### Ročno preverjanje (Docker)

1. Znižaj prag npr. na `2` v `docker-compose.yml` pri storitvi `api-gateway-web` (opcijsko).
2. Ustavi mikrostoritev, npr. `docker compose stop movies-service`.
3. Večkrat pokliči `GET http://localhost:8080/api/web/movies` – po dosegu praga naslednji odgovor vsebuje `circuit_open` in status **503**.

### Možne nadgradnje (niso del obveznega obsega tega repozitorija)

Če bi projekt še razširili: metrike/stanje vezij (npr. lastni health z breaker state), backoff retry samo v half-open, ločeni pragovi po poti, centraliziran rate limit.
