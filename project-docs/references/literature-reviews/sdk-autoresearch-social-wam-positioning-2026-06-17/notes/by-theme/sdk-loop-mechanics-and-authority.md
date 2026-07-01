# SDK-style coding-agent autoresearch loops as concrete tooling, and the authority boundary

Lane A synthesis. Audience: a newcomer deciding how the project positions an autoresearch loop. Jargon defined on
first use. ASCII punctuation only (`-`, `:`, `,`, `.`). Verified facts and claim-only numbers are separated.

Scope of this file: SDK/framework TOOLING that turns the abstract autoresearch loop into a programmable object
(Claude Agent SDK, OpenAI Codex SDK/CLI, OpenHands, DSPy/MIPRO, GEPA, SWE-agent), and the AUTHORITY BOUNDARY: what
such a loop MAY improve in this repo versus what it MUST NEVER decide. The DIGITAL phenomenon (scored arenas, AIDE
inner loop, SICA, AgentRxiv, the three inflation routes, progress laundering) is already covered by
`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-theme/research-area-coding-agent-autoresearch.md` and the
ENPIRE-to-repo module mapping by
`../../../../2026-06-16/deep-social-wam-literature-review/matrices/autoresearch-loop-mapping.md`. This file CITES those and
does not rewrite them. The delta here is: (1) the loop made concrete in TODAY's SDK primitives, and (2) the
two-column MAY-improve / MUST-NOT-decide table tied to sources.

## 0. Glossary (defined once)

