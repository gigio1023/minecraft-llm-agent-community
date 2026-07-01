---
sidebar_position: 3
---

# Engineering Governance And Testing

This is the engineering-practice spec.

## Long-Term Spec Governance

`SPEC.md` and files in `project-docs/specification/` are long-term spec documents.
`AGENTS.md` is binding repo-agent guidance for how agents apply those specs.

Agents must not change them casually. Editing these files means changing product
direction, architecture rules, or agent operating rules.

Allowed edits:

- the user explicitly asks for a spec update;
- a developer/system instruction explicitly requires it;
- a narrow typo/link correction that does not change meaning.

For anything else, ask the user first.

When spec and implementation disagree, do not silently bend one to fit the
other. Name the mismatch and propose a path.

## Implementation Philosophy

Keep implementation simple, explicit, and extensible.

Prefer:

- named domain models;
- small modules;
- explicit state transitions;
- runtime evidence;
- predicted-vs-observed transition rows when evaluating WAM behavior;
- typed contracts;
- explicit runtime action parameter validation;
- bounded world-state diagnostics;
- evidence-linked context compaction;
- bounded helpers;
- narrow validators.

Avoid:

- giant runner files;
- hidden global state;
- ad hoc dictionary/object blobs when a domain model is needed;
- broad mocks that pass while real behavior breaks;
- speculative abstractions detached from current runtime evidence and context;
- burying product intent in prompts only.
- hidden physical-action defaults that turn invalid provider output into
  misleading movement or gameplay.
- treating verification artifacts as the research result instead of experiment
  hygiene.

In TypeScript, use narrow types and small modules. In Python-like code, the
equivalent rule would be to prefer explicit domain models such as Pydantic
models over dictionary-heavy implementation when the data is a real domain
object.

## File Size And Splitting

Split files by responsibility before they become monoliths.

Do not let one runner own all of:

- config;
- provider calls;
- reconnect/session lifecycle;
- transcript persistence;
- actor workspace mutation;
- gameplay execution;
- verification;
- report generation.

Expected boundaries:

- `gameplay/` for progression, primitives, seed action skills, and verification;
- `runtime/` for loop, session, orchestration, and execution;
- `memory/` and `runtime/state/` for actor and runtime state;
- `skills/` for action skill ownership and lifecycle;
- `provider/` for model calls and tracing;
- `transcript/` for transcript and artifact persistence.

## Comments

Comments should make future code review easier.

Use comments to explain:

- why a runtime boundary exists;
- which invariant is being protected;
- which fake-progress mode is being rejected;
- why a Minecraft/Mineflayer behavior is non-obvious;
- how Soul/LifeGoal/social context affects an implementation boundary;
- how evidence should be interpreted.
- whether a field belongs to acting, prediction, observed delta, or scoring.

Do not use comments to narrate obvious code. Prefer extracting a named helper
when a comment becomes too long.

## Testing

Testing matters, but unit-test volume is not the goal.

This repo is a research/runtime staging area. The fastest way to learn whether
the runtime is useful is often to run the actual implementation and inspect the
artifacts.

Use tests this way:

- keep them Detroit-style;
- keep them small;
- test one owned behavior or regression;
- reject fake success and hidden dependencies;
- protect action-skill gates, runtime action validators, verifier rules,
  artifact refs, world-state diagnostic summaries, compaction invariants, and
  domain models;
- protect transition-row semantics, especially the separation between
  `predicted_delta`, `observed_delta`, and acting outcome;
- delete or rewrite tests that would pass after real logic breaks.

Do not add elaborate test scaffolds for persona richness or long-run autonomy.

## Primary Evidence And Transition Data

Primary evidence should come from:

- live or managed Minecraft probes;
- action-skill matrix runs;
- social-cycle reports;
- transcript artifacts;
- actor workspace evidence;
- provider input/output snapshots;
- verifier output.
- world-state diagnostic artifacts that scope absence claims and loaded-world
  limits;
- compact provider context packets with evidence refs for long runs.
- social-material transition rows when WAM behavior is under evaluation.

Smoke tests are allowed as wiring checks. They do not replace current-run
Minecraft evidence.

For advisory WAM work, the primary research artifact is not the evidence trail
alone. It is the comparison between predicted and observed deltas, with the
acting outcome reported separately. Verification remains required hygiene.

## Documentation

Keep `SPEC.md`, `README.md`, `project-docs/orientation/overview.md`,
`project-docs/orientation/documentation-map.md`, and `project-docs/orientation/agent-search-index.md`
aligned.

Internal project docs live under `project-docs/`. Docusaurus-exposed public
docs live under `docs/public-docs/`. Repo-root review and agent-operation docs
live at the project root. Literature references and raw source material live
under `project-docs/references/`; superseded plans and historical public docs
live under `project-docs/archive/`.

Do not place internal setup notes, provider/API access notes, handoffs,
implementation campaigns, or agent operating rules under `docs/public-docs/` or
`docs/blog/`. Public docs should explain the project externally; internal docs
should preserve implementation authority and operational detail.

When a plan becomes historical, mark it as historical or archived.

Never commit absolute local paths in docs.

## References

- [Embodied Agent Interface](https://huggingface.co/papers/2410.07166) supports
  fine-grained error diagnosis rather than final success alone.
- [SWE-agent](https://arxiv.org/abs/2405.15793) supports treating the agent
  interface as a first-class engineering artifact.
- [Memory for Autonomous LLM Agents](https://huggingface.co/papers/2603.07670)
  is relevant for memory engineering, especially write/manage/read loops and
  trustworthy reflection.
