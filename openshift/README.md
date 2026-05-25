# Cinema Microservices na OpenShift

Namestitev informacijskega sistema na **Red Hat OpenShift** (Kubernetes). Manifesti v tej mapi ustrezajo lokalnemu `docker-compose.yml`.

## Predpogoji

- Račun [OpenShift Developer Sandbox](https://developers.redhat.com/developer-sandbox)
- CLI **`oc`** ([navodila](https://docs.openshift.com/cli-install/installing-cli.html))
- (Opcijsko) **`kubectl`** — `oc` ga vključuje

## Korak 0 — Prijava in projekt (Developer Sandbox)

Na **OpenShift Developer Sandbox** uporabi **osebni projekt**, npr. `tanejb-dev` (ne ustvarjaj novega `cinema`, če sandbox ne dovoli).

### Možnost A — Terminal v brskalniku (priporočeno na začetku)

1. Konzola → **OpenShift command line terminal** (ikona terminala).
2. Project: **`tanejb-dev`** → **Start**.
3. V terminalu že velja `oc` in pravi projekt.

### Možnost B — Lokalni `oc` na Windows

1. **Copy login command** iz konzole → PowerShell.
2. `oc project tanejb-dev`

Preveri:

```bash
oc whoami
oc project
```

## Korak 1 — Infrastruktura (MongoDB + RabbitMQ)

Manifesti so nastavljeni na namespace **`tanejb-dev`**. Če imaš drug sandbox projekt, v `kustomization.yaml` spremeni `namespace:`.

### V web terminalu (po git clone v sandboxu)

Če repozitorij še ni v terminalu, najprej naloži YAML (npr. kopija vsebine ali `git clone` tvojega repoja, če je javen).

Iz korena repozitorija:

```bash
oc apply -k openshift/
```

### Preverjanje

```bash
oc get pods -n tanejb-dev
oc get svc -n tanejb-dev
oc get pvc -n tanejb-dev
```

Pričakovano (po nekaj minutah):

| Pod | Service | Port |
|-----|---------|------|
| `mongo-...` | `mongo` | 27017 |
| `rabbitmq-...` | `rabbitmq` | 5672, 15672 |

Logi:

```bash
oc logs -n tanejb-dev deployment/mongo --tail=30
oc logs -n tanejb-dev deployment/rabbitmq --tail=30
```

Test Mongo iz začasnega poda:

```bash
oc run -n tanejb-dev mongo-test --rm -it --restart=Never \
  --image=docker.io/library/mongo:7 -- mongosh mongodb://mongo:27017 --eval "db.adminCommand('ping')"
```

### Mongo: CrashLoopBackOff po `rollout restart`

Pogosti vzroki:

1. **Dva poda + en PVC (ReadWriteOnce)** — privzeti RollingUpdate ustvari nov pod, medtem stari še teče. Rešitev: v manifestu je `strategy: type: Recreate`.
2. **Probe timeout** — uporabljamo `tcpSocket` namesto `mongosh exec`.
3. **Poškodovani podatki na PVC** — po neuspešnih zagonih:

   ```bash
   oc scale deployment/mongo --replicas=0
   oc delete pod -l app=mongo
   oc delete pvc mongo-data
   oc apply -f openshift/infra/mongo-pvc.yaml
   oc apply -f openshift/infra/mongo.yaml
   oc get pods -w
   ```

### Če PVC za Mongo ostane `Pending`

Developer Sandbox včasih omeji shrambo. Možnosti:

1. Počakaj 2–5 min (dodelitev storage class).
2. V konzoli preveri **Storage** / kvote projekta.
3. Za demo brez persistence: odstrani PVC deployment in uporabi `emptyDir` (vprašaj asistenta za `mongo-emptydir` varianto).

### Varnost (Korak 1)

- Gesla RabbitMQ so v **Secret** `cinema-secrets` (ne v ConfigMap).
- Skupna neskalna konfiguracija je v **ConfigMap** `cinema-common` (URI brez gesla, kot lokalno).

## Korak 2 — Mikrostoritve

Po uspešnem Koraku 1 (mongo + rabbitmq **1/1 Running**):

```bash
cd ~/cinema-microservices/cinema-microservices   # ali tvoja pot po clone
git pull
oc apply -k openshift/
oc get pods
```

Slike: DockerHub `tanej666/cinema-*:latest` (CI ob push na `main`).

| Pod | Service | Port |
|-----|---------|------|
| `movies-service` | `movies-service` | 3001 |
| `users-service` | `users-service` | 3002 |
| `screenings-service` | `screenings-service` | 3003 |
| `reservations-service` | `reservations-service` | 50051 (gRPC) |
| `users-worker` | — | (brez Service) |

Preverjanje health (iz terminala):

```bash
oc run curl-test --rm -it --restart=Never --image=curlimages/curl:latest -- \
  curl -s http://movies-service:3001/health
```

## Naslednji koraki

| Korak | Vsebina |
|-------|---------|
| 3 | API Gateway web + mobile + Route |
| 4 | Frontend (web-host + MFE) |
| 5 | HPA, NetworkPolicy, dokumentacija za oddajo |

Docker slike (CI): namespace `tanej666` na DockerHub — glej korenski `README.md`.

## Uporabni ukazi

```bash
oc describe pod -n tanejb-dev <ime-poda>
oc get events -n tanejb-dev --sort-by='.lastTimestamp'
```

Datoteka `00-namespace.yaml` je opcijska (lasten cluster); na Sandboxu **ne** uporabljaj — projekt `tanejb-dev` že obstaja.
