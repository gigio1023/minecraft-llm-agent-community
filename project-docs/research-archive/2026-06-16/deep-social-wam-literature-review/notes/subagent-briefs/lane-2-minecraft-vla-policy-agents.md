# Lane 2 Brief — Minecraft Agent / VLA / Visual Policy / Benchmarks

Lane: 2 (Minecraft embodied-agent stack: VLA/visual policies, LLM planners, skill
libraries, task benchmarks, multi-agent collaboration). Date: 2026-06-16.

## Sources reviewed (count + list)

**26 sources** in `raw-search-results/lane-2-manifest.jsonl`. **14 LaTeX**
downloaded + read (intro/method/action-obs/data/eval). The rest abstract/repo/docs.

LaTeX-read (14): VPT 2206.11795, STEVE-1 2306.00937, GROOT 2310.08235, GROOT-2
2412.10410, ROCKET-1 2410.17856, Skill-Discovery 2503.10684, JARVIS-VLA
2503.16365, MineDojo 2206.08853, MCU 2310.08367, MineNPC-Task 2601.05215,
MineExplorer 2605.30931, MineCollab/MINDcraft 2504.17950, Optimus-2 2502.19902,
Optimus-3 2506.10357.

Abstract/web-verified: VillagerAgent/VillagerBench 2406.05720, TeamCraft
2412.05255, Plancraft 2412.21033, Odyssey 2407.15325, MineLand 2403.19267,
CausalMACE 2508.18797, S-Agents 2402.04578, HAS 2403.08282, MindForge 2411.12977,
Narayan-Chen MDC P19-1537, MineStudio 2412.18293, PillagerBench 2509.06235.

**Owned deliverables written**: 4 theme files (`minecraft-vla-and-visual-policy`,
`minecraft-agent-benchmarks`, `minecraft-multi-agent-social`,
`minestudio-positioning`); 2 matrices (`action-space-comparison`,
`observation-space-comparison`); 10 by-paper notes; manifest + search-log; this
brief. MineStudio analyses re-used (NOT re-cloned) per brief.

## Strongest findings (source-backed)

1. **The whole Minecraft policy lineage is VLA / visual policy, not WAM.** VPT →
   STEVE-1 → GROOT → ROCKET-1 → JARVIS-VLA are reactive `p(a|o[,goal/mask])`
   controllers; none co-generates a predicted future `o'` to align actions. GROOT
   trains *by* future-state prediction but uses it only to induce a goal space, so
   it is still a visual policy at decision time. They are the **competence body**,
   not a consequence model. (LaTeX-confirmed: VPT §method/§a_2; STEVE-1 §3;
   GROOT main; ROCKET-1 §method; JARVIS-VLA §pipeline.)
2. **MineNPC-Task (2601.05215) is the closest existing benchmark to this repo's
   evidence stance** — Mineflayer execution, machine-checkable validators, judge
   *only* from in-world evidence, bounded-knowledge policy, plan/act/memory event
   capture, success/attempted-subtasks metric. But it is single-NPC + one human,
   task-completion framed; it validates the *mechanism* this repo needs, not the
   *social target*.
3. **The social-material transition gap is concrete and unoccupied.** Multi-agent
   Minecraft can already share items (MineCollab `givePlayer`), force requests
   (Hell's Kitchen asymmetry), create scarcity (MineLand 64-agent physical needs),
   and model others' minds (MindForge ToM) — but **every** system scores **task
   completion / coordination efficiency**, none tracks possession over time,
   obligation/credit, weak commons, or post-goal continuation. MineCollab's
   headline: communication is the bottleneck (−15% when agents must communicate
   detailed plans) — talk is pivotal but scored as instrumental cost, not social
   consequence.

## Weak / uncertain claims (could not fully verify)

- **TeamCraft, VillagerBench, CausalMACE, S-Agents, HAS, MindForge, PillagerBench**:
  abstract/web only, no LaTeX read. Quantitative claims (e.g. TeamCraft "<50%
  generalization", CausalMACE "+12%/+7%") are taken from abstracts; method detail
  unverified. Marked `partial`/`claim-only` in the manifest.
- **MineDojo full corpus** (730k YouTube / 7k Wiki / 340k Reddit) — sizes from the
  paper; the HF `osanseviero/minedojo_knowledge` record is a tiny dump, not the
  full corpus (full corpus partially access-gated).
- **STEVE-21K dataset**: not a clean HF dataset record (hosted off-Hub); existence
  confirmed via STEVE paper, shape unverified on Hub.
- **GROOT-2 / Skill-Discovery (2412.10410 / 2503.10684)**: LaTeX downloaded but
  read shallowly (lower priority than the core five policies); notes are light.

## Implications for this repo (mechanically useful vs research contribution)

**Mechanically useful (engineering to borrow)**:
- MINDcraft's **47 high-level tools** (esp. `givePlayer` item handoff) as an
  Action-Card parts list; MineCollab's **edit-distance** structured verifier;
  Hell's Kitchen / MineLand as **forced-request + scarcity** scenario generators.
- MineNPC-Task's **parametric-template + precondition + validator** schema and
  **in-world-evidence / attempted-subtask** metric.
- MineExplorer's **latent dependency graph + rule-based milestone** construction
  (maps to PlanBeadGraph + verifier); Plancraft's **explicit impossibility** action.
- ROCKET-1's principle (**typed structured channel beats prose** between reasoner
  and executor) independently validates the Action-Card schema bet.

**Research contribution (net-new, do NOT claim as borrowed)**:
- Typed **social-material ledger** (claims, obligations, relationships, memory) as
  first-class observation + the WAM that predicts **social-material deltas** — no
  surveyed Minecraft system exposes or predicts this (all world models predict
  pixels; all agents score task completion).

**Must avoid (overclaim risk)**: camera/buttons as actor authority; MineCLIP/VLM
or human-Elo scoring as runtime truth; command-fixtured inventory as natural-world
acquisition; any task-completion number read as social contribution; a central
omniscient state manager (others' state must cost something to learn).

## Recommended next questions

1. Can the **MineNPC-Task harness shape** (Mineflayer + validators + plan/act/
   memory events) be extended from single-NPC to multi-actor with a social ledger
   — i.e. is its event schema a viable base for scoring obligation/claim/handoff?
2. What is the minimal **social-consequence metric** that is as machine-checkable
   as MineExplorer's milestones but scores durable consequence (debt repaid, claim
   respected, commons maintained, post-goal continuation) rather than task done?
3. Should a MineStudio visual policy (STEVE-1/ROCKET-1) be wired as an **isolated
   executor baseline** to contrast LLM-Actor-Turn agents on the *physical
   competence gate*, keeping it strictly out of the social/evidence authority path?
4. Is the **structured-state WAM branch** (predict typed social-material deltas)
   defensible as a research gap given that every Minecraft world model predicts
   pixels and every Minecraft agent scores task completion? (Lane 2 evidence says
   yes — the branch is inside the WAM definition yet absent from the literature.)
