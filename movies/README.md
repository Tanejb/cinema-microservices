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

## Primer podatkov

Storitve upravlja podatke, kot so:

- naslov filma
- opis filma
- žanr
- trajanje
- starostna omejitev

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
