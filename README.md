# AEGIS

AEGIS is a flood-response network for affected residents, volunteers, shelter
providers, and municipal or NGO coordinators. It converts fragmented reports
into prioritized requests, verified resource matches, live routes, public
guidance, and an auditable human-authorized response.

## User flows

- **Residents:** request rescue, medical aid, transport, food, accommodation,
  or power support and view nearby verified capacity.
- **Volunteers and shelter providers:** register skills, service radius,
  accessibility, and available space through **Offer support**.
- **Coordinators:** assess incoming reports, verify community offers, select
  multiple staging points, match resources, route aid, and authorize action.

## Start

```bash
cd web
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

See [web/README.md](web/README.md) for configuration and checks,
[docs/DATA_AUDIT.md](docs/DATA_AUDIT.md) for dataset provenance and usage, and
[docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the presentation flow.

The original Streamlit dashboard from the remote repository is retained in
`legacy-streamlit/`.
