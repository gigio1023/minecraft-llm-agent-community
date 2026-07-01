# 2026-06-15 Social Simulation Experiments

Search token: `EXPERIMENT_2026_06_15_SOCIAL_SIMULATION`.

## Curated Reports

- `grounded-social-trajectory-smoke/index.html`: provider-free smoke for the
  first Grounded Social Trajectory scorer and event ledger.
- `borrowed-tool-qwen-plus-smoke/index.html`: ModelScope Qwen Plus
  provider-backed decision smoke for `borrowed_tool_with_return_or_debt_v1`.

## Notes

The first 2026-06-15 smoke does not call an LLM provider and does not start a
Minecraft server. It validates the scoring contract before live multi-actor
experiments spend quota or produce misleading social-simulation claims.

The borrowed-tool smoke does call ModelScope Qwen Plus, after quota preflight,
but still does not start a Minecraft server. Treat it as provider decision
evidence for the new Minecraft social issue framing, not as physical Mineflayer
competence.

Follow-up interpretation after report review: this smoke is too simple for the
core open-world social simulation goal. The next meaningful benchmark should be
a live two-actor natural-world run where separate Mineflayer bots observe each
other, speak or otherwise signal, move, transfer or refuse material access, use
the world, and leave evidence-backed claim, obligation, relationship, and memory
state. Provider-authored event trajectories alone are not enough.
