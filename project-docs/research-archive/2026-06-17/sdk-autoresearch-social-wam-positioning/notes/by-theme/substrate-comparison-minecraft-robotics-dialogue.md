# Substrate Comparison: Minecraft vs Robotics Sim vs Dialogue-only Social Sim

Lane C synthesis. Audience: external team; jargon defined on first use. Scope: why wild,
natural Minecraft is scientifically useful for **grounded social-WAM research** relative to
(1) robotics simulators (MuJoCo, Isaac Sim, Habitat 3.0) and (2) dialogue-only social
simulation (Generative Agents, SOTOPIA), and, just as important, what Minecraft **cannot**
claim against each. This file is the source for the
`minecraft-vs-robotics-vs-dialogue-sim` matrix.

Framing vocabulary (from the shared contract). The object of interest is an
action-conditioned predictor `p(o' | o, l)`: given observation `o` and a latent/action
`l`, predict the next observation `o'`, where `o'` includes physical, material, AND
social-material deltas. The repo's four-layer hierarchy, a prediction at layer N is
meaningful only if the layers below are reliable:

1. Physical: blocks, position, inventory counts, reachability, durability, health.
2. Material / economic: possession, control, transfer, claims over resources.
3. Social: obligation, trust, gratitude, conflict, repair, cooperation, reputation.
4. Institutional / settlement: persistent norms, roles, commons maintenance, continuity.

A "substrate" here is the world that produces `o` and resolves the effect of `l`. The
question is which substrate lets you observe and **verify** deltas at each layer, at what
cost, for how many actors.

## 1. The one axis that separates the three families

Two independent properties decide a substrate's fitness for grounded social study:

- **Does it have a deterministic material verifier?** Can the environment (not a judge)
  state, exactly and cheaply, who holds what, who controls what, and whether a transfer
  happened? This is the difference between a *verified world consequence* and a *plausible
  claim* (the distinction the social-sim literature is built around; see the old archive's
  `llm-social-simulation.md` section 1).
- **What does fidelity cost per actor?** High physical fidelity (contact dynamics,
  deformable humanoids, photorealism) raises per-agent compute and caps the agent count.
  Society-scale social study wants the opposite: many cheap, deterministic actors.

Minecraft is the only one of the three that scores well on **both**: an exact discrete
material state any runtime verifier can read, at a per-actor cost low enough for many
actors. Robotics sim wins physical realism and loses on both verifier-cheapness and
agent-count. Dialogue sim wins on agent-count and cost but has **no material verifier at
all**.

## 2. Minecraft (wild, natural, headless runtime)

What it grounds well:
- **Physical layer, deterministically and for free.** The game engine *is* ground truth.
  A headless Mineflayer runtime emits exact typed facts: inventory counts, positions,
  container contents, block changes, durability, health. There is no perception error and
  no reality gap to cross, the state is exactly what the engine says.
- **Material / economic layer, natively.** Minecraft has real items with location, count,
  scarcity, and durability; chests and containers; and the act of moving an item is a true
  state change, not a narrated one. Possession, transfer, and control over a resource are
  first-class engine facts. This is the layer that dialogue sims lack a verifier for and
  that robotics benchmarks include only as "object moved to target pose."
- **Triplet supervision for free.** Every validated tool call plus the verifier delta
  yields an `(o_t, a_t, o_{t+1})` triplet, the data a world model wants, with no inverse
  dynamics model and no human labeling (mechanism borrowed from VPT/STEVE-1 hindsight
  relabeling, but obtained directly; see the old archive's
  `minecraft-vla-and-visual-policy.md` section 5).
- **Open, internet-scale task substrate.** MineDojo (2206.08853, old archive note) is the
  proof that Minecraft is an open-ended task world with internet-scale knowledge (~730k
  YouTube videos, ~7k wiki pages, ~340k Reddit posts) and thousands of tasks with
  programmatic detectors. "Wild, natural" means tasks and resources arise from the world,
  not only from injected fixtures, the natural-world-vs-command-fixtured distinction the
  old archive's `minecraft-agent-benchmarks.md` section 3 makes (MineStudio counted 671
  init commands across 153 tasks; command-given items are not earned and must not count as
  material evidence).

What it cannot ground:
- **Real-world physical transfer.** Minecraft physics are game-stylized (block gravity,
  instant crafting, no real contact dynamics). A policy that works in Minecraft says
  nothing about a physical robot. That claim belongs to robotics sim.
- **Pixel-level perception realism.** Minecraft's renderer is low-fidelity and stylized;
  it is not a testbed for photorealistic visual perception or sensor noise.
- **Human-fidelity social claims.** Minecraft has no per-actor real-human ground truth, so
  it cannot claim to reproduce real human society (the same boundary the social literature
  draws; see `benchmark-validity-and-evaluation.md` section 3).

