# Lane A brief: SDK-style coding-agent autoresearch loops + the authority boundary

ASCII only. Separates verified facts from claim-only numbers.

## Scope

The SDK/framework TOOLING that makes the autoresearch loop a programmable object (Claude Agent SDK, OpenAI Codex
SDK/CLI, OpenHands, DSPy/MIPRO, GEPA, SWE-agent), and the explicit AUTHORITY BOUNDARY: what such a loop MAY improve
in this repo versus what it MUST NEVER decide, mapped across the 4 WAM layers. The DIGITAL phenomenon and the
ENPIRE-to-repo module map are already covered by the 2026-06-16 archive; this lane CITES them and adds the SDK-tooling
delta plus the two-column boundary table.

## Sources reviewed

- 17 manifest rows: 4 NEW deep-reads + 13 cited-existing.
- NEW (this lane): Claude Agent SDK (docs), OpenAI Codex SDK/CLI (docs), OpenHands 2407.16741 (deep-read; old archive
  had abstract-only row with empty notes_path), GEPA 2507.19457 (abstract + repo).
- CITED-existing (old archive, not rewritten): SWE-agent 2405.15793, DSPy/MIPRO 2310.03714, DGM 2505.22954, SICA
  2504.15228, AgentRxiv 2503.18102, 2503.15223, SlopCodeBench 2603.24755, LLMs-gaming-verifiers 2604.15149, AIDE
  2502.13138, MLE-bench 2410.07095, RE-Bench 2411.15114, AI-Scientist 2408.06292, ENPIRE, Karpathy autoresearch.

## Strongest findings (verified)

1. Today's coding-agent SDKs expose EXACTLY the loop primitives the autoresearch thesis needs, doc-verified:
   - Claude Agent SDK: the agent loop is the library (`query()`, no hand-written tool loop); deterministic gates via
     `PreToolUse`/`PostToolUse` hooks and `allowed_tools`; subagents (`AgentDefinition`, `Agent` tool); MCP; headless
     operation; session fork/resume for trial comparison.
   - OpenAI Codex: a clean two-axis authority model, SANDBOX (`read-only`/`workspace-write`/`danger-full-access`) and
     APPROVAL (`never`/`untrusted`/`on-request`/`on-failure`), recommended pairing workspace-write+on-request; OS-level
     enforcement (Seatbelt, bwrap+seccomp); `codex exec` headless; subagent TOML with per-agent sandbox overrides.
   - OpenHands: event-stream-as-state architecture, sandboxed Docker runtime owning safe execution, AgentSkills as a
     curated utility surface, explicit multi-agent delegation.
2. Two optimizers mutate the SOFTWARE surface against a FIXED user-supplied evaluator, which IS the proposer/scorer
   separation expressed as an API:
   - DSPy/MIPRO compiles prompts+demonstrations against a metric (the metric is the verifier in this framing).
   - GEPA reflects on full traces in natural language and mutates prompts, keeping the evaluator fixed; claim-only
     numbers (HF authoritative summary): beats GRPO by 10% avg / up to 20% with up to 35x fewer rollouts, beats
     MIPROv2 by over 10%. Sample-efficiency matters because the repo's social scenarios do not regenerate for free.
3. The authority boundary is forced row-by-row by the literature, not asserted: SWE-agent (ACI shapes capability,
   guardrails in the interface), DGM node-114 (an agent that can see/edit the checker removes it -> hide the verifier),
   AgentRxiv (reward hacking: placeholder code, fake-output printing, hallucinated numbers), 2503.15223 (passes !=
   correct), ENPIRE (cannot train on test or alter metric), SICA (no-weight-authority + overseer is adequate ONLY
   because the agent does not control the scorer).

## Weak / uncertain claims (flagged)

- GEPA numbers are abstract-stated (claim-only); a fetch discrepancy (arxiv.org HTML "6%/six tasks" vs HF
  "10%/four tasks") is resolved in favor of the HF authoritative summary but a LaTeX body read would settle it.
