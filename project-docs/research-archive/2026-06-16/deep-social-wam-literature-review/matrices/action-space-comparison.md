# Action-Space Comparison - Minecraft Agents vs This Repo

Lane 2. Compares the *action interface* (the altitude at which a controller emits
decisions) across the Minecraft agent literature, then contrasts with this repo's
Action Cards + `author_mineflayer_action` + social actions.

Key distinction the project cares about: **camera/buttons** (human input device,
~20 Hz, pixel-grounded) vs **symbolic/high-level** (named functional actions, e.g.
Mineflayer `dig`, `placeBlock`, `giveItem`) vs **code-skill** (LLM emits/executes
code). Lower altitude = more general but needs huge data and gives the runtime no
typed handle on *what* was attempted; higher altitude = typed, verifiable, but
relies on a library of primitives.

## Matrix

| System (id) | Action altitude | Concrete action set | Rate / chunking | Who emits actions | Typed args the runtime owns? | Social/transfer actions? |
| --- | --- | --- | --- | --- | --- | --- |
| MineRL / Malmo (env) | camera/buttons (+ some discrete) | WASD, jump, sneak, sprint, attack, use, camera Δyaw/Δpitch, hotbar, craft | 20 Hz | env-level | no (raw input) | none |
| VPT (2206.11795) | camera/buttons | native keyboard+mouse; binary keys + **foveated mouse binning** (11 bins/axis) | 20 Hz, per-tick | learned policy `p(a\|o)` | no | none |
| STEVE-1 (2306.00937) | camera/buttons | same as VPT (+ goal embedding input) | 20 Hz | goal-cond policy `p(a\|o,z)` | no | none |
| GROOT (2310.08235) | camera/buttons | VPT-family keyboard+mouse | 20 Hz | video-goal policy | no | none |
| ROCKET-1 (2410.17856) | camera/buttons **+ typed interaction id + segmentation mask** as *input* | VPT-family output; input adds mask `m` + interaction-type `c` | 20 Hz | seg-conditioned policy | partial (interaction type is typed *input*, output still buttons) | none |
| JARVIS-VLA (2503.16365) | camera/buttons (tokenized) | mouse+keyboard via **51 repurposed vocab tokens** (22 mouse, 29 keyboard); **action chunking** | chunked | VLM `p(a\|o_hist,lang)` | no (action tokens) | none |
| Optimus-2 GOAP (2502.19902) | camera/buttons (low-level) under MLLM planner | low-level GOAP policy emits VPT-style actions; MLLM plans in language | 20 Hz low-level | MLLM planner + GOAP | no | none |
| MineDojo (2206.08853) | mid-level multi-discrete | movement + camera + functional (craft/equip/attack) multi-discrete | per-step | any agent (env API) | partial (functional actions named) | none built-in |
| Voyager (2305.16291) | **code-skill** (Mineflayer JS) | LLM writes/stores JavaScript skills calling Mineflayer (`mineBlock`, `craftItem`, ...) | per-skill (many ticks) | LLM code-gen | via the JS it writes (not schema-checked) | none (single agent) |
| GITM (2305.17144) | **structured actions** (text) | LLM emits structured action plans over a fixed action set; rule-based controller executes | per-action | LLM planner | partial (structured but text) | none |
| Plancraft (2412.21033) | symbolic GUI ops | crafting-GUI `move`/`smelt` inventory operations; also a `stop`/impossible action | per-step | LLM/VLM | yes (discrete GUI ops) | none |
| MINDcraft / MineCollab (2504.17950) | **Mineflayer high-level tools** | **47 parameterized tools**, e.g. `!collectBlocks`, `!craftRecipe`, **`!givePlayer("randy","oak log",4)`**; custom JS fallback | per-tool (>20 steps/task) | LLM tool-call | yes (named tool + typed params) | **yes - `givePlayer` item handoff; chat messages** |
| VillagerAgent (2406.05720) | Mineflayer high-level (Voyager-style) | high-level skills under a DAG task scheduler | per-skill | multi-agent LLM | partial | implicit (task delegation, not item-transfer primitives) |
| MineLand (2403.19267) | Mineflayer high-level + **communication + low-resolution senses** | high-level actions; agents must **speak** to share info; bounded vision/audio | per-action | multi-agent LLM (Alex framework) | partial | **yes - communication is a first-class action; physical needs (food)** |
| Odyssey (2407.15325) | symbolic skill library | **40 primitive + 183 compositional skills** invoked by LLM | per-skill | LLM | yes (skill names + params) | none (single agent) |
| Narayan-Chen MDC (P19-1537) | block place/remove + **natural-language dialogue** | builder places/removes colored blocks; architect speaks | per-action | human (corpus) | n/a (human study) | **yes - grounded dialogue is the action** |
| **THIS REPO** | **Action Cards (typed high-level) + `author_mineflayer_action` (code-skill, gated) + social actions** | named Action Cards with **schema-bound logical params**; `author_mineflayer_action` triggers full-context Mineflayer codegen + trial; social actions (request/promise/handoff/...) | one tool selection per **Actor Turn** | LLM proposes ONE function-tool; runtime owns execution | **yes - explicit logical params, schema/permission/retry/verifier gates** | **yes - request, promise, refusal, borrow/lend/return, etc. as typed acts** |

## Reading the matrix (interpretation)

1. **Two clusters, a known gap between them.** The *learned-policy* cluster (VPT,
   STEVE-1, GROOT, ROCKET-1, JARVIS-VLA, Optimus) lives at **camera/buttons** -
   maximally general, but the runtime gets **no typed handle** on what was
   attempted (it sees button presses, not "place oak_log at (x,y,z)"). The
   *LLM-agent* cluster (Voyager, GITM, MINDcraft, VillagerAgent, Odyssey) lives at
   **high-level/symbolic/code**, where actions are named and (sometimes) typed.
2. **This repo sits in the high-level cluster but tightens the contract.** Where
   Voyager executes arbitrary LLM JavaScript and MINDcraft exposes 47 fixed tools,
   this repo requires **one schema-bound tool selection per Actor Turn**, with the
   runtime owning explicit params, permission, retry, and verifier evidence.
   `author_mineflayer_action` is the principled version of Voyager's code-gen:
   gated, trial-run, schema-bound, never originated by a background process.
3. **Only three systems treat social/transfer acts as first-class actions.**
   MINDcraft (`givePlayer` + chat), MineLand (communication + physical needs), and
   the Narayan-Chen corpus (grounded dialogue). Everything else is single-agent
   physical competence. This repo's *typed social actions* (request/promise/
   refusal/borrow/lend/return) are net-new relative to even these three - they
   carry obligation/credit, not just message-passing.
4. **Mechanically reusable for this repo**: MINDcraft's tool list (esp.
   `givePlayer`), Odyssey's primitive/compositional split (40+183), Plancraft's
   explicit "impossible/stop" action. **Do NOT copy**: camera/buttons as actor
   authority (wrong altitude, needs 70k h video); arbitrary unchecked code-gen.

## Caveat (competence gate vs social contribution)

Every "yes" in the social/transfer column except this repo's is **message-passing
or item-transfer in service of task completion**. Item handoff that finishes a
recipe (MineCollab) is a *competence* act; the same handoff creating a tracked
obligation/credit between actors is the *social* act this repo targets. The
action interface alone does not close that gap - the **bookkeeping of consequence**
does (see `minecraft-multi-agent-social.md`).
