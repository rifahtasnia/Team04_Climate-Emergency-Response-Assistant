# AEGIS

AEGIS is a human-supervised emergency coordination application for municipal
response teams. It turns fragmented reports into a verified incident, a
coordinated response plan, a bilingual public warning, and an auditable decision
record.

## Product flow

1. Intake: identify the operator, geocode the incident and staging point, and
   add incoming reports.
2. Live Operations: understand the location-specific situation.
3. Incident Room: verify evidence and priority.
4. Response Plan: coordinate live routes and required capabilities.
5. Public Alert: authorize verified bilingual instructions.
6. Accountability: review AI recommendations and human decisions.

## Start

```bash
cd web
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

See [web/README.md](web/README.md) for configuration and checks, and
[docs/DATA_AUDIT.md](docs/DATA_AUDIT.md) for dataset provenance and usage.
The proposed resident, volunteer, shelter, and coordinator expansion is in
[docs/EXPANDED_PRODUCT_FLOW.md](docs/EXPANDED_PRODUCT_FLOW.md).
