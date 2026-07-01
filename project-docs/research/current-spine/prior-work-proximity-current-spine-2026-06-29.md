# Prior-Work Proximity: Current Goldilocks-Gated Spine

Status: active research-planning artifact. This is a proximity map, not a
literature review and not a claim that novelty is proven.

Search token: `CURRENT_PRIOR_WORK_PROXIMITY_2026_06_29`.

Recorded: 2026-06-29 (`Asia/Seoul`).

Artifact type: `prior-work-proximity/v1`.

## Purpose

The current central plan needs close-prior-work pressure before it becomes a
paper framing. This file records which nearby systems could erase or weaken the
project's claim and what gap remains after the WAM reframe.

Use this with:

- `Research-Value-Harness.md`
- `Research-Decision-Current-Spine-2026-06-29.md`
- `Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
- `Goldilocks-Preflight-Protocol.md`

## `prior-work-proximity/v1`

```yaml
schema_version: prior-work-proximity/v1
query_log:
  - query: Cursor session 7f014c89-220c-4a25-83d7-79babe0e8f67 and 14 subagent transcripts
    tool: local Cursor transcript archive
    date: 2026-06-27
  - query: WAM/VLA/social-world-model/Minecraft-agent archive synthesis
    tool: project-docs/research-archive and Research-Direction-Reference-Synthesis.md
    date: 2026-06-29
