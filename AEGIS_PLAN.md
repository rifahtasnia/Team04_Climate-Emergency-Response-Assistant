# AEGIS — Hackathon Build Plan

## Product thesis

AEGIS is a human-supervised emergency command interface that turns noisy disaster reports into a verified, prioritized response plan. The prototype demonstrates one credible vertical slice:

> reports arrive → agents triage and corroborate → incidents appear on a map → resources are recommended → a human approves an action → a public alert is drafted

The interface must never imply that AI independently dispatches emergency services.

## Demo scenario

A severe rainfall event causes flash flooding in Toronto.

1. The operator starts the simulation.
2. Historical disaster-message examples enter a simulated live feed.
3. The Sentinel agent removes irrelevant posts.
4. The Verification agent groups corroborating reports and flags conflicts.
5. The Geospatial agent places scenario locations on a Toronto map.
6. The Priority agent promotes a trapped-residents report to critical.
7. The Resource agent recommends a shelter, vehicle, and response team.
8. The operator reviews the evidence and approves escalation.
9. The Communications agent drafts a bilingual public alert.
10. The audit panel records the AI recommendation and human decision.

The complete live sequence should take 60–90 seconds.

## Data strategy

### Historical source data

Use a small, curated sample from `melisekm/natural-disasters-from-social-media`:

- `text`: incoming report
- `target`: relevance reference label
- `event_type`: broad disaster category
- `event_type_detail`: specific event category
- `label`: information/need categories

The original labels are reference answers for evaluating triage quality.

### Synthetic scenario data

Locations, residents, shelters, road closures, vehicles, volunteers, capacities, timestamps, and response assignments are synthetic. Every screen that displays these values must include a visible `SIMULATION` or `SYNTHETIC DEMO DATA` label.

### Prohibited claims

- Do not call historical posts live data.
- Do not call a social-media report verified merely because a model classified it.
- Do not claim real dispatch, municipal integration, or real-time routing.
- Do not imply that silence from a neighbourhood means safety.

## Agent model

| Agent | Input | Output | Human control |
| --- | --- | --- | --- |
| Sentinel | Raw messages | Relevant reports | Operator can restore filtered reports |
| Verification | Related reports | Unverified, corroborated, or conflicting status | Operator confirms evidence |
| Geospatial | Report + synthetic location | Incident cluster | Operator can correct location |
| Priority | Need, danger, confidence | Priority and explanation | Operator can override priority |
| Resource | Incident + synthetic inventory | Recommended team, shelter, vehicle | Operator approves assignment |
| Communications | Approved facts | French and English draft | Operator edits and publishes |
| Accountability | All decisions | Audit trail and warnings | Immutable demo event log |

## Experience architecture

Build a single-screen emergency operations centre optimized for a laptop presentation.

### Header

- AEGIS identity and `MONTREAL FLOOD SIMULATION`
- Incident clock
- System status
- Start, pause, reset controls
- Persistent `SIMULATION — NOT FOR OPERATIONAL USE` indicator

### Left rail: signal feed

- Incoming report cards
- Source type, timestamp, relevance, and verification state
- Animated arrival without excessive motion
- Filter controls: all, actionable, unverified

### Centre: operational map

- Dark Toronto basemap with an offline route fallback
- Flood-risk overlay
- Incident clusters with severity
- Shelter and response-resource markers
- Road closure and recommended-route overlays
- Layer toggles and a compact legend

### Right rail: incident command

- Selected incident summary
- Priority and confidence shown as separate concepts
- Evidence/corroboration list
- Agent recommendation with a plain-language explanation
- `Approve escalation`, `Request verification`, and `Override` actions
- Bilingual alert draft after approval

### Bottom activity strip

- Named agents visibly transition through queued, working, complete, and warning states
- Expandable accountability log
- Human decisions visually distinct from AI recommendations

## Visual direction

- High-trust civic emergency interface, not a sci-fi control panel.
- Near-black navy surfaces, off-white text, restrained cyan for system activity.
- Amber for warnings and red only for genuinely critical conditions.
- Dense but readable information hierarchy.
- Strong typography, thin grid lines, subtle map texture, and purposeful motion.
- Avoid glassmorphism, neon overload, decorative charts, fake 3D globes, and generic card grids.
- Meet WCAG AA contrast; never encode priority by colour alone.

## Functional states

1. **Ready:** empty incident map and start-simulation call to action.
2. **Monitoring:** reports arrive; agents classify them.
3. **Emerging incident:** reports cluster and evidence accumulates.
4. **Critical decision:** one incident requires operator review.
5. **Coordinating:** resource and route recommendations appear.
6. **Approved:** human decision is logged and bilingual alert is drafted.
7. **Override:** operator changes an AI priority with a required reason.

## Technical approach

- React + TypeScript + Vite.
- Component-local state or a small scenario state machine; no backend required for the POC.
- Deterministic local scenario engine so the live demo cannot fail because of an API.
- Local JSON fixtures for reports, incidents, resources, and scenario events.
- MapLibre/Leaflet only if reliable without keys; otherwise use a polished offline SVG map.
- CSS animations must respect `prefers-reduced-motion`.
- No production claim depends on an external LLM call.

## Acceptance criteria

- Fresh install and start commands are documented.
- The full scenario completes deterministically in under 90 seconds.
- Start, pause, reset, incident selection, layer toggles, approval, verification request, and override work.
- Reset restores the exact initial state.
- No console errors during the demo.
- No horizontal overflow at 1280×720 or 1440×900.
- Keyboard focus is visible and primary controls are reachable by keyboard.
- Critical status uses text/iconography as well as colour.
- Historical and synthetic data are labelled accurately.
- AI recommendations and human decisions are visually distinct.
- The final state provides a concise situation briefing suitable for the presentation.

## Build sequence

1. Scaffold the application and test harness.
2. Implement fixtures and deterministic scenario state machine.
3. Build the semantic layout without animation.
4. Integrate Antigravity’s visual design recommendations.
5. Implement operator actions and audit logging.
6. Add controlled motion and map layers.
7. Run unit/build/lint checks.
8. Test the complete scenario in a real browser at presentation resolutions.
9. Fix visual and interaction defects.
10. Prepare a five-slide deck and rehearsed 90-second demo script.

## Scope control

Required:

- One complete flood scenario
- Multi-agent activity visualization
- Prioritized incident queue
- Map-based coordination
- Human approval and override
- Bilingual alert draft
- Responsible-AI evidence and audit trail

Optional only after the required flow is stable:

- Voice input/output
- Additional disaster scenarios
- Live API integration
- Authentication
- Database persistence
- Predictive analytics