- **Autoresearch loop**: a code-writing LLM agent, given a goal and an external scorer, edits code, runs a
  fixed-budget trial, scores it, keeps or discards, repeats. Origin: Karpathy autoresearch
  (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/karpathy-autoresearch.md`).
- **Loop primitive**: a programmable building block an SDK exposes for that loop (a tool, a hook, a subagent, a
  permission mode, a sandbox mode, an optimizer call).
- **Deterministic runtime verifier**: code OUTSIDE the agent that auto-labels `(state, action, next-state)` at the
  Physical and Material layers at near-zero cost. The repo's central asset and the loop's only admissible scorer.
- **Advisory WAM**: an action-conditioned predictor p(o' | o, l) that predicts/proposes a next observation; it must
  never select the executed action, fill action arguments, mark progress true, or override the verifier.
- **Progress laundering**: the repo's name for the failure where the actor (or an LLM judge) scores its own success,
  so the loop over-optimizes, hacks the measure, or silently degrades the artifact while still "passing."
- **Authority boundary**: the explicit split between what a loop is allowed to change (its software surface) and what
  only the runtime/world/human may decide (truth, success, closure).

## 1. The autoresearch loop, concrete for THIS repo (not vague self-improvement)

The loop is NOT "the agent improves itself." It is a tight, bounded, verifier-grounded edit-trial-score cycle over a
named SOFTWARE surface. One iteration:

1. **Propose** a change to ONE software artifact: the harness/action_surface, an Actor Turn or advisory-WAM prompt,
   a runtime contract/spec (schema, enum, gate config), an action skill (generated Mineflayer code), a
   verifier-as-code rule, a report template, an advisory-WAM predictor, or a benchmark scenario definition.
2. **Run a fixed-budget trial**: execute the actor cycle (or the WAM prediction) on a held-out seeded scenario under
   a fixed effort cap (Karpathy: a fixed budget makes trials comparable; SWE-agent caps per-instance cost with
   auto-submit on overrun).
3. **Score with the deterministic runtime verifier** on typed Physical/Material deltas. NEVER score with the actor's
   own CycleJudgment prose, an LLM judge, or a learned reward model. The verifier code is OUTSIDE the agent's
   editable surface.
4. **Keep or discard** on the verifier signal, plus an artifact-health check (erosion/verbosity) so a "passing"
   change that bloats or degrades the artifact is rejected (SlopCodeBench
   `../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2603.24755-slopcodebench.md`).
5. **Repeat**, keeping an archive of diverse candidates and their verifier scores; sample for diversity, not just the
   current best (DGM archive; AIDE solution tree).

SDK realization (what runs this loop concretely):
- The loop CONTROLLER is an SDK agent: Claude Agent SDK `query()` (the loop is the library, you do not hand-write the
  tool loop), or OpenAI Codex `codex exec` headless, or OpenHands' event-stream runtime, or an OpenAI Agents SDK
  agent driving Codex over MCP.
- The CHANGE-WRITING step is the SDK's edit tools (`Edit`/`Write`/`Bash`) under a sandbox.
- The PROMPT/SKILL-improvement variant is an optimizer call: DSPy/MIPRO `compile` against a metric, or GEPA
  `gepa.optimize(seed_candidate, ..., reflection_lm, max_metric_calls)` reflecting on verifier feedback. The metric
  is the deterministic verifier; the optimizer mutates the prompt only.
- The GATES are SDK primitives: Claude SDK `PreToolUse` hooks + `allowed_tools`; Codex `sandbox_mode` +
  `approval_policy`. These enforce the authority boundary in section 2 as code, not as model good intent.

## 2. The authority boundary (two columns, each row tied to a source)

This is the lane's core deliverable. Column (a): what an SDK-style loop (Codex/Claude/SWE-agent shaped) MAY improve
in this repo. Column (b): what it MUST NEVER decide. Every row carries the source that forces the split.

| Repo surface | (a) Loop MAY improve it | (b) Loop MUST NOT decide | Source forcing the split |
|---|---|---|---|
| Harness / action_surface / ACI | edit which typed tools exist, their feedback, their guardrails | which action is executed in a given turn; the meaning of "action succeeded" | SWE-agent ACI: interface design (not the model) shapes capability, and guardrails belong IN the interface (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2405.15793-swe-agent.md`) |
| Actor Turn / advisory-WAM prompts | reflect-and-mutate prompt text against verifier feedback (GEPA/MIPRO) | the success label of a cycle; whether progress is true | GEPA/DSPy keep the evaluator FIXED and user-owned, mutate only prompts (`notes/by-paper/2507.19457-gepa.md`, `../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2310.03714-dspy-and-mipro.md`) |
| Runtime contracts / specs (schema, enum, gate config) | propose schema/enum/gate-config edits as candidates | whether a transition is physically/materially valid (that is the verifier's call) | ENPIRE: agent may study failures but "cannot train on the test set or alter metric computation" (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/enpire.md`) |
| Action skills (generated Mineflayer code) | author/patch/re-trial/retire skill candidates | whether the skill physically achieved its post-condition | ENPIRE held-out verifier; SWE-bench execution owns pass/fail (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2310.06770-swe-bench.md` if present, else SWE-agent note) |
| Verifiers-as-code | propose a STRONGER verifier rule as a candidate, reviewed and promoted out-of-loop | run as the scorer of its own trial, or read/edit the live verifier from inside a turn | DGM node-114 objective hacking: an agent that can see/edit the checking logic removes it; hide the verifier from the improved agent (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2505.22954-darwin-godel-machine.md`) |
| Reports / transcripts | edit report templates, summarization, what gets logged | fabricate or assert results the verifier did not observe | AgentRxiv reward hacking: placeholder code, fake-output printing, hallucinated numbers, caught only by manual check (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2503.18102-agentrxiv.md`) |
| Advisory-WAM predictors | search/tune predictors, scored by verifier-observed deltas | select the executed action, fill args, mark progress, override the verifier | repo rule (WAM is advisory); a "solved" patch that passes but is wrong shows passing != correct (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2503.15223-swebench-solved-correctly.md`) |
| Benchmark scenarios | propose new seeded scenarios as candidates | promote a scenario into the held-out scoring set, or score itself on a scenario it authored | ENPIRE cannot-train-on-test; SWE-rebench freshness; LLMs-gaming-verifiers instance-only success (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2604.15149-llms-gaming-verifiers.md`) |
| Minecraft physical truth (blocks, position, inventory, durability, health) | nothing; read-only to the loop | everything; only the runtime observes it | physical layer is the runtime's, not the model's (repo direction; ENPIRE verifier separation) |
| Social truth (obligation, trust, conflict, repair) | nothing decided; only PROPOSE advisory predictions | label whether trust rose, an obligation closed, a conflict was repaired | no clean external scorer at the social layer; LLM-judge social scoring reward-hacks (AgentRxiv; AI-Scientist LLM-reviewer caution `../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2408.06292-ai-scientist-v1.md`) |
| Scoring / success labeling | propose a candidate verifier; never self-score | own the label; the deterministic verifier owns it, outside the agent | SICA: a no-weight-authority loop + external overseer is adequate ONLY because the agent does not control the scorer (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2504.15228-self-improving-coding-agent.md`) |
| Obligation closure / settlement continuity | propose advisory predictions about it | declare an obligation discharged or a settlement persistent | long-horizon, contested, no crisp metric (RE-Bench short-clean-tasks-overestimate `../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2411.15114-re-bench.md`) |

The single rule under the whole table (the proposer-equals-scorer line, already stated in
`../../../../2026-06-16/deep-social-wam-literature-review/matrices/autoresearch-loop-mapping.md` section C): an external
deterministic verifier may SCORE; the actor/LLM-judge/learned-reward scoring its own success is INADMISSIBLE. The
SDKs ENFORCE column (b)'s reachability (Codex sandbox modes; Claude `allowed_tools` + `PreToolUse` hooks; OpenHands
sandboxed runtime), but NONE of them supply the verifier or the anti-gaming guard. That separation is the repo's to
design; the SDK gives the enforcement primitives, not the truth signal.