sources:
  - title: Voyager and skill-library Minecraft agents
    url_or_path:
      project-docs/research/reference-synthesis/research-direction-reference-synthesis.md
    source_type: local synthesis of prior papers and systems
    mechanism_taught:
      LLM agents can iteratively acquire and reuse executable skills for
      Minecraft task progress.
    closest_overlap:
      Actor-owned action skills, execution evidence, curriculum pressure, and
      Minecraft task competence.
    gap_remaining:
      Task success and skill acquisition do not isolate action-conditioned
      physical/material/social consequences from acting competence or LLM prior.
    caution:
      Do not revive Voyager-style generated-code execution as the active path.

  - title: MineDojo, MineStudio, MineWorld/Solaris, VPT/STEVE/JARVIS-style Minecraft systems
    url_or_path:
      project-docs/research/reference-synthesis/research-direction-reference-synthesis.md
    source_type: local synthesis of Minecraft benchmark/world-model references
    mechanism_taught:
      Minecraft provides scalable tasks, trajectories, callbacks, reset
      discipline, visual policies, and world-model/control surfaces.
    closest_overlap:
      Runtime substrate, seed/reset discipline, task manifests, competence
      controls, and action-conditioned dynamics.
    gap_remaining:
      These systems mostly target task competence, visual control, or world
      modeling, not small social-material consequence layers with separate LLM
      prior and history-grounded baselines.
    caution:
      Physical/material mechanics may be too easy and should often become
      controls.

  - title: Project Sid
    url_or_path:
      project-docs/references/external-project-notes/project-sid-2411-00114-review-2026-06-15.md
    source_type: local review of public technical report and artifact status
    mechanism_taught:
      Minecraft many-agent society claims can propose roles, norms, culture,
      resource allocation, and relationship graphs.
    closest_overlap:
      Broad Minecraft society framing and social/economic case ideas.
    gap_remaining:
      Public artifacts do not provide a reproducible runnable benchmark with raw
      logs, scoring scripts, seeds, or independent replication. The local project
      can be narrower and more inspectable.
    caution:
      Treat Project Sid as case-mining and failure-mode material, not a verified
      baseline or target style.

  - title: Generative Agents, SOTOPIA, AgentSense, Lifelong SOTOPIA, Concordia-style social simulation
    url_or_path:
      project-docs/research/reference-synthesis/research-direction-reference-synthesis.md
    source_type: local synthesis of LLM social-simulation references
    mechanism_taught:
      Memory, reflection, goals, role context, social scenarios, and multi-turn
      evaluation can produce or measure social behavior in language-rich settings.
    closest_overlap:
      ActorSoul/LifeGoal continuity, relationship context, obligations,
      scenario design, and social-response labels.
    gap_remaining:
      Dialogue/social plausibility does not prove embodied material consequence
      in Minecraft. This repo needs runtime-observed deltas and bounded response
      windows.
    caution:
      Do not import hidden game-master truth or prose-only relationship labels as
      Minecraft ground truth.

  - title: S3AP, Social World Models, and adjacent social prediction work
    url_or_path:
      historical stress-test archive referenced by older planning notes; not
      present in this checkout after the documentation cleanup
    source_type: Cursor-era literature stress-test archive
    mechanism_taught:
      Structured social prediction can model event consequences, social state,
      and behavior forecasts.
    closest_overlap:
      Prediction of social response and state change.
    gap_remaining:
      The local claim must be Minecraft-embodied, material-grounded, and tested
      against LLM-prior/current-observation/history-grounded baselines rather
      than relying on social prediction vocabulary.
    caution:
      If the local labels become dialogue-only or scenario-forced, this prior
      work weakens the novelty sharply.

  - title: Robotics World Action Model and VLA literature
    url_or_path:
      historical WAM/VLA naming review referenced by older planning notes; not
      present in this checkout after the documentation cleanup
    source_type: Cursor-era WAM/VLA naming and mechanism review
    mechanism_taught:
      World/action models and VLA systems may couple action and future-state
      prediction, sometimes treating WAM as policy or control.
    closest_overlap:
      Action-conditioned consequence modeling and WAM terminology.
    gap_remaining:
      This repo's active object is not a policy-coupled WAM. It first collects
      independent observation rows and later tests whether consequence prediction
      has headroom.
    caution:
      Do not use WAM as the active banner name in new direction docs.

  - title: AI Scientist, Agent Laboratory, DSPy/GEPA, SWE-agent, Codex/Claude SDK loops
    url_or_path:
      project-docs/references/literature-reviews/sdk-autoresearch-social-wam-positioning-2026-06-17/
    source_type: local autoresearch and coding-agent loop archive
    mechanism_taught:
      Coding agents and optimizers can propose changes to prompts, code,
      scenarios, and reports when a locked metric exists.
    closest_overlap:
      Future F-loop branch and repo-maintenance agent workflows.
    gap_remaining:
      These loops are methods, not the substantive Minecraft research target.
      They cannot own truth, scoring, or social labels.
    caution:
      Do not build the loop before the Goldilocks gate names a meaningful target.

  - title: Research soundness and discovery benchmarks
    url_or_path:
      .agents/skills/minecraft-research-value-harness/references/source-and-hf-research.md
    source_type: local harness reference list
    mechanism_taught:
      Idea generation, proposal soundness, experimental design, and research
      automation benchmarks expose optimism bias and idea/execution collapse.
    closest_overlap:
      The meta-problem of avoiding impressive but ungrounded research plans.
    gap_remaining:
      They do not answer the Minecraft-specific question; they provide review
      discipline for local planning.
    caution:
      Do not accept model self-review or "validated/structured" wording as
      evidence of research value.
novelty_delta:
  The remaining candidate gap is not "Minecraft agents" and not "verified logs."
  It is the conjunction of small embodied Minecraft runs, independent
  state/action/observed-delta rows, LLM-prior baselines, history-grounded
  comparison, and material/social-response labels that are neither obvious nor
  pure noise.
weakening_evidence:
  - If LLM-prior solves the labels, F-native/F-loop are weak.
  - If history adds no lift, consequence prediction should not become the
    headline for that layer.
  - If social labels are dialogue-only, scenario-forced, or pathing-confounded,
    the project is too close to existing social-simulation or Minecraft task
    work.
  - If 2-3 actor runs stay degenerate, all headline candidates remain blocked.
```

## Strongest Current Objection

The most rigorous labels may be too easy, while the interesting labels may be
too noisy or scenario-forced. The plan is only defensible if the no-regret core
creates rows where this objection can be tested cheaply.

## What This Artifact Does Not Prove

This artifact does not prove novelty, paper-worthiness, or statistical
significance. It only makes the closest overlap explicit enough that the
Goldilocks preflight can pressure the actual gap instead of repeating a broad
research slogan.
