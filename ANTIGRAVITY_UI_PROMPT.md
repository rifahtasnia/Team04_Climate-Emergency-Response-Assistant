# Antigravity UI Design Task

You are the principal product designer for a high-stakes civic emergency operations interface. Read `AEGIS_PLAN.md` completely before responding.

Design the user interface for AEGIS, a hackathon proof-of-concept that demonstrates a Montreal flash-flood response scenario. The visual result must wow a judging panel, but it must remain credible, legible, accessible, and honest about historical and synthetic data.

## Your task

Create `UI_SPEC.md`. Do not scaffold or modify application code yet.

The specification must contain:

1. A precise desktop layout for 1440×900 and adaptation rules for 1280×720.
2. A component hierarchy with component names and responsibilities.
3. A design-token table covering colour, typography, spacing, borders, elevation, and motion.
4. Exact content hierarchy for the header, live signal feed, operational map, incident command panel, and agent activity strip.
5. The visual and interaction behaviour for all seven functional states in `AEGIS_PLAN.md`.
6. Microinteraction specifications for incoming reports, agent activity, incident escalation, human approval, override, and simulation reset.
7. Accessibility requirements including keyboard flow, focus treatment, reduced motion, contrast, and non-colour status cues.
8. A list of misleading emergency-UI patterns to avoid.
9. A short visual QA checklist that can be executed in a browser.
10. One ASCII wireframe of the primary command-centre view.

## Design constraints

- Use a high-trust civic emergency visual language, not science fiction.
- Make the map the visual centre of gravity.
- Clearly separate AI recommendations from human-authorized actions.
- Keep `SIMULATION — NOT FOR OPERATIONAL USE` persistently visible.
- Show priority and confidence as different values.
- Red is reserved for immediate threats; amber is warning; cyan represents system processing.
- Avoid glassmorphism, excessive gradients, neon, ornamental data visualizations, fake 3D globes, and repetitive generic cards.
- Avoid tiny text. The interface must remain presentable on a projected 1280×720 display.
- Do not invent integrations or operational claims absent from `AEGIS_PLAN.md`.
- Prefer a small number of distinctive, reusable primitives over dozens of components.

The specification should be decisive enough that another engineer can implement it without asking visual-design questions.
