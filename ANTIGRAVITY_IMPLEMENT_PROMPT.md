# AEGIS Visual Design Implementation

Use **Gemini 3.1 Pro** for this design pass.

You are the principal product designer and frontend design engineer for a high-stakes municipal emergency operations product. The application is already functional. Your responsibility is the visual system, responsive layout, content hierarchy, and interaction polish—not product architecture.

Read these files completely before editing:

- `AEGIS_PLAN.md`
- `web/src/index.css`
- `web/src/components/AppShell.tsx`
- `web/src/components/OperationsMap.tsx`
- every file in `web/src/pages/`

Run the application and inspect every route at both 1440×900 and 1280×720 before deciding what to change.

## Product flow that must remain intact

1. Live Operations establishes the citywide situation.
2. Incident Room lets the operator verify evidence and priority.
3. Response Plan coordinates route, teams, accessible transport, and shelter.
4. Public Alert authorizes verified bilingual instructions.
5. Accountability distinguishes AI recommendations from human decisions.

Do not remove, bypass, or fake these transitions.

## Design objective

Deliver a restrained, production-grade emergency operations interface that communicates trust, urgency, and control without looking like science fiction or a generic analytics dashboard.

The quality bar is an **Apple-designed light web application**, similar in
craft and clarity to Apple's polished iCloud web surfaces—not a macOS desktop
utility and not an Apple marketing landing page. Use a warm-white canvas,
clean white working surfaces, near-black typography, system-native type, exact
spacing, light navigation, generous but purposeful breathing room, subtle
depth, and responsive web interactions.

The interface must feel intentionally designed at first glance:

- clear spatial hierarchy;
- strong typography;
- map-led operational views;
- disciplined density;
- excellent alignment and spacing;
- precise status language;
- a light neutral foundation using warm white, white, soft gray, and graphite;
- near-black primary actions rather than a blue or green theme;
- green used only for confirmed success, amber only for caution, and red only for immediate danger;
- system font stack with crisp type sizing and weight hierarchy;
- generous negative space where it clarifies decisions, without reducing useful information density;
- a small, consistent radius system and subtle elevation rather than floating card effects;
- subtle motion only where it communicates state;
- WCAG AA contrast and visible keyboard focus.

## Non-negotiable constraints

- Do not add the words “prototype,” “demo,” “hackathon,” “simulation,” “proof of concept,” or developer commentary to the product UI.
- Do not add decorative charts, fake metrics, fake 3D globes, glassmorphism, neon effects, excessive gradients, or ornamental agent animations.
- Do not use teal, green, blue, navy, or any saturated colour as the overall
  brand/theme. Blue may appear only as a very small conventional link/focus
  accent if necessary.
- Do not keep the current dark theme. Redesign all five routes as a coherent
  light application.
- Do not imitate an Apple marketing website, use giant empty hero typography, or add glossy product-page effects.
- Do not imitate a dense desktop application with heavy fixed chrome, tiny
  controls, or cramped inspector panels. This is a responsive web app.
- Do not place every group of content inside a rounded card. Prefer structure, alignment, and hairline dividers.
- Do not use excessive pills, uppercase micro-labels, shadows, or borders.
- Do not turn the pages into grids of repetitive cards.
- Do not expose chain-of-thought. Keep the existing concise decision trace.
- Do not add features or claims unsupported by the current data and services.
- Do not modify `web/server/`, `web/src/data/`, `web/src/state/`, or API behaviour.
- Do not add new runtime dependencies unless absolutely necessary.
- Preserve OpenStreetMap attribution.
- Preserve the distinction between priority and confidence.
- Preserve the distinction between AI recommendation and human authorization.
- Preserve all keyboard-operable controls and `prefers-reduced-motion`.

## Page-specific intent

### Live Operations

The map is the centre of gravity. The severe-weather briefing, three operational totals, and incident queue should be immediately scannable. The critical incident must be visually obvious without turning the entire page red.

### Incident Room

Evidence and the decision should dominate. Keep raw reports readable, make verification state unmistakable, and keep the decision panel easy to act on. The expandable decision trace remains secondary.

### Response Plan

The map and route are primary. Resource assignments should read like one coordinated plan, not a shopping cart. Human approval must be explicit.

### Public Alert

Message quality and geographic targeting are primary. Preserve the bilingual switch and mobile preview. It should feel like a professional public-warning authoring surface.

### Accountability

Make the timeline easy to audit. Human decisions must be visually distinct from AI/system entries. Preparedness context is secondary and should not distract from the incident record.

## Required validation

After editing:

1. Run `npm run build`.
2. Run `npm run lint`.
3. Inspect all five routes at 1440×900 and 1280×720.
4. Check for horizontal overflow, clipped controls, unreadably small text, broken map sizing, and console errors.
5. Confirm the complete workflow still functions.

Modify the existing application directly. Do not create a separate concept or replacement app.
