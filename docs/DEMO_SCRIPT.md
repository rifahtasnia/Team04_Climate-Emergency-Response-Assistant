# AEGIS live demonstration

Target duration: 2 minutes.

## 0:00–0:25 — Real inputs

Say:

> I am the municipal duty officer. AEGIS begins with what I actually know—not a preloaded city or incident.

Action:

- Enter your name.
- Search the incident address or landmark.
- If the staging point is unknown, select **Find nearby public-safety sites** and confirm one candidate.
- Paste the incoming reports.
- Select **Start operation**.

Point out that geocoding, map position, weather, timezone, route, incident text,
and audit identity now come from these inputs.

## 0:25–0:45 — Live Operations

Say:

> The live map is centred on the geocoded incident. Current weather comes from Open-Meteo, and the priority queue was created from the reports I submitted.

Action:

- Select the incident.

## 0:45–1:05 — Incident Room

Say:

> AEGIS separates evidence confidence from severity. Matching signals are corroborated; unique claims stay unverified. Accessibility and life-safety language affect priority, but I still make the decision.

Action:

- Point to corroborated and unverified reports.
- Select **Verify and build response**.

## 1:05–1:28 — Response Plan

Say:

> AEGIS identifies all required capabilities without inventing local vehicle names. The live route runs from the confirmed staging point to the incident. A connected municipal inventory would supply the actual teams and vehicles.

Action:

- Point to the route distance and multiple required capabilities.
- Select **Approve response plan**.

## 1:28–1:45 — Public Alert

Say:

> The warning uses the selected location and verified protective guidance. Unsupported claims and a hardcoded emergency number are excluded.

Action:

- Switch between English and French.
- Select **Authorize public warning**.

## 1:45–2:00 — Accountability

Say:

> The final record shows what the system recommended, what I authorized, and which evidence supported the decision. The preparedness statistics are loaded from the analyzed hackathon datasets, not typed into the interface.

End with:

> AEGIS turns location-specific reports into a verified, routed, human-authorized response without fabricating local facts.

## Prepared report text

```text
Floodwater is rising around a residential building.
Water has reached the entrance and three residents are trapped upstairs.
A wheelchair user needs help because the elevator is offline.
The south road is closed by standing water.
```

## Recovery plan

- If map tiles fail, incident and route overlays remain visible.
- If OSRM fails, AEGIS derives a direct coordinate route and labels it as local.
- If Gemini is unavailable, the report-driven rules engine remains available.
- If live weather fails, the interface says unavailable rather than inventing conditions.
