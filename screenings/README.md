# Screenings Service

## Opis

Screenings Service je mikrostoritev, odgovorna za upravljanje kino predstav in terminov predvajanja filmov.

Namen storitve je povezava med filmi in konkretnimi termini predvajanja, ki jih uporabnik vidi v spletni aplikaciji.

---

## Odgovornosti storitve

Screenings Service skrbi za:

- ustvarjanje terminov predvajanj
- pregled vseh predstav
- pregled predstav za posamezen film
- upravljanje podatkov o dvorani in času predvajanja

---

## Primer podatkov

Storitev upravlja podatke, kot so:

- identifikator filma
- datum predstave
- ura predstave
- dvorana
- število sedežev

---

## Komunikacija

Screenings Service komunicira preko REST API.

### Primer uporabe:
- spletna aplikacija pridobi termine predstav za izbran film
- Reservations Service preveri podatke o izbranem terminu
- storitev po potrebi pridobi podatke o filmu iz Movies Service

---

## Povezava z ostalimi storitvami

Screenings Service:
- uporablja podatke iz Movies Service
- posreduje termine spletni aplikaciji
- omogoča podatke storitvi Reservations Service

---

## Arhitekturni pristop

Storitev sledi načelom čiste arhitekture:

- domena opisuje poslovni koncept kino predstave
- aplikacijski sloj vsebuje logiko upravljanja terminov
- infrastruktura skrbi za podatkovno bazo
- API sloj omogoča dostop do funkcionalnosti storitve

---

## Implementacija (tekoce)

- REST API za upravljanje terminov predstav
- OpenAPI/Swagger: `/api-docs/`
- MongoDB hramba podatkov (`screenings` kolekcija)
- Logiranje HTTP zahtev in napak
- Testi:
  - endpoint testi (`tests/test_screenings_api.py`)
  - repository integracijski testi (`tests/test_screening_repository_integration.py`)

---

## Lokalni zagon

```bash
python run.py
```

- API: `http://localhost:3003`
- Swagger: `http://localhost:3003/api-docs/`

### Testi

```bash
pytest -q
```

### Docker

```bash
docker compose up -d
```

- Service: `screenings-service`
- MongoDB host povezava: `mongodb://localhost:27020`
