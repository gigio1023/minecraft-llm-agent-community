# Minecraft VLA & Visual Policy - VPT, STEVE-1, GROOT, ROCKET, JARVIS-VLA, Optimus

Lane 2 theme file. Audience: external team. Defines jargon on first use.
Scope: the *learned low-level controller* lineage for Minecraft - what each system
perceives and emits, what data/weights are public, which are policies vs planners,
and exactly what this repo can borrow vs must not copy.

**VLA** = Vision-Language-Action model: a policy mapping observation (+ optional
language) to actions, `p(a | o, l)`, with **no model of how the world will
evolve**. **Visual policy** = a VLA whose observation is pixels. Per the WAM
survey (arXiv 2605.12090), none of the systems below is a **World Action Model**
(WAM), because none co-generates a predicted future state `o'` to align actions
to - they are reactive controllers. Keep that framing: this whole family is the
**competence body**, not a consequence model.

## 1. The lineage in one paragraph

OpenAI's **VPT** (2206.11795) established the substrate: train an Inverse Dynamics
Model on a small labeled set, pseudo-label ~70k hours of YouTube Minecraft, and
behavioral-clone a foundation policy that acts through the **human keyboard+mouse
interface at 20 Hz on 128×128 pixels**. Everything after reuses that body.
**STEVE-1** (2306.00937) makes VPT *instructable* (text/visual goals) for ~30
minutes of labels via MineCLIP hindsight relabeling. **GROOT** (2310.08235)
replaces text goals with *reference-video* goals learned through future-state
prediction. **ROCKET-1** (2410.17856) feeds the policy *segmentation masks +
interaction ids* so a VLM can point at objects. **JARVIS-VLA** (2503.16365)
abandons the VPT body and post-trains a general VLM (Qwen2-VL) into a Minecraft
VLA via understand->ground->act stages. **Optimus-2/3** (2502.19902 / 2506.10357)
pair an MLLM planner with a low-level Goal-Observation-Action policy (GOAP) and
add Mixture-of-Experts task routing.

## 2. Policy vs planner (who decides what)

- **Pure low-level policies** (no planning): VPT, STEVE-1, GROOT, ROCKET-1. They
  map (pixels [+ goal/mask]) -> button presses. They have no language reasoning and
  no task decomposition.
- **VLA with language reasoning baked in**: JARVIS-VLA (a single VLM emits actions
  conditioned on instruction + image history).
- **Planner + executor pairs**: Optimus-2/3 (MLLM plans in language, GOAP/low-level
  executes); and the LLM-agent cluster (Voyager, GITM - covered in the benchmarks
  and multi-agent theme files) where an LLM plans and a controller executes.

For this repo the relevant boundary is: the **Actor Turn** is a planner-like
*selection* step (choose one typed tool with full context), and execution is owned
by the runtime. None of the above gives that exact contract; the closest are the
LLM-agent systems, not the visual policies.

## 3. Observation & action altitude (detail in the two matrices)

- All visual policies: **128×128 pixels in, camera/buttons out, 20 Hz**. They do
  **not** see structured inventory (VPT explicitly withholds it from the model).
- JARVIS-VLA: pixels + **history of frames** (non-Markovian) + language; actions
  via **51 repurposed vocabulary tokens** with action chunking.
- ROCKET-1: adds a typed **interaction-type id + segmentation mask** as *input* -
  the one place the visual cluster admits a structured channel, and it does so
  precisely because language under-specifies *which* object to act on.

This is the crux for the project: the visual cluster proves you *can* drive
Minecraft from pixels, but only after enormous data, and the runtime never gets a
typed handle on intent. This repo deliberately works at the **high-level typed**
altitude instead (Action Cards), where the same act is a schema-bound function
call the runtime can validate and verify.

## 4. Data & weights availability (source-backed)

| System | Weights public? | Data public? | Notes |
| --- | --- | --- | --- |
| VPT | yes (`CraftJarvis/MineStudio_VPT.*`; OpenAI originals) | contractor set re-hosted (`minestudio-data-7xx`) | foundation/bc/rl variants |
| STEVE-1 | yes (`MineStudio_STEVE-1.official`, **12,822 downloads** - most-used Minecraft policy) | policy data = VPT contractor + VPT rollouts | code on GitHub |
| GROOT | yes (`MineStudio_GROOT.18w_EMA`) | gameplay videos (unlabeled) | code on GitHub |
| ROCKET-1 | yes (`MineStudio_ROCKET-1.12w_EMA`, `ROCKET-3-1.5x`) | SAM-2 backward-relabeled trajectories | code on GitHub |
| JARVIS-VLA | yes (`JarvisVLA-Qwen2-VL-7B`, 519 downloads) | yes (`CraftJarvis/minecraft-vla-sft`, ~106 GB, 1M-10M rows, MIT) | full recipe public |
| Optimus-2 | code public | yes (`iLearn-Lab/Optimus-2-MGOA`, 25k videos / ~30M GOA pairs, webdataset, MIT) | GOAP |
| Optimus-3 | code public | partial | MoE task experts |

All re-hostings cluster under the **CraftJarvis** HF org, which is the de-facto
distribution hub for Minecraft visual policies (the MineStudio package wraps them).

## 5. What this repo can adapt (mechanically useful)

1. **The IDM / hindsight-relabeling discipline** (VPT, STEVE-1): a cheap labeling
   function converting unlabeled observation streams into action/goal labels. This
   repo's Mineflayer runtime already emits `(o_t, a_t, o_{t+1})` triplets *for
   free* (validated tool call + verifier delta), so it gets the IDM's *output*
   without training one - useful if a learned helper is ever wanted.
2. **Typed structured channel between reasoner and executor** (ROCKET-1): the
   principle "communicate intent through a typed channel, not prose" is exactly
   this repo's Action-Card schema bet, independently validated by a CVPR paper.
3. **Understand-before-act curriculum** (JARVIS-VLA): if a small local model is
   ever fine-tuned on the repo's transcripts, the text-knowledge -> grounding ->
   action staging is a template.
4. **Visual policies as a separate baseline lane**: STEVE-1 / ROCKET-1 / GROOT are
   strong *executor* baselines to contrast against an LLM-Actor-Turn agent - kept
   isolated, never mutating actor state (matches the MineStudio verdict).

## 6. What this repo must avoid (overclaim risk)

- **Camera/buttons as actor authority**: wrong altitude; needs 70k h video; gives
  the runtime no typed intent. The repo's Action Cards are deliberately higher.
- **MineCLIP / VLM-embedding scoring as truth**: STEVE-1 and MineDojo use MineCLIP
  cosine distance as an *automatic proxy*; the papers themselves flag it. It is
  blind to possession, claim, and obligation. Keep it as audit, not runtime truth.
- **Framing any of these as social**: none has a notion of other actors,
  possession, or obligation. Their success metric is **item-in-inventory / task
  completion** - the competence gate, not the social contribution.
- **GROOT's future-state prediction ≠ a consequence WAM**: GROOT predicts future
  states to *induce a goal space*, not to forecast consequences at decision time.
  Do not cite it as evidence that a Minecraft WAM already exists.

## 7. Where this cluster leaves the social-material gap unfilled

Every system here is a single-agent physical controller. They establish that the
**Physical-WAM substrate** (move/mine/craft/place) can be learned, which the WAM
hierarchy requires *before* social claims are meaningful. But they contribute
**zero** to Material, Social, or Institutional layers: no possession tracking, no
material claims, no obligations, no other-actor modeling, no post-goal
continuation. They are the floor the social work stands on, not the work itself.
