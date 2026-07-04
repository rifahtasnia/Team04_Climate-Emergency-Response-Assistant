# AEGIS Data Audit

## Scope

All five Group 4 sources from the supplied dataset guide were inspected. The application separates:

- **operational evidence**, which can affect an incident;
- **preparedness context**, which can inform policy but cannot change emergency priority.

This separation prevents long-term emissions or survey demographics from affecting who receives help.

## 1. Natural Disasters from Social Media

Local file: `data/raw/disaster-reports-train.csv`

- 169,109 training records
- 81,883 records marked relevant (`target = 1`)
- 22,192 flood records
- Fields: text, relevance target, source corpus, event type, event detail, and label
- Common useful labels include injured/dead people, infrastructure damage, evacuations, urgent needs, aid, and advice.

Use:

- Calibrate the vocabulary and structure of incident reports.
- Define the triage taxonomy.
- Evaluate whether AI-assigned categories agree with reference labels.

Safeguards:

- Direct identifiers, handles, phone numbers, and URLs are excluded from the product fixtures.
- Historical messages are not presented as live reports.
- A classification does not verify a report.

## 2. Toronto Current and Future Climate

Local file: `data/raw/toronto-climate-variables.csv`

- 27 scenario/distribution rows
- 58 columns
- Observed baseline plus SSP2-4.5 and SSP5-8.5 scenarios
- Time horizons extend to 2071–2100.
- Median maximum one-day precipitation rises from 37.3 mm in the observed baseline to 47.5 mm under SSP5-8.5 for 2071–2100.

Use:

- Preparedness context for why extreme-rain response capacity matters.
- Not used to determine the priority of an active incident.

## 3. TransformTO Resident Survey

Local file: `data/raw/transformto-resident-survey.csv`

- 1,023 responses
- 57 fields
- 628 respondents selected a citywide climate lens for municipal decisions.
- 597 respondents selected equitable distribution of the urban forest.

Use:

- Supports the product requirement to review geographic and accessibility coverage.
- Demographic fields and free-text responses are not exposed in the interface.
- Survey answers never affect individual emergency eligibility or priority.

## 4. Montréal Community GHG Inventory

Local files:

- `data/raw/montreal-ghg-stationary.csv`
- `data/raw/montreal-ghg-transport.csv`
- `data/raw/montreal-ghg-waste.csv`
- `data/raw/montreal-ghg-ippu.csv`
- `data/raw/montreal-ghg-afolu.csv`

Coverage:

- Five emissions sectors
- Inventory years include 1990 and 2015–2022.
- Sector totals, gas types, scopes, activities, and data-quality ratings are available.

Use:

- Comparative municipal climate-planning context.
- Explicitly excluded from active incident triage because emissions totals do not establish immediate danger.

## 5. Climate Change Indicators for African Countries

Local directory: `data/raw/africa-climate/`

- 54 country CSV files
- Annual observations spanning 1960–2024
- Indicators include low-elevation land exposure, renewable-energy consumption, and per-capita GHG emissions.

Use:

- Demonstrates that AEGIS’s operational workflow must remain portable across different climate contexts.
- Explicitly excluded from Toronto incident priority and routing.

## External operational services

- Open-Meteo supplies current Toronto weather when reachable.
- OpenStreetMap supplies map tiles.
- OSRM supplies a route when reachable.
- Gemini 3.5 Flash can structure incident reports when a valid key is configured.

Each external service has a deterministic fallback. No network failure can block the presentation workflow.