Reproducibility / cost posture:
- **Near-zero verification cost** (read engine state), **deterministic** (same seed +
  same actions = same world), headless and scriptable. Runs on commodity hardware,
  including the repo's Apple-Silicon TypeScript stack, no GPU, no JDK/Ray/Lightning
  training rig (contrast the MineStudio/MineRL Python stack; old archive
  `minestudio-positioning.md` section 2).

Social-scale feasibility:
- **High.** Many lightweight actors can share one world at the LLM Actor Turn cadence
  (multi-second), and their material interactions are exactly verifiable. This is the
  combination society-scale grounded social study needs.

## 3. Robotics simulators (MuJoCo, Isaac Sim, Habitat 3.0)

What they ground well:
- **Physical fidelity and real-world transfer.** This is their reason to exist. Contact
  dynamics, rigid/deformable bodies, sensor models, and (Isaac Sim) photorealistic
  rendering exist so a policy can cross the **reality gap** and run on a physical robot.
  MuJoCo is rated the most accurate/fastest single-robot physics engine; Isaac Sim adds
  photorealism. (`2009.13303-sim-to-real-survey.md`.)
- **Embodied motion coordination.** Habitat 3.0 (2310.13724) adds humanoid avatars and a
  human-in-the-loop tool, and studies Social Navigation (locate and follow a partner) and
  Social Rearrangement (rearrange a scene together). PARTNR (2411.00081) scales
  household human-robot collaboration to 100,000 tasks, 60 houses, 5,819 objects, with
  simulation-in-the-loop verification.

What they cannot ground (for social study):
- **Material consequence and the social layers.** Habitat's "social" is physical
  co-presence and motion: "yielding space" is collision courtesy, not a persisted
  obligation. There is no possession ledger that carries a debt, no trust/credit/repair
  state, no claim over a contested resource, no post-task continuation
  (`2310.13724-habitat-3.md`). PARTNR verifies against simulator state but **scores task
  success and step efficiency**, not a social-material delta (`2411.00081-partnr.md`).
  The substrate *could* carry possession state; the benchmarks do not, and the layer above
  coordination is unaddressed.
- **Cheap many-actor society.** High-fidelity humanoid physics is the expensive component.
  Habitat 3.0 reports throughput for a **dyad** (one humanoid + one robot, 1191 FPS over
  16 envs on one GPU; a single humanoid is 188 FPS vs 245 for the robot because of joint
  count). Isaac Sim's huge throughput (claim-only: ~82k-94k FPS) comes from 4096 parallel
  **independent** environments, not 4096 agents co-inhabiting one social world. Physical
  fidelity is spent on transfer, not on hosting a society.

Reproducibility / cost posture:
- The **reality gap is intrinsic and inevitable** (survey B, 2502.13187, verbatim:
  "inevitable sim-to-real gap"). Reproducibility within sim is good, but the whole field
  (domain randomization, domain adaptation, system identification) exists to fight a gap
  Minecraft does not have. Per-actor cost is high (GPU, contact solver, rendering); robot
  data to ground/validate transfer is expensive and slow to collect (the data-cost premise
  behind teleop-heavy foundation models like GR00T-N1, `2503.14734-groot-n1.md` in the old
  archive).

Social-scale feasibility:
- **Low for many-actor social study.** Built for one or a few embodied agents that must
  transfer to hardware. Hosting many high-fidelity humanoids in one world is costly, and
  the scored outcomes are coordination/competence, not social-material consequence.

## 4. Dialogue-only social simulation (Generative Agents, SOTOPIA, and kin)

What it grounds well:
- **Rich social vocabulary and many cheap actors.** This family defined the constructs:
  Generative Agents (2304.03442) gave the memory/reflection/planning architecture and the
  evidence-linked reflection idea; SOTOPIA (2310.11667) gave the seven-dimension social
  rubric (goal, believability, knowledge, secret, relationship, social rules,
  financial/material). Actors are text-only, so scaling to many is cheap (AgentSociety runs
  10k+; see `llm-social-simulation.md` section 5).
