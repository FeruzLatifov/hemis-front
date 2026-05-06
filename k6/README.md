# Load Testing — k6

Smoke + soak load tests for the HEMIS web API. We measure backend
response time and error rate under realistic concurrency, not frontend
rendering — the frontend is a static SPA served by nginx so its scaling
ceiling sits with the API.

## Why k6

- Single binary, no JVM (vs. JMeter)
- TypeScript-friendly script syntax
- Easy CI integration (Grafana k6 Cloud or self-hosted)
- Prometheus + InfluxDB output adapters

## Install

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k && \
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
    --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && \
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
    sudo tee /etc/apt/sources.list.d/k6.list && \
  sudo apt update && sudo apt install k6
```

## Run

The script reads three env vars:

```bash
# Pointed at staging backend (NEVER prod without coordination)
BASE_URL=https://hemis-staging-api.example.com \
USERNAME=loadtest_admin \
PASSWORD='REDACTED-IN-VAULT' \
k6 run k6/dashboard-smoke.js
```

Output:

```
✓ login returns 200
✓ dashboard stats < 500ms p95
✓ universities list < 800ms p95
✓ dictionaries < 200ms p95 (cached)

http_req_duration..........: avg=180ms  p(95)=620ms p(99)=1.2s
http_req_failed............: 0.21%
```

## Targets (baseline)

| Endpoint                                  | p95     | p99     | Notes                    |
| ----------------------------------------- | ------- | ------- | ------------------------ |
| `POST /auth/login`                        | < 500ms | < 1s    | rate-limited at 5/min/ip |
| `GET /dashboard/stats`                    | < 500ms | < 1s    | redis-cached server-side |
| `GET /registry/universities`              | < 800ms | < 2s    | up to 230 rows           |
| `GET /registry/universities/dictionaries` | < 200ms | < 500ms | static-ish               |
| `GET /menu`                               | < 300ms | < 600ms | locale-keyed cache       |

If a baseline regresses by >20%, treat as a deploy blocker until traced.

## Scripts

- `dashboard-smoke.js` — single VU, sanity check that auth + dashboard
  flow works end to end. Used to gate deploys.
- `dashboard-soak.js` (TODO) — 50 VU × 30 min, holds steady-state load
  to surface memory leaks / connection pool exhaustion.

## CI integration

Wired up via GitHub Actions `nightly-load.yml` (TODO) — runs
`dashboard-smoke.js` against staging at 02:00 Asia/Tashkent and posts a
Telegram notification on regression. Soak test runs weekly on Sunday.