## 3. How each SDK primitive maps to the boundary (the concrete enforcement)

- **Capability boundary (what tools/actions reach the world)**: Claude SDK `allowed_tools` (a read-only agent gets
  `["Read","Glob","Grep"]`); Codex `sandbox_mode` (`read-only` / `workspace-write` / `danger-full-access`);
  OpenHands Docker sandbox vs full-filesystem mode. The loop edits its own SOFTWARE inside a `workspace-write`
  sandbox; it does NOT get a tool that writes Minecraft physical truth or the verifier's labels.
- **Escalation boundary (when something beyond default needs sign-off)**: Codex `approval_policy`
  (`on-request` is the recommended pairing with `workspace-write`); Claude SDK `PreToolUse` hook can BLOCK,
  `canUseTool`/`AskUserQuestion` for interactive approval. Promoting a candidate verifier or a new scoring scenario
  is an escalation, gated out-of-loop (human, or at most an advisory reviewer agent).
- **Reviewer caution**: Codex `approvals_reviewer="auto_review"` routes escalations through a REVIEWER AGENT. Useful
  for triage, but it is still an LLM in the trust path. Keep it advisory: the deterministic verifier, never an LLM
  reviewer, owns success labeling (DGM, AI-Scientist LLM-reviewer caution).
- **Verifier isolation**: the verifier's checking code and thresholds must be OUTSIDE the agent's editable surface
  and ideally invisible to it (DGM node-114). With the SDKs this means: the verifier is not in the `workspace-write`
  scope, not an `allowed_tool` the agent can call to self-grade, and any verifier change is a separate, reviewed,
  out-of-loop PR.
- **Archive + non-greedy sampling**: DGM and AIDE keep diverse candidate stepping-stones; the SDK loop should persist
  every candidate + its verifier score and sample for diversity, not greedily extend the latest (greedy underperforms;
  path dependency poisons later ideas, SICA).

## 4. Admissibility across the 4 layers (Physical/Material SAFE; Social/Institutional UNPROVEN)

This restates, with the SDK tooling lens, the layer mapping in
`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-theme/research-area-coding-agent-autoresearch.md` section 3.
The gate is always: does a CLEAN external scorer exist for the loop to optimize.

