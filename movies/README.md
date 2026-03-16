# Movies Service

## Opis

Movies Service je mikrostoritev, odgovorna za upravljanje podatkov o filmih v sistemu za kino predstave in rezervacije sedežev.

Namen storitve je hranjenje in upravljanje osnovnih informacij o filmih, ki so prikazani v spletni aplikaciji in uporabljeni pri načrtovanju kino predstav.

---

## Odgovornosti storitve

Movies Service skrbi za:

- dodajanje novih filmov
- pregled seznama filmov
- pridobivanje podrobnosti o posameznem filmu
- posredovanje podatkov drugim storitvam

---

## Tehnologije

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: MongoDB (MongoDB Atlas)
- **Testing**: Jest
- **Logging**: Winston
- **API Documentation**: Swagger/OpenAPI

---

## Funkcionalnosti

### REST API Endpoints

- `POST /api/movies` - Ustvari nov film
- `GET /api/movies` - Pridobi vse filme (z možnostjo filtriranja po žanru in iskanja)
- `GET /api/movies/:id` - Pridobi film po ID
- `PUT /api/movies/:id` - Posodobi film
- `DELETE /api/movies/:id` - Izbriši film
- `GET /health` - Health check endpoint

### API Dokumentacija

Swagger dokumentacija je dostopna na: `http://localhost:3001/api-docs`

---

## Namestitev in zagon

### Predpogoji

- Node.js 18 ali novejši
- MongoDB Atlas cluster ali lokalni MongoDB
- npm ali yarn

### Namestitev

1. Klonirajte repozitorij:
```bash
cd movies
```

2. Namestite odvisnosti:
```bash
npm install
```

3. Ustvarite `.env` datoteko (kopirajte iz `.env.example`):
```bash
cp .env.example .env
```

4. Nastavite spremenljivke okolja v `.env`:
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/movies_db?retryWrites=true&w=majority
DB_NAME=movies_db
LOG_LEVEL=info
```

**Pomembno**: Zamenjajte `<username>`, `<password>` in `<cluster-url>` s svojimi MongoDB Atlas podatki.

5. Zaženite storitev:
```bash
npm start
```

Za razvoj z avtomatskim ponovnim zagonom:
```bash
npm run dev
```

Storitev bo dostopna na `http://localhost:3001`

---

## Docker

### Gradnja Docker slike

```bash
docker build -t movies-service .
```

### Zagon z Docker Compose

```bash
docker-compose up -d
```

Za lokalni MongoDB (za testiranje):
```bash
docker-compose --profile local up -d
```

---

## Testiranje

### Zagon testov

```bash
npm test
```

### Zagon testov z coverage reportom

```bash
npm test
```

Testi pokrivajo:
- Repository layer (CRUD operacije)
- REST API endpoints (vsi endpoints)

---

## Struktura projekta

```
movies/
├── src/
│   ├── config/          # Konfiguracija (database, swagger)
│   ├── controllers/     # Controllers za HTTP zahteve
│   ├── domain/          # Domain modeli (Movie)
│   ├── repositories/    # Data access layer
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── utils/           # Utilities (logger)
│   └── index.js         # Entry point
├── tests/
│   ├── repositories/    # Repository testi
│   └── routes/          # Route testi
├── .github/
│   └── workflows/       # GitHub Actions
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Logging

Storitev uporablja Winston za logging. Logi so shranjeni v:
- `logs/error.log` - samo napake
- `logs/combined.log` - vsi logi

V development načinu se logi izpisujejo tudi v konzolo.

---

## GitHub Actions

GitHub Actions workflow se izvede ob vsakem push na main/develop branch. Workflow:
- Zažene MongoDB container
- Namesti odvisnosti
- Zažene teste
- Naloži coverage reporte

---

## Primer podatkov

Storitve upravlja podatke, kot so:

- naslov filma (title)
- opis filma (description)
- žanr (genre)
- trajanje (duration)
- starostna omejitev (ageRating)
- datum izida (releaseDate) - opcijsko
- režiser (director) - opcijsko

---

## Komunikacija

Movies Service komunicira preko REST API.

### Primer uporabe:
- spletna aplikacija pridobi seznam filmov
- Screenings Service pridobi podatke o filmu za povezavo s predstavo

---

## Povezava z ostalimi storitvami

Movies Service:
- posreduje podatke spletni aplikaciji
- omogoča povezavo s storitvijo Screenings Service

---

## Arhitekturni pristop

Storitev sledi načelom čiste arhitekture:

- domena vsebuje poslovna pravila
- aplikacijski sloj vsebuje primere uporabe
- infrastruktura vsebuje dostop do podatkov
- API sloj omogoča komunikacijo z zunanjim svetom
