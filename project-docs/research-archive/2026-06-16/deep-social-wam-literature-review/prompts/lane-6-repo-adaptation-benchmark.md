# Lane 6 - Repo Adaptation and Benchmark Design

Read `prompts/00-shared-lane-contract.md` first. You are Lane 6 (N=6).

## Scope

Map the WAM direction onto THIS repo's actual constructs, and propose benchmark
families that evaluate whether a hierarchical WAM predicts and explains verified
Minecraft physical-material-social transitions. This lane is repo-facing: read
the repo deeply, then design adaptation and benchmarks that fit existing
contracts and constraints (do not invent a generic benchmark).

## Read the repo deeply (Read, do not run; do not edit)

`<repo>` = `/Users/user/git/ad-agent-metrics/research/wam`. Read at least:
- `<repo>/SPEC.md`, `<repo>/CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
- `<repo>/project-docs/Specification/Soul-Grounded-Social-Simulation.md`
- `<repo>/project-docs/Specification/Evidence-Grounded-Minecraft-Society.md`
- `<repo>/project-docs/Specification/Runtime-Evidence-And-Action-Skills.md`
- `<repo>/project-docs/Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`
- `<repo>/project-docs/Architecture/Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`
- `<repo>/project-docs/Architecture/Context-Projection-And-Source-Evidence.md`
- `<repo>/project-docs/Architecture/Actor-Persistent-State-And-PlanBeads.md`
- `<repo>/project-docs/Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md`
- `<repo>/project-docs/Architecture/Grounded-Social-Trajectory-Benchmark-Spec.md`
- `<repo>/project-docs/Architecture/Research-Direction-Reference-Synthesis.md`
- `<repo>/project-docs/research-archive/2026-06-16/social-wam-research-frame.md`
- Skim `<repo>/probe/src/` structure (objectives/socialTrajectory, runtime,
  provider, memory, skills, server/worldScenarios) to know what already exists.

## Focus: map WAM onto repo constructs

For each repo construct, state how it serves the hierarchical WAM and which layer
it touches: Actor Turn; Action Cards; `author_mineflayer_action`; runtime
verifier evidence; world-state scans + loaded-chunk limits; social-cycle reports;
PlanBeads; actor memory + relationships; material-claim records; weak-commons /
public-affordance state; obligation ledger; post-goal continuation; provider
quota constraints. Identify where a WAM prediction would attach (advisory:
predict deltas before acting; compare prediction vs verifier evidence after).
Identify what is MISSING to log a clean transition record.

## Propose benchmark FAMILIES (not one generic benchmark)

Design families that test whether a hierarchical WAM predicts/explains verified
transitions, building on the repo's existing seeds (`borrowed_tool_v1`,
`claimed_chest_v1`, `public_furnace_v1`, `scarce_food_v1`, `failed_promise_v1`,
`asymmetric_knowledge_v1`) and the benchmark ladder (competence gate -> dyadic
material claim -> asymmetric knowledge -> weak public affordance -> mixed-motive
-> post-goal continuation). For each family specify: the WAM layer(s) tested,
the candidate action(s) whose deltas are predicted, the verified evidence that
confirms/refutes, the metrics, the failure/overclaim boundary, and the minimum
runtime artifacts needed. Distinguish "competence gate" from "social contribution."

## Owned deliverables

- `matrices/repo-adaptation-matrix.md` - table: repo construct x {WAM layer(s),
  role in WAM (input/predict-target/verifier/advisory), what exists today, what
  is missing to log a transition record, mechanically-useful vs research-claim}.
- A benchmark-families section written into your subagent brief
  (`notes/subagent-briefs/lane-6-repo-adaptation.md`): the families, ladder
  mapping, metrics, artifacts, and overclaim boundaries. The coordinator folds
  this into the final report and the capstone theme file.
- by-paper notes only if you pull external benchmark-design references; manifest
  + search-log fragments.

Caution: respect repo invariants - WAM stays advisory (never executable
authority, never fills args, never overrides verifiers); no hidden domain planner;
prose is not authority; evidence is support not contribution; demote heavy
shared-commons economy; keep provider-cost/quota realism. Propose the FIRST
benchmark to build and what NOT to build yet.