| Layer | Clean deterministic verifier? | SDK loop admissibility | Why (source) |
|---|---|---|---|
| 1. Physical (blocks, position, inventory, durability, health) | Yes, near-$0 typed checks | SAFE. Run the full loop here: SDK edit tools + GEPA/MIPRO prompt opt + verifier-as-metric. | Karpathy clean held-out metric; ENPIRE held-out verifier; SWE-bench execution; SWE-agent ACI |
| 2. Material / economic (possession, control, transfer, claims) | Mostly, checkable typed facts | SAFE-to-mostly. Same loop; same verifier discipline for who-has-what. | autoresearch-loop-mapping section B (Physical/Material admissible); DSPy metric-as-checker |
| 3. Social (obligation, trust, conflict, repair, reputation) | Partly, only correlates (a borrow with no return; promise vs logged outcome) | UNPROVEN. Loop may PROPOSE advisory predictions; MUST NOT self-score social success. No single scalar h; LLM-judge social scoring reward-hacks. | AgentRxiv reward hacking; 2503.15223 passes-but-wrong worse when correctness is interpretive; AI-Scientist LLM-reviewer is agreement-with-humans not ground truth |
| 4. Institutional / settlement (norms, roles, commons, continuity) | Rarely, long-horizon and contested | UNPROVEN / LOWEST. Even clean short-horizon tasks get gamed; long-horizon multi-project R&D is ~2 OOM harder and humans win there. | RE-Bench (agents win short, humans win at 32h; real R&D ~2 OOM larger); LLMs-gaming-verifiers |

Dependency the contract demands stay visible: a layer-N prediction is meaningful only if the layers below are
reliable. The SDK loop converges Physical/Material first (clean verifier), and is NOT run hard at Social/Institutional
until those layers' verifiers are strong and scenarios are fresh.

## 5. The thesis tie (one line plus the bound)

Thesis: an SDK-style coding-agent autoresearch loop, grounded by the deterministic runtime verifier and kept
advisory, is a near-zero-cost, no-human-label way to improve the repo's advisory social-material WAM or actor policy.
Lane A verdict: SUPPORTED as TOOLING and tightly BOUNDED by authority. Supported, because today's SDKs (Claude Agent
SDK, Codex, OpenHands) expose exactly the loop primitives needed (the loop as a library, hooks/sandbox/approval gates,
subagents, MCP) and optimizers (DSPy/MIPRO, GEPA) that mutate prompts/skills against a fixed user-supplied evaluator
sample-efficiently. Bounded, because every one of these SDKs enforces only REACHABILITY, not TRUTH: none supplies a
verifier or anti-gaming guard, so the authority boundary in section 2 (verifier owns scoring, verifier isolated from
the agent, no self-scoring, Social/Institutional unproven) is the repo's responsibility and is the actual research
discipline, not the SDK choice.

## 6. Deconfliction

- This file owns: the SDK/framework TOOLING (Claude Agent SDK, Codex SDK/CLI, OpenHands, DSPy/MIPRO, GEPA loop
  primitives) and the explicit MAY-improve / MUST-NOT-decide authority boundary with 4-layer admissibility.
- The DIGITAL phenomenon, scored arenas (MLE/SWE/RE-bench), AIDE inner loop, SICA, AgentRxiv, the three inflation
  routes, and progress laundering are owned by
  `../../../../2026-06-16/deep-social-wam-literature-review/notes/by-theme/research-area-coding-agent-autoresearch.md`. Cited,
  not rewritten.
- The ENPIRE-module-to-repo-cycle mapping and the proposer-equals-scorer line are owned by
  `../../../../2026-06-16/deep-social-wam-literature-review/matrices/autoresearch-loop-mapping.md`. Cited, not rewritten.
- NEW by-paper notes added by this lane: `notes/by-paper/claude-agent-sdk.md`, `notes/by-paper/openai-codex-sdk.md`,
  `notes/by-paper/2407.16741-openhands.md` (old archive had abstract-only, no note), `notes/by-paper/2507.19457-gepa.md`.
- Existing notes CITED, not rewritten: SWE-agent (2405.15793), DSPy/MIPRO (2310.03714), DGM (2505.22954), SICA
  (2504.15228), AgentRxiv (2503.18102), SlopCodeBench (2603.24755), SWE-bench-solved-correctly (2503.15223), AIDE
  (2502.13138), MLE-bench (2410.07095), RE-Bench (2411.15114), LLMs-gaming-verifiers (2604.15149), AI-Scientist
  (2408.06292), ENPIRE, Karpathy autoresearch.