- OpenHands architecture facts (event stream, AgentSkills, CodeActAgent->BrowsingAgent delegation) are from the
  abstract + a SECONDARY paper-summary page + the README, NOT the paper body (PDF not text-extractable on fetch).
  Adequate for an authority-boundary note; flagged in the note and manifest.
- SDK facts are doc-level by design (these are tools, not papers); no code was deep-read. Doc text can lag the
  shipped SDK.

## Implications for the repo

- An SDK-style autoresearch loop is BUILDABLE TODAY with off-the-shelf primitives: a Claude Agent SDK or Codex loop
  controller, edit tools under a `workspace-write` sandbox, GEPA/MIPRO for prompt/skill improvement, and `PreToolUse`
  hooks / `approval_policy` as the gates. The repo does not need to invent the loop machinery.
- BUT every one of these SDKs enforces only REACHABILITY, not TRUTH. None supplies a verifier or an anti-gaming
  guard; `danger-full-access` exists. The authority boundary (deterministic verifier owns scoring, verifier isolated
  from and invisible to the improved agent, no self-scoring, Social/Institutional unproven) is the repo's to design
  and is the actual research discipline.
- Concrete enforcement mapping: the verifier must NOT be in the loop's `workspace-write` scope, must NOT be an
  `allowed_tool` the agent can call to self-grade, and any verifier change is a separate reviewed out-of-loop PR
  (DGM isolation). Promoting a new scoring scenario is an escalation, gated like a Codex `on-request` approval, never
  self-authored into the held-out set (ENPIRE cannot-train-on-test, SWE-rebench freshness).
- Layer admissibility: SAFE to run the loop hard at Physical/Material (clean deterministic verifier); UNPROVEN at
  Social/Institutional (no clean external scorer; LLM-judge social scoring reward-hacks). Converge the lower layers
  first.

## Recommended next questions

1. Which SDK is the loop controller for the repo (Claude Agent SDK in-process, Codex headless `codex exec`, or
   OpenHands event-stream runtime), and does the choice change how cleanly the verifier can be isolated from the
   agent's editable surface?
2. What is the minimal `PreToolUse` hook / `sandbox_mode` configuration that structurally prevents the loop from
   calling, reading, or editing the deterministic verifier (the DGM node-114 defense as concrete SDK config)?
3. If GEPA/MIPRO optimize Actor Turn / advisory-WAM prompts, what exactly is the textual feedback the verifier emits
   (the GEPA "Actionable Side Information") for a Physical/Material transition, and does that feedback leak any
   social-success judgment that would pull optimization toward an interpretive score?
4. What is the cheapest fresh-scenario generator (SWE-rebench-style freshness) for Physical/Material so the loop
   cannot overfit a fixed held-out set, given social scenarios do not regenerate for free?

## One-line tie to the thesis

An SDK-style autoresearch loop is SUPPORTED as ready tooling and tightly BOUNDED by authority: the SDKs give the loop,
the gates, and the optimizers, but never the truth signal, so the repo's deterministic verifier (owning scoring,
isolated from the improved agent, never self-graded) is what keeps the loop honest, and it is admissible at
Physical/Material and unproven above.

## Deconfliction

- This brief and `notes/by-theme/sdk-loop-mechanics-and-authority.md` own SDK TOOLING + the authority boundary +
  4-layer admissibility.
- The digital phenomenon, scored arenas, AIDE inner loop, SICA, AgentRxiv, the three inflation routes, and progress
  laundering remain owned by
  `../../../../2026-06-16/deep-social-wam-literature-review/notes/by-theme/research-area-coding-agent-autoresearch.md`
  (cited).
- The ENPIRE-module-to-repo-cycle mapping and the proposer-equals-scorer line remain owned by
  `../../../../2026-06-16/deep-social-wam-literature-review/matrices/autoresearch-loop-mapping.md` (cited).
