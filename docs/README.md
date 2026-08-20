# Docs

Documentation for the Cognition take-home assignment: evaluating whether a Series C fintech (~60 engineers, $250K/yr Power Apps spend, 3 internal apps) should build an in-house internal-tool alternative with Devin or keep buying.

## Structure

- [`research/`](research/) — background research
  - [`power-apps-research.md`](research/power-apps-research.md) — deep dive on Power Apps capabilities, licensing, governance, and limitations
- [`architecture/`](architecture/) — system design
  - [`components.md`](architecture/components.md) — initial component breakdown of the platform
  - [`target-components.md`](architecture/target-components.md) — agreed target components, stack mapping, and build order
  - [`web-architecture.md`](architecture/web-architecture.md) — decision record: single Next.js app + domain packages (options A–D compared)
  - [`data-model.md`](architecture/data-model.md) — entity tiers (core / platform / app), tables, and schema decisions
  - [`known-gaps.md`](architecture/known-gaps.md) — accepted gaps of the chosen stack vs. Power Apps, with mitigations
- [`evaluation/`](evaluation/) — honest assessment of what was/wasn't replicated, gap analysis, and the build-vs-buy recommendation
