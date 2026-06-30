# Minecraft Agent Benchmarks - MineDojo, MineRL/BASALT, MCU, MineExplorer, Plancraft, Odyssey, MineNPC-Task

Lane 2 theme file. Audience: external team. Scope: how Minecraft agent benchmarks
set up tasks, what they use as *truth* (programmatic detector vs rule-based
milestone vs VLM/human score), how they encode task structure (dependency graphs,
preconditions), and the **command-fixture caveat** (command-injected inventory or
terrain is not natural-world evidence).

The single most important distinction for this project: **what is the source of
truth?** This repo's rule is structured in-world evidence (inventory deltas,
container snapshots, verifier output), not VLM scoring and not prose. The
benchmarks below sit on a spectrum from "rule-based / programmatic truth" (good
reference) to "VLM/human rubric truth" (use only as audit).

## 1. Truth-source spectrum (source-backed)

| Benchmark (id) | Truth source | Task structure | Command-fixtured? | Closest to repo's evidence stance? |
| --- | --- | --- | --- | --- |
| **MineNPC-Task** (2601.05215) | **machine-checkable validators, in-world evidence only, bounded-knowledge** | parametric templates w/ explicit preconditions + dependency structure | player-elicited, not synthetic | **YES - closest of all** |
| **MineExplorer** (2605.30931) | **rule-based milestone evaluators** (human-validated) | **latent multi-hop dependency graph** (1-4 hop); difficulty = capability load over prerequisite paths | scene-rendered + adjusted | strong (rule-based, structured) |
| **Plancraft** (2412.21033) | programmatic (crafting GUI state) + **intentionally-unsolvable** subset | crafting recipe trees; tests "decide if solvable" | GUI-fixtured (intended) | strong (programmatic + impossibility) |
| **MineDojo** (2206.08853) | programmatic detectors + **MineCLIP** for creative tasks | thousands of tasks; tech-tree + creative | many structured/command tasks | partial (MineCLIP is a proxy) |
| **MCU / SkillForge** (2310.08367) | six-dimension rubric, largely **VLM-graded** | atom-task composition; difficulty feature space | mixed | weak for truth (rubric) |
| **MineRL / BASALT** | competition: programmatic (Diamond) + **human preference** (BASALT) | ObtainDiamond; BASALT = no reward, human-judged | natural-world (Diamond) | mixed (BASALT is human-judged) |
| **Odyssey** (2407.15325) | programmatic skill success | long-term / dynamic-immediate / exploration tasks; 40+183 skill library | mixed | partial |
| **GROOT SkillForge** (2310.08235) | **human Elo** (pairwise) | 30 tasks, 6 groups | mixed | weak for truth (human Elo) |

## 2. The three benchmark mechanisms worth borrowing

### 2a. Machine-checkable validators + in-world evidence (MineNPC-Task)
MineNPC-Task is the **closest existing benchmark to this repo's stance**. It
executes via **public Mineflayer APIs**, judges **only from in-world evidence**
under a **bounded-knowledge policy** (no out-of-world shortcuts), pairs each
parametric task with **machine-checkable validators**, and captures
**plan/act/memory events** (plan previews, clarifications, memory reads/writes,
precondition checks, repair attempts). Its outcome metric - **success relative to
attempted subtasks**, from in-world evidence - is directly adoptable. Its limit:
single NPC + one human, task-completion framed; it does not measure durable
social-material consequence between multiple actors. So borrow the *mechanism*,
not the *target*.

### 2b. Latent dependency graphs + rule-based milestones (MineExplorer)
MineExplorer composes atomic tasks into **implicit multi-hop tasks** with a
**latent task dependency graph** and **rule-based milestone evaluators**, built by
a multi-agent synthesis workflow that renders the scene and adjusts milestones to
what actually appears in-world. Its empirical result is the one this project
should quote: **agents handle single-hop tasks but degrade sharply when hidden
prerequisites must be coordinated over longer trajectories**. That is the
operational form of "physical facts must be reliable before higher-level claims
hold" - an agent that cannot infer "pickaxe before mining" cannot sustain any
dependent social claim. The dependency-graph + milestone structure maps onto this
repo's PlanBeadGraph + verifier evidence.

### 2c. Explicit "impossible / decide-if-solvable" (Plancraft)
Plancraft deliberately includes **unsolvable crafting instances**, so the agent
must decide *whether* a task is doable, not just execute. This validates a stance
this repo cares about: an honest agent must be able to say "this cannot be done
with current resources," rather than laundering progress. The crafting-GUI
operations are also a clean **symbolic, programmatically-checkable** action/obs
surface.

## 3. The command-fixture caveat (critical for this repo)

Most Minecraft benchmarks **inject** the starting state with commands. The
MineStudio analysis counted **671 init commands across 153 tasks (368 `/give`, 93
`/replaceitem`, 56 `/summon`, 49 `/setblock`)**. MineDojo and Odyssey similarly
pre-provision. This is fine for a **controlled competence gate**, but a
command-given diamond pickaxe is **not natural-world acquisition** and must never
be counted as social-material evidence (you did not *earn*, *trade*, or *borrow*
it - the test harness handed it to you). This repo must **label** every scenario
as natural-world vs command-fixtured, and only natural-world acquisition can
ground a material claim (possession, scarcity, hoarding-vs-contribution).

## 4. What this repo can adapt vs avoid

**Adapt (mechanically useful)**:
- MineNPC-Task's parametric-template + precondition + validator schema, and its
  "success / attempted-subtasks from in-world evidence" metric.
- MineExplorer's dependency-graph + rule-based milestone construction, and its
  knowledge-decoupling filter (keep scenarios about reasoning/social pressure, not
  Minecraft trivia).
- Plancraft's explicit impossibility/stop action.
- MCU's six difficulty dimensions to *control* for task difficulty when isolating
  social pressure.

**Avoid (overclaim risk)**:
- VLM/rubric scoring (MCU) or human Elo (GROOT SkillForge) as runtime truth - they
  are audit layers at best, and blind to possession/obligation.
- Treating command-fixtured inventory/terrain as natural-world progress.
- Treating any **task-completion** number as a **social** result. Every benchmark
  here scores task success or skill mastery; none scores whether a promise was
  kept, a debt repaid, a claim respected, or a settlement persisted post-goal.

## 5. Where these benchmarks leave the social-material gap unfilled

All of these are **competence + planning + memory** benchmarks for (mostly) a
single agent. MineNPC-Task adds memory/repair; MineExplorer adds prerequisite
coordination; Plancraft adds solvability judgment. **None** scores durable
social-material consequence: possession and material claims over time,
borrowing/lending with obligation/credit, weak-commons maintenance, public-
affordance use, or post-goal continuation. The benchmark layer gives this project
excellent *verification machinery* (validators, milestones, dependency graphs) but
the *social-material scoring* is net-new and is this repo's contribution.
