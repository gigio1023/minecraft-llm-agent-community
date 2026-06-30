# Minecraft Multi-Agent & Social - VillagerBench, TeamCraft, MineCollab, MindCraft, CausalMACE, S-Agents, MindForge, HAS, MineLand

Lane 2 theme file. Audience: external team. Scope: the multi-agent Minecraft
systems - how they coordinate, where their communication bottlenecks are, how they
handle role/expertise asymmetry and resource sharing, and crucially **how they
score** (task completion vs durable social consequence). This is where the
**social-material transition gap** is clearest.

Definitions on first use: **material claim** = a tracked assertion that an actor
controls an item/tool/place; **obligation/credit** = a remembered social debt from
a borrow/lend/promise; **weak commons** = a shared resource maintained by informal
norm, not enforced rules; **post-goal continuation** = whether actors keep acting
socially after the assigned task ends.

## 1. The landscape (source-backed)

| System (id) | Coordination model | Communication | Resource sharing / handoff | Scoring | Social bookkeeping? |
| --- | --- | --- | --- | --- | --- |
| **MineCollab / MINDcraft** (2504.17950) | decentralized LLM agents, pairwise chat | **bottleneck**: −15% when must communicate detailed plans | **yes** - `givePlayer`, recipe sharing, Hell's Kitchen forced requests | task completion + **edit-distance** (construction) | no (transient chat; no obligation ledger) |
| **TeamCraft** (2412.05255) | centralized multi-modal VLA / LLM | multi-modal prompts | shared multi-agent tasks | **task success (<50% generalization)** | no |
| **VillagerAgent / VillagerBench** (2406.05720) | **DAG** task decomposer + controller + state manager | structured via scheduler | task delegation across agents | task completion, hallucination rate | partial (central state mgr tracks agents) |
| **MineLand** (2403.19267) | up to **64+ agents**, Alex framework (multitasking theory) | **forced** by limited senses + physical needs | implicit (survival, food) | survival time, action appropriateness | partial (needs drive behavior; no claim ledger) |
| **CausalMACE** (2508.18797) | task graph + **causal intervention** on subtask dependencies | structured | dependency-managed | +12% multi-agent / +7% single (vs SOTA) | no (causal graph is over tasks, not social debts) |
| **S-Agents** (2402.04578) | **self-organizing** tree-of-agents | agent tree messages | division of labor | task completion | no |
| **HAS** (2403.08282) | **hierarchical auto-organizing** (auto-assign roles) | hierarchical | role-based | navigation/search success | no |
| **MindForge** (2411.12977) | **Theory-of-Mind** for lifelong collaboration | ToM-mediated | collaborative learning | task + knowledge transfer | partial (ToM models others' mental state) |
| **Narayan-Chen MDC** (P19-1537) | human architect/builder pair | **grounded natural-language dialogue** (509 dialogues, 15,926 utterances) | block-by-block instruction | builder action correctness | n/a (human corpus; the social act *is* the data) |
| PillagerBench (2509.06235) | **competitive** team-vs-team | per-team | adversarial | win rate | no |

## 2. The recurring bottleneck: communication, scored as cost

The strongest empirical result across this cluster (MineCollab, 2504.17950) is
that **efficient natural-language communication is the primary bottleneck** -
agent performance **drops up to 15%** when they must communicate detailed task
plans, and the authors conclude in-context/imitation learning is insufficient for
embodied multi-agent collaboration. MineLand reaches the same conclusion from the
other direction: when it *deliberately* limits agents' senses, they are **forced
to communicate** to compensate, and agents with physical needs survive longer
(more human-like).

Interpretation: the field has discovered that **talking is expensive and
pivotal**, but it scores talk as an **instrumental cost toward task completion**,
not as a social act with consequences. "We coordinated and finished the meal" is
measured; "I promised to bring wheat and then didn't, and you remembered" is not.

## 3. Role/expertise asymmetry and resource sharing (the material edge)

Three systems get close to this repo's **material layer**:

1. **MineCollab Hell's Kitchen** (2504.17950): each agent holds recipes for only a
   subset of needed items, **forcing requests and handoffs**. The `givePlayer(
   "randy", "oak log", 4)` tool makes **item transfer a first-class typed action**.
   This is mechanically the borrow/lend/give primitive - but the handoff creates no
   tracked obligation; once the recipe is done, the social fact evaporates.
2. **MineLand** (2403.19267): physical needs (food) + limited senses create
   genuine **scarcity and interdependence** at 64-agent scale. Closest to a "weak
   commons" pressure, but there is no claim/obligation ledger.
3. **Narayan-Chen Minecraft Dialogue Corpus** (P19-1537): the **architect/builder**
   asymmetry (architect sees the target and speaks; builder places blocks) is the
   canonical grounded-dialogue setup. It is a *human* corpus - valuable as a model
   of what grounded request/clarification looks like, not an agent system.

## 4. How they handle dependencies: task graphs, not social ledgers

VillagerAgent (DAG task decomposition), CausalMACE (causal intervention over
subtask dependencies), S-Agents/HAS (self-organizing role hierarchies) all model
**inter-task dependencies** - who must do what before what. None models **social
dependencies**: who owes whom, who may use whose furnace, whether a claim is
respected. MindForge adds **Theory of Mind** (modeling others' mental states),
which is the nearest thing to social cognition in the cluster, but it is aimed at
collaborative *learning*, not at tracking obligations/claims as durable state.

## 5. The social-material transition gap (the central finding)

Stated plainly, and source-backed:

- The field **can already**: make multiple agents share items to finish a task
  (MineCollab `givePlayer`), force communication via asymmetry (Hell's Kitchen) or
  limited senses (MineLand), self-organize roles (S-Agents, HAS), decompose tasks
  by dependency (VillagerAgent, CausalMACE), and model others' minds for learning
  (MindForge).
- The field **does not**: track **possession and material claims over time**, score
  **obligation/credit** from a borrow/lend/promise, maintain a **weak commons**,
  reason about **public-affordance use**, or measure **post-goal continuation**.
  Every multi-agent benchmark above resolves to **task completion** (or win rate,
  or survival time), with social interaction as instrumental.

That gap is exactly the Material/Social/Institutional WAM layers. The mechanisms to
*act* socially exist (typed handoff, chat, ToM); what is missing is the
**bookkeeping of social-material consequence** and **scoring on durable
consequence rather than task completion**. This repo's typed social ledger
(obligations, claims, relationships, memory) and post-goal continuation focus are
net-new relative to this entire cluster.

## 6. What this repo can adapt vs avoid

**Adapt (mechanically useful)**:
- MINDcraft's **47-tool high-level action library** as a parts list, especially
  `givePlayer` (item handoff) and inventory-query observations.
- MineCollab's **edit-distance blueprint scoring** (a structured verifier, not VLM).
- **Hell's Kitchen recipe asymmetry** and **MineLand limited-senses + physical
  needs** as ready-made ways to *force* request/handoff and create scarcity.
- VillagerAgent's **state manager** as a *recording* structure for multi-agent
  state (not as a hidden planner, and not as omniscient cross-inventory reads).

**Avoid (overclaim risk)**:
- Presenting any multi-agent **task-completion** score as social contribution.
- A **central omniscient state manager** that lets actors read each other's
  inventories for free - both MineCollab and MineLand make others' state *cost*
  something to learn, which is the right social premise; free omniscience erases
  the social problem.
- Treating ToM (MindForge) as obligation tracking - modeling another's belief is
  not the same as recording a debt and scoring whether it was repaid.
- Civilization-scale framing (Project Sid style). This cluster shows even 2-3 agent
  task collaboration is hard (<50% generalization in TeamCraft; −15% comms penalty
  in MineCollab). Modest, defensible claims only.

## 7. Net assessment

The multi-agent Minecraft literature is rich in **coordination mechanism** and
honest about the **communication bottleneck**, and three systems (MineCollab,
MineLand, the Narayan-Chen corpus) touch the material/social edge. But all of them
stop at **task completion / coordination efficiency**. The durable
social-material bookkeeping - claims, obligations, weak commons, post-goal
continuation - is unoccupied. That is the defensible space for this repo's
contribution, and the existing tools (typed handoff, forced-request scenarios,
structured verifiers) are reusable scaffolding to build it.