- **Plausible interaction and emergent narrative.** Believable dialogue, coordination
  stories (the Generative Agents Valentine's-party), negotiation transcripts.

What it cannot ground (the decisive gap):
- **Any verified material consequence.** There is no inventory, no possession, no physical
  verifier. SOTOPIA's actions (`speak`, non-verbal, `physical action`, `none`, `leave`)
  **all resolve to text**; even its one material dimension (Financial and Material
  Benefits) is scored by an LLM/human reading the transcript, not by a ledger the
  environment enforces (`2310.11667-sotopia.md`). Generative Agents is entirely
  natural-language: plans and reflections *are* the agent's truth, with no external state
  that could refute them (`2304.03442-generative-agents.md`). A promised transfer that
  never materially happens cannot be caught, because nothing materially happens at all.
- **A trustworthy judge in the regime that matters.** The LLM judge that certifies
  "plausible" is unreliable exactly where this family operates: it correlates with humans
  on goal/material dimensions but weakly on diffuse social constructs, over-rates, and
  over-rates believability at long context (the long-run regime social study cares about).
  See `benchmark-validity-and-evaluation.md` section 6. So dialogue sim's scores are
  plausibility, not consequence, and even the plausibility score is shaky at length.

Reproducibility / cost posture:
- **Cheapest per actor**, easy to scale in agent count, but **not deterministic** at the
  state layer (no material state exists to be deterministic about), and its validity
  depends on a judge that is itself part of the validity risk.

Social-scale feasibility:
- **High in agent count, but ungrounded.** You can run a large society of talkers; you
  cannot verify that any social claim corresponds to a material change, because there is no
  material layer. By the four-layer rule, social predictions sit on a missing physical and
  material floor.

## 5. The matrix (compact)

| Property | Minecraft (this repo) | Robotics sim (MuJoCo/Isaac/Habitat 3.0) | Dialogue-only social sim (GenAgents/SOTOPIA) |
| --- | --- | --- | --- |
| Physical layer grounded? | yes, deterministic engine truth | yes, high fidelity (the point) | no |
| Material layer (possession/transfer/claim) verifiable? | **yes, native + cheap** | partial (object pose; not as social state) | **no** (text only) |
| Social/institutional layer as verified state? | repo's target (built on verified material) | no (co-presence/coordination only) | named but judge-scored, not verified |
| Reality gap to real world? | none (engine is truth) -> no transfer claim | **yes, inevitable** -> transfer is the claim | n/a (no physical layer) |
| Per-actor cost | low (headless, no GPU) | high (contact physics, rendering, GPU) | lowest |
| Verifier | deterministic runtime, near-zero cost | sim state check (Habitat/PARTNR) for tasks | LLM/human judge (unreliable, over-rates) |
| Many-actor society feasible? | **yes** | low (fidelity caps agent count) | high count, but ungrounded |
| Real-world physical transfer claim? | no | **yes** | no |
| Pixel/perception realism claim? | no (stylized) | **yes (Isaac)** | n/a |
| Open natural-world tasks? | yes (MineDojo) | scene/household tasks | scenario scripts |

## 6. Honest summary (the lane's thesis, source-backed, no overclaim)

Minecraft's scientific value for grounded social-WAM research is specific and defensible:
it is a **deterministic material substrate at society scale with near-zero verification
cost**. It is the only one of the three families where (a) possession, transfer, and
control are exact engine facts a runtime verifier can read for free, and (b) many
lightweight actors can co-inhabit one world. That combination is exactly what a four-layer
social predictor needs, a reliable physical and material floor under any social claim, and
enough actors to make "social" mean more than a dyad. The verified-consequence-vs-plausible
distinction that the social-sim literature spent years establishing is, in Minecraft,
simply a property of the substrate.

What Minecraft **cannot** claim, and the lane states plainly:
- **Real-world physical transfer is robotics' claim, not Minecraft's.** Minecraft has no
  reality gap, so it also has no transfer story; a Minecraft result says nothing about a
  physical robot. If the question is "will this run on hardware," the substrate is MuJoCo /
  Isaac / Habitat, and the price is the inevitable sim-to-real gap.
- **Pixel-level perception realism is robotics' (and pixel-WM) claim, not Minecraft's.**
  Minecraft's renderer is stylized; it is not a photorealistic perception testbed.
- **Human-fidelity social claims are no substrate's to make cheaply, and dialogue sim
  shows why.** Dialogue sims have the richest social vocabulary and the cheapest actors,
  but with no material verifier they cannot test material consequence at all, and their
  judge is unreliable. Minecraft does not inherit their human-fidelity ambition; it claims
  the narrower, provable thing, **verified, world-grounded social-material trajectories for
  a named model/partner/seed**, which is more defensible precisely because it is narrower
  (`benchmark-validity-and-evaluation.md` sections 3 and 9).

One sentence: robotics sim owns physical transfer (and pays the reality gap), dialogue sim
owns social vocabulary (and has no material verifier), and Minecraft owns the cheap,
deterministic, society-scale material substrate that lets social predictions stand on a
verified physical and material floor, which is the floor the other two cannot give at the
same time and cost.

## 7. Implications for the repo (brief)

- Position Minecraft as the **material-substrate** choice, not as a robot proxy or a better
  chatroom. The pitch is "verified material consequence, cheaply, for many actors," not
  "realistic physics" or "believable dialogue."
- Keep the verifier non-generative and deterministic. The whole advantage over dialogue sim
  is that the environment, not a judge, states the material delta. Adopting an LLM judge or
  LLM game master as the material authority would throw away the substrate's one decisive
  edge (`llm-social-simulation.md` section 5 on Concordia's LLM game master).
- Label every scenario natural-world vs command-fixtured; only natural-world acquisition
  grounds a material claim (`minecraft-agent-benchmarks.md` section 3).
- Do not claim transfer or perception realism. Cite robotics sim as the place those claims
  live, and cite the reality-gap surveys when explaining why Minecraft deliberately does
  not play there.
