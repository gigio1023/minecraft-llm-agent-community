# SDK-loop authority boundary

What this is: the explicit split between what a Codex/Claude/SWE-agent-like coding-agent loop MAY
improve in this repo and what it MUST NOT decide, plus the verifier/scoring boundaries that the SDKs
enforce only as reachability (not as truth). Backing synthesis:
`../notes/by-theme/sdk-loop-mechanics-and-authority.md` (lane A). ASCII punctuation only.

## 0. The loop, made concrete (not vague self-improvement)

One iteration: PROPOSE a change to one named software artifact -> RUN a fixed-budget trial on a
held-out seeded scenario -> SCORE with the deterministic runtime verifier (never the actor, an LLM
judge, or a learned reward model) -> KEEP or DISCARD on the verifier signal plus an artifact-health
check -> REPEAT, keeping an archive of diverse candidates. SDK realization: the loop controller is an
SDK agent (Claude Agent SDK `query()`, OpenAI Codex `codex exec`, or OpenHands event-stream runtime);
the change-writing step is the SDK edit tools under a sandbox; the prompt/skill variant is a DSPy/MIPRO
`compile` or GEPA `optimize` call whose metric IS the verifier; the gates are SDK primitives.

## 1. What the loop MAY improve, and what it MUST NOT decide

Each row carries the source that forces the split.

| Repo surface | Loop MAY improve | Loop MUST NOT decide | Source forcing the split |
|---|---|---|---|
| Harness / action_surface / ACI | which typed tools exist, their feedback, their guardrails | which action is executed; the meaning of "action succeeded" | SWE-agent ACI: the interface (not the model) shapes capability; guardrails belong in the interface (2405.15793) |
| Actor Turn / advisory-WAM prompts | reflect-and-mutate prompt text against verifier feedback | the success label of a cycle; whether progress is true | GEPA/DSPy keep the evaluator FIXED and user-owned, mutate only prompts (2507.19457, 2310.03714) |
| Runtime contracts / specs (schema, enum, gate config) | propose schema/enum/gate-config edits as candidates | whether a transition is physically/materially valid | ENPIRE: may study failures but cannot train on the test set or alter metric computation |
| Action skills (generated Mineflayer code) | author, patch, re-trial, retire skill candidates | whether a skill physically achieved its post-condition | ENPIRE held-out verifier; execution owns pass/fail (SWE-bench 2310.06770) |
| Verifiers-as-code | propose a STRONGER verifier rule as a candidate, reviewed out-of-loop | run as the scorer of its own trial; read or edit the live verifier from a turn | DGM node-114: an agent that can see/edit the checker removes it; hide the verifier (2505.22954) |
| Reports / transcripts | edit templates, summarization, what is logged | fabricate or assert results the verifier did not observe | AgentRxiv reward hacking: placeholder code, fake-output prints, hallucinated numbers (2503.18102) |
| Advisory-WAM predictors | search and tune predictors, scored by verifier-observed deltas | select the executed action, fill args, mark progress, override the verifier | repo rule (WAM advisory); passes != correct (2503.15223) |
| Benchmark scenarios | propose new seeded scenarios as candidates | promote a scenario into the held-out scoring set; score itself on a scenario it authored | ENPIRE cannot-train-on-test; instance-only success (2604.15149) |
| Minecraft physical truth | nothing (read-only to the loop) | everything (only the runtime observes it) | physical layer is the runtime's, not the model's (ENPIRE verifier separation) |
| Social truth (obligation, trust, conflict, repair) | only PROPOSE advisory predictions | label whether trust rose, an obligation closed, a conflict repaired | no clean external social scorer; LLM-judge social scoring reward-hacks (2503.18102, 2408.06292) |
| Scoring / success labeling | propose a candidate verifier; never self-score | own the label (the deterministic verifier owns it, outside the agent) | SICA: no-weight-authority + overseer is adequate ONLY because the agent does not control the scorer (2504.15228) |
| Obligation closure / settlement continuity | propose advisory predictions about it | declare an obligation discharged or a settlement persistent | long-horizon, contested, no crisp metric (RE-Bench 2411.15114) |

## 2. Required verifier / scoring boundaries (the rule under the table)

The proposer-equals-scorer line (old archive `autoresearch-loop-mapping.md` section C): an external
deterministic verifier may SCORE; the actor, an LLM judge, or a learned reward model scoring its own
success is INADMISSIBLE (over-optimizes, hacks, or collapses; the repo term is "progress laundering").
Concrete boundaries the repo must enforce, because no SDK supplies them:

1. The verifier code and thresholds are OUTSIDE the loop's editable surface and, ideally, invisible to
   the improved agent (DGM node-114 defense).
2. The verifier is not an `allowed_tool` the agent can call to self-grade, and not inside its
   `workspace-write` sandbox scope.
3. Any verifier change is a separate, reviewed, out-of-loop change, never authored mid-trial.
4. Promoting a new scenario into the held-out scoring set is an escalation gated like a Codex
   `on-request` approval, never self-authored into the set (ENPIRE cannot-train-on-test; SWE-rebench
   freshness).
5. Keep an artifact-health check (erosion/verbosity, SlopCodeBench 2603.24755) alongside verifier
   pass, so a passing change that bloats or degrades the artifact is still rejected.

## 3. What the SDKs give vs what they do not

| SDK primitive | What it enforces | What it does NOT supply |
|---|---|---|
| Claude Agent SDK `allowed_tools`, `PreToolUse`/`PostToolUse` hooks, subagents, MCP, headless | capability and escalation gates (reachability) | the verifier; the truth signal; the anti-gaming guard |
| OpenAI Codex `sandbox_mode` (read-only / workspace-write / danger-full-access) + `approval_policy` | OS-level capability boundary + sign-off | same: reachability only; `danger-full-access` exists |
| OpenHands event-stream runtime + sandboxed Docker + AgentSkills | safe execution surface | same |
| DSPy/MIPRO `compile`, GEPA `optimize` | mutate prompts/skills against a FIXED user-supplied metric | the metric itself (the repo supplies the verifier as the metric) |

The SDKs make column-2 ("MUST NOT decide") UNREACHABLE as code, but none provides the verifier or the
honest signal. That separation is the repo's research discipline, not an SDK feature.

## 4. Layer admissibility

| Layer | Clean deterministic verifier? | Loop admissibility |
|---|---|---|
| Physical | Yes, near-$0 typed checks | SAFE: run the full loop here |
| Material / economic | Mostly (checkable typed facts) | SAFE to mostly |
| Social | Partly (only correlates) | UNPROVEN: loop may PROPOSE advisory predictions, must not self-score |
| Institutional / settlement | Rarely (long-horizon, contested) | UNPROVEN / lowest |

Converge Physical/Material first; do not run the loop hard at Social/Institutional until those layers'
verifiers are strong and scenarios are fresh.
