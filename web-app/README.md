# Web Application

## Opis

Web Application predstavlja uporabniški vmesnik sistema za upravljanje kino predstav in rezervacij sedežev.

Namen aplikacije je omogočiti uporabniku enostaven pregled filmov, terminov predvajanj in izvedbo rezervacije sedežev preko spletnega brskalnika.

---

## Odgovornosti aplikacije

Spletna aplikacija skrbi za:

- prikaz seznama filmov
- prikaz podrobnosti izbranega filma
- prikaz terminov predstav
- oddajo rezervacije za izbrani termin
- komunikacijo z mikrostoritvami

---

## Funkcionalnosti

Uporabniku omogoča:

- pregled razpoložljivih filmov
- izbiro filma
- pregled kino predstav za izbran film
- izbiro termina in sedeža
- oddajo rezervacije

---

## Komunikacija

Spletna aplikacija komunicira z naslednjimi mikrostoritvami preko REST API:

- Movies Service
- Screenings Service
- Reservations Service

### Primer poteka:
1. uporabnik odpre seznam filmov
2. aplikacija pridobi podatke iz Movies Service
3. uporabnik izbere film
4. aplikacija pridobi termine iz Screenings Service
5. uporabnik odda rezervacijo
6. aplikacija pošlje zahtevo v Reservations Service

---

## Vloga v arhitekturi

Web Application je vstopna točka za uporabnika in povezuje vse tri mikrostoritve v enoten sistem.

Ne vsebuje glavne poslovne logike, ampak skrbi predvsem za:
- prikaz podatkov
- zajem uporabniških vnosov
- pošiljanje zahtev ustreznim storitvam
