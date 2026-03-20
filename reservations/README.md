# Reservations Service

## Opis

Reservations Service je mikrostoritev, odgovorna za upravljanje rezervacij sedežev za kino predstave.

Namen storitve je omogočiti uporabniku rezervacijo sedeža za izbrani termin predstave in zagotoviti osnovno evidenco rezervacij.

---

## Odgovornosti storitve

Reservations Service skrbi za:

- ustvarjanje novih rezervacij
- pregled obstoječih rezervacij
- preverjanje razpoložljivosti sedežev
- shranjevanje podatkov o uporabniku in izbrani predstavi

---

## Primer podatkov

Storitev upravlja podatke, kot so:

- identifikator predstave
- številka sedeža
- ime uporabnika
- elektronski naslov uporabnika
- status rezervacije

---

## Komunikacija

Reservations Service komunicira preko gRPC (`ReservationsService`).

### Primer uporabe:
- spletna aplikacija pošlje zahtevo za rezervacijo sedeža
- storitev preveri, ali izbrani termin obstaja
- storitev preveri, ali je sedež že rezerviran
- nato ustvari novo rezervacijo

---

## Povezava z ostalimi storitvami

Reservations Service:
- uporablja podatke iz Screenings Service
- posreduje podatke spletni aplikaciji
- upravlja rezervacije neodvisno od ostalih storitev

---

## Arhitekturni pristop

Storitev sledi načelom čiste arhitekture:

- domena vsebuje pravila rezervacij
- aplikacijski sloj vsebuje poslovno logiko rezerviranja
- infrastruktura skrbi za hrambo podatkov
- API sloj omogoča komunikacijo z drugimi deli sistema

---

## Lokalni zagon

### Zahteve

- Go 1.25+
- Lokalni MongoDB ali Docker

### Zagon storitve

```bash
go run ./cmd/server
```

Privzeta gRPC vrata: `50051`.

### Smoke gRPC client (demo)

Ko storitev teče, lahko pošljete testni gRPC klic:

```bash
go run ./cmd/client
```

Client pokliče `CreateReservation` in izpiše ustvarjeno rezervacijo.

### Testi

```bash
go test ./...
```

### Docker

```bash
docker compose up -d
```

To zažene `reservations-service` in `reservations-mongodb`.
