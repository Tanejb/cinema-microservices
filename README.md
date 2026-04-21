# Cinema Microservices

## Opis sistema

Cinema Microservices je mikrostoritveni sistem za upravljanje kino predstav, uporabnikov in rezervacij sedežev. Sistem omogoča pregled filmov, upravljanje terminov predvajanj, registracijo oziroma evidenco uporabnikov ter rezervacijo sedežev za izbrane predstave preko spletne aplikacije.

Sistem je zasnovan po principih mikrostoritvene arhitekture, kjer so posamezne funkcionalnosti razdeljene na ločene storitve. Vsaka storitev je odgovorna za svojo domeno in komunicira z ostalimi storitvami preko jasno definiranih API-jev.

Cilj sistema je prikazati uporabo mikrostoritvene arhitekture, načel čiste arhitekture (Clean Architecture) ter pregledno strukturo repozitorija.

---

## Poslovni problem

Kinematografi morajo učinkovito upravljati katalog filmov, razpored predvajanj, uporabniške podatke in rezervacije sedežev. Brez ustreznega sistema je upravljanje teh podatkov nepregledno in lahko povzroča težave pri organizaciji predstav, vodenju uporabnikov in rezervacijah.

Ta sistem omogoča:

- upravljanje kataloga filmov
- upravljanje terminov predvajanj
- upravljanje uporabnikov
- rezervacijo sedežev za posamezne predstave
- pregled informacij preko spletnega uporabniškega vmesnika

Sistem je razdeljen na več mikrostoritev, ki so odgovorne za posamezne poslovne domene.

---

## Arhitektura sistema

Sistem je sestavljen iz štirih mikrostoritev, API Gateway komponente in ene spletne aplikacije.

Glavne komponente sistema so:

- API Gateway
- User Service
- Movies Service
- Screenings Service
- Reservations Service
- Web Application

Spletna aplikacija deluje kot uporabniški vmesnik, ki komunicira z API Gateway komponento. API Gateway predstavlja enotno vstopno točko v sistem in usmerja zahteve do ustreznih mikrostoritev.

Vsaka mikrostoritev upravlja svojo domeno in podatke, kar omogoča večjo modularnost, ohlapno sklopljenost in lažje vzdrževanje sistema.

---

## Mikrostoritve

### API Gateway

API Gateway predstavlja enotno vstopno točko za dostop do mikrostoritev.

Njegove odgovornosti so:
- sprejem zahtev iz spletne aplikacije
- usmerjanje zahtev do ustreznih storitev
- poenoten dostop do sistema

---

### User Service

User Service je odgovoren za upravljanje uporabnikov sistema.

Funkcionalnosti:
- ustvarjanje uporabnikov
- pregled uporabniških podatkov
- pridobivanje podatkov o posameznem uporabniku

Primer podatkov:
- ime
- priimek
- elektronski naslov

---

### Movies Service

Movies Service je odgovoren za upravljanje podatkov o filmih.

Funkcionalnosti:
- dodajanje filmov
- pregled kataloga filmov
- pridobivanje informacij o posameznem filmu

Primer podatkov:
- naslov
- opis
- žanr
- trajanje

---

### Screenings Service

Screenings Service je odgovoren za upravljanje terminov predvajanj filmov v kinu.

Funkcionalnosti:
- ustvarjanje terminov predvajanja
- pregled razporeda predstav
- povezava med filmom in terminom predvajanja

Primer podatkov:
- film
- datum in čas
- dvorana
- število sedežev

---

### Reservations Service

Reservations Service je odgovoren za upravljanje rezervacij sedežev za posamezne predstave.

Funkcionalnosti:
- ustvarjanje rezervacije
- pregled rezervacij
- preverjanje razpoložljivosti sedežev

Primer podatkov:
- uporabnik
- termin predstave
- sedež
- status rezervacije

---

### Web Application

Spletna aplikacija predstavlja uporabniški vmesnik sistema.

Uporabnikom omogoča:
- pregled filmov
- ogled terminov predstav
- prijavo oziroma pregled uporabniških podatkov
- rezervacijo sedežev

Spletna aplikacija komunicira z API Gateway komponento preko HTTP/HTTPS zahtev.

---

## Komunikacija med storitvami

Komunikacija v sistemu poteka preko REST API.

Primer poteka:

