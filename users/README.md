# Users Service

## Opis

Users Service je mikrostoritev, odgovorna za upravljanje uporabnikov v sistemu za kino predstave in rezervacije sedežev.

Namen storitve je hranjenje in upravljanje osnovnih podatkov o uporabnikih, ki uporabljajo sistem za pregled filmov in rezervacijo kino predstav.

---

## Odgovornosti storitve

Users Service skrbi za:

- ustvarjanje novih uporabnikov
- pregled vseh uporabnikov
- pridobivanje podatkov o posameznem uporabniku
- posredovanje podatkov drugim storitvam

---

## Primer podatkov

Storitev upravlja podatke, kot so:

- ime
- priimek
- elektronski naslov
- identifikator uporabnika

---

## Komunikacija

Users Service komunicira preko REST API.

### Primer uporabe

- spletna aplikacija pridobi podatke o uporabniku
- Reservations Service preveri uporabnika pri ustvarjanju rezervacije

---

## Povezava z ostalimi storitvami

Users Service:

- posreduje podatke spletni aplikaciji
- omogoča povezavo s storitvijo Reservations Service

---

## Arhitekturni pristop

Storitev sledi načelom čiste arhitekture:

- domena vsebuje poslovna pravila
- aplikacijski sloj vsebuje primere uporabe
- infrastruktura vsebuje dostop do podatkov
- API sloj omogoča komunikacijo z zunanjim svetom
