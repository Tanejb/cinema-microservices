# Cinema Microservices

## Opis sistema

Cinema Microservices je mikrostoritveni sistem za upravljanje kino predstav in rezervacij sedežev. Sistem omogoča pregled filmov, ogled terminov predvajanj ter rezervacijo sedežev za izbrane predstave preko spletne aplikacije.

Sistem je zasnovan po principih mikrostoritvene arhitekture, kjer so posamezne funkcionalnosti razdeljene na ločene storitve. Vsaka storitev je odgovorna za svojo domeno in komunicira z ostalimi storitvami preko jasno definiranih API-jev.

Cilj sistema je prikazati uporabo mikrostoritvene arhitekture, načel čiste arhitekture (Clean Architecture) ter pregledno strukturo repozitorija.

---

## Poslovni problem

Kinematografi morajo učinkovito upravljati katalog filmov, razpored predvajanj in rezervacije sedežev. Brez ustreznega sistema je upravljanje teh podatkov nepregledno in lahko povzroča težave pri organizaciji predstav ter rezervacijah.

Ta sistem omogoča:

- upravljanje kataloga filmov
- upravljanje terminov predvajanj
- rezervacijo sedežev za posamezne predstave
- pregled informacij preko spletnega uporabniškega vmesnika

Sistem je razdeljen na več mikrostoritev, ki so odgovorne za posamezne poslovne domene.

---

## Arhitektura sistema

Sistem je sestavljen iz treh mikrostoritev in ene spletne aplikacije.

Mikrostoritve so med seboj ohlapno povezane in komunicirajo preko REST API vmesnikov. Vsaka mikrostoritev upravlja svojo domeno in podatke, kar omogoča večjo modularnost in lažje vzdrževanje sistema.

Glavne komponente sistema so:

- Movies Service
- Screenings Service
- Reservations Service
- Web Application

Spletna aplikacija deluje kot uporabniški vmesnik, ki komunicira z mikrostoritvami in prikazuje podatke uporabniku.

---

## Mikrostoritve

### Movies Service

Odgovorna za upravljanje podatkov o filmih.

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

Odgovorna za upravljanje terminov predvajanj filmov v kinu.

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

Odgovorna za upravljanje rezervacij sedežev za posamezne predstave.

Funkcionalnosti:
- ustvarjanje rezervacije
- pregled rezervacij
- preverjanje razpoložljivosti sedežev

Primer podatkov:
- film
- termin predstave
- sedež
- ime uporabnika

---

### Web Application

Spletna aplikacija predstavlja uporabniški vmesnik sistema.

Uporabnikom omogoča:
- pregled filmov
- ogled terminov predstav
- rezervacijo sedežev

Spletna aplikacija komunicira z mikrostoritvami preko REST API.

---

## Komunikacija med storitvami

Mikrostoritve komunicirajo preko REST API vmesnikov.

Primer poteka:

1. Spletna aplikacija pridobi seznam filmov iz **Movies Service**.
2. Uporabnik izbere film in aplikacija pridobi termine iz **Screenings Service**.
3. Uporabnik izbere termin in rezervira sedež.
4. Zahteva se pošlje v **Reservations Service**, kjer se ustvari rezervacija.

---

## Struktura repozitorija

```
cinema-microservices/
│
├── movies/          # mikrostoritev za upravljanje filmov
├── screenings/      # mikrostoritev za termine predvajanj
├── reservations/    # mikrostoritev za rezervacije sedežev
├── web-app/         # spletni uporabniški vmesnik
│
├── docs/            # dodatna dokumentacija
└── README.md        # opis sistema in arhitekture
```

## Arhitekturna načela

Pri razvoju sistema sledimo načelom čiste arhitekture (Clean Architecture):

- poslovna logika je ločena od infrastrukture
- mikrostoritve so neodvisne
- komunikacija poteka preko jasno definiranih API-jev
- odvisnosti tečejo od zunanjih slojev proti domeni


## Diagram arhitekture

```mermaid
flowchart LR
    U[Obiskovalec kina] -->|HTTPS| W[Spletna aplikacija]

    subgraph Sistem za upravljanje kino predstav
        W -->|REST API| M[Storitev - filmi]
        W -->|REST API| S[Storitev - predstave]
        W -->|REST API| R[Storitev - rezervacije]

        M --> MDB[(Podatkovna baza filmov)]
        S --> SDB[(Podatkovna baza predstav)]
        R --> RDB[(Podatkovna baza rezervacij)]

        S -->|REST API| M
        R -->|REST API| S
    end
```