1. Uporabnik dostopa do spletne aplikacije.
2. Spletna aplikacija pošlje zahtevo na API Gateway.
3. API Gateway zahtevo usmeri do ustrezne mikrostoritve.
4. Movies Service vrne seznam filmov.
5. Screenings Service vrne termine za izbran film.
6. User Service vrne podatke o uporabniku.
7. Reservations Service ustvari rezervacijo za izbrani termin.

---

## Diagram arhitekture

```mermaid
flowchart LR
    U[Uporabnik] -->|HTTPS| W[Spletna aplikacija]
    W -->|HTTP/HTTPS| G[API Gateway]

    subgraph Sistem za upravljanje kino predstav
        G -->|REST API| US[User Service]
        G -->|REST API| M[Movies Service]
        G -->|REST API| S[Screenings Service]
        G -->|REST API| R[Reservations Service]

        US --> UDB[(Users DB)]
        M --> MDB[(Movies DB)]
        S --> SDB[(Screenings DB)]
        R --> RDB[(Reservations DB)]

        S -->|REST API| M
        R -->|REST API| S
        R -->|REST API| US
    end
```

---

## Struktura repozitorija

Repozitorij je organiziran po principu "screaming architecture", kjer imena map predstavljajo poslovne koncepte sistema.

```text
cinema-microservices/
│
├── api-gateway/      # enotna vstopna točka v sistem
├── users/     # mikrostoritev za upravljanje uporabnikov
├── movies/           # mikrostoritev za upravljanje filmov
├── screenings/       # mikrostoritev za termine predvajanj
├── reservations/     # mikrostoritev za rezervacije sedežev
├── web-app/          # spletni uporabniški vmesnik
│
├── docs/             # dodatna dokumentacija
└── README.md         # opis sistema in arhitekture
```

Vsaka mikrostoritev vsebuje svojo poslovno logiko, API sloj in infrastrukturo.

---

## Lokalni zagon vseh storitev

Za zagon celotnega sistema z eno MongoDB instanco in enim RabbitMQ brokerjem uporabite root `docker-compose.yml`.

```bash
docker compose up -d --build
```

Privzeti lokalni porti:
- Movies Service: `http://localhost:3001`
- Users Service: `http://localhost:3002`
- Screenings Service: `http://localhost:3003`
- Reservations Service (gRPC): `localhost:50051`
- API Gateway Web (Node.js): `http://localhost:8080`
- API Gateway Mobile (Flask): `http://localhost:8081`
- Web Host (Micro Frontends): `http://localhost:4310`
- Web Movies MFE: `http://localhost:4311`
- Web Users MFE: `http://localhost:4312`
- Web Screenings MFE: `http://localhost:4313`
- Web Reservations MFE: `http://localhost:4314`
- MongoDB: `mongodb://localhost:27017`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ UI: `http://localhost:15672`

Vse storitve uporabljajo isti MongoDB strežnik (`mongo:27017` znotraj Docker omrežja), vendar ločene baze (`movies_db`, `users_db`, `screenings_db`, `reservations_db`).

---

## Arhitekturna načela

Pri razvoju sistema sledimo načelom čiste arhitekture (Clean Architecture):

- poslovna logika je ločena od infrastrukture
- mikrostoritve so neodvisne
- komunikacija poteka preko jasno definiranih API-jev
- odvisnosti tečejo od zunanjih slojev proti domeni
- struktura repozitorija jasno odraža poslovne koncepte sistema

---

## CI/CD DockerHub publish

Workflow `.github/workflows/dockerhub-publish.yml` ob vsakem `push` na `main`:

- zgradi Docker slike vseh komponent sistema
- objavi slike na DockerHub namespace `tanej666`
- za vsako komponento objavi taga `latest` in `sha-<commit>`

Pred uporabo v GitHub repozitoriju nastavite naslednja secrets:

- `DOCKERHUB_USERNAME` -> npr. `tanej666`
- `DOCKERHUB_TOKEN` -> DockerHub access token

Priporoceni DockerHub repozitoriji:

- `tanej666/cinema-movies-service`
- `tanej666/cinema-users-service`
- `tanej666/cinema-users-worker`
- `tanej666/cinema-screenings-service`
- `tanej666/cinema-reservations-service`
- `tanej666/cinema-api-gateway-web`
- `tanej666/cinema-api-gateway-mobile`
- `tanej666/cinema-frontend-host`
- `tanej666/cinema-frontend-movies`
- `tanej666/cinema-frontend-users`
- `tanej666/cinema-frontend-screenings`
- `tanej666/cinema-frontend-reservations`
