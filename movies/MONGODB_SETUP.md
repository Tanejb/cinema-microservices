# MongoDB Atlas Setup

## Navodila za povezavo z MongoDB Atlas

1. Pojdite na [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. Prijavite se ali ustvarite nov račun

3. Ustvarite nov cluster (če ga še nimate):
   - Izberite "Build a Database"
   - Izberite "FREE" tier (M0)
   - Izberite regijo blizu vam
   - Dajte clusterju ime (npr. "cinema-microservices")

4. Ustvarite database user:
   - V "Database Access" sekciji kliknite "Add New Database User"
   - Izberite "Password" authentication
   - Ustvarite uporabniško ime in geslo
   - **Pomembno**: Shranite geslo, saj ga ne boste mogli več videti!

5. Nastavite Network Access:
   - V "Network Access" sekciji kliknite "Add IP Address"
   - Za razvoj: kliknite "Allow Access from Anywhere" (0.0.0.0/0)
   - Za produkcijo: dodajte samo vaš IP naslov

6. Pridobite connection string:
   - V "Database" sekciji kliknite "Connect"
   - Izberite "Connect your application"
   - Kopirajte connection string
   - Zamenjajte `<password>` z vašim geslom
   - Zamenjajte `<dbname>` z `movies_db` ali pustite privzeto

7. Dodajte connection string v `.env` datoteko:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/movies_db?retryWrites=true&w=majority
   DB_NAME=movies_db
   ```

## Primer connection stringa

```
mongodb+srv://username:password@cinema-microservices.xxxxx.mongodb.net/movies_db?retryWrites=true&w=majority
```

## Ustvarjanje baze v Atlasu

Baza se bo avtomatsko ustvarila, ko se storitev prvič poveže z MongoDB Atlas. Ni potrebno ročno ustvarjati baze.

## Testiranje povezave

Za testiranje povezave zaženite storitev:

```bash
npm start
```

Če je povezava uspešna, boste videli v logih:
```
MongoDB connected successfully
```
