# Prior-work gap matrix

What this is: the key prior works scored on the four axes this project would occupy, plus
reproducibility, released artifacts, and the precise miss relative to this repo. Backing synthesis:
`../notes/by-theme/cross-product-novelty-and-closest-works.md` (lane B). ASCII punctuation only.

Legend: Y = yes, N = no, ~ = partial, ! = present-but-cautionary. "Auto-improve" = autoresearch or
self-improvement loop. "Repro" = can the reported results be re-derived (needs code + data + seeds +
scoring). "Artifacts" = what is actually public. Cells state the fact, not a grade.

| Work (id) | MC | WAM (predictor) | Wild open world | Social grounded in material | Auto-improve | Repro | Artifacts | Relevance / precise miss vs this repo |
|---|---|---|---|---|---|---|---|---|
| Voyager (2305.16291) | Y | N (skill library, not a predictor) | Y | N | Y (GPT-4 self-verify) | ~ | code Y | Closest Minecraft self-improver, but single-actor, physical, and scored by a self-judge (progress laundering). |
| EvolvingAgent (2502.05907) | Y | Y (continual WM) | Y | N | Y (self-verification) | ? | claim-only (abstract) | Closest occupied TRIPLE (MC + WM + self-improve), but single-actor, physical-only, self-scored; no social-material layer. |
| MineEvolve (2603.13131) | Y | N | Y | N | Y (typed in-world feedback) | ? | claim-only (abstract) | Closest Minecraft loop scored on typed deltas not a self-judge, but single-actor, no social, no predictive WM. |
| WALL-E (2410.07484) | Y | Y (LLM-as-WM, rule learning) | Y | N | Y (rule patching) | ~ | code Y | Closest LLM-as-world-model in Minecraft, but the WM is MPC-planning AUTHORITY, not advisory; physical only. |
| MineCollab / MINDcraft (2504.17950) | Y | N | Y | ~ (typed `givePlayer` handoff) | N | ~ | code Y | Has the material-handoff primitive, but scores TASK COMPLETION; the handoff creates no tracked obligation. |
| Project Sid / PIANO (2411.00114) | Y | N (concurrent agent arch) | Y | ! (many-agent society, LM-judged) | N | N (0/5) | report PDF + video only | Nearest neighbor on 3 axes (embodied + many-agent society + scale), but UNREPRODUCED, no WM, no loop, social signals LM-judged. Cautionary anchor. |
| Solaris (2602.22208) | Y | Y (multiplayer pixel WM) | Y | N | N | ~ | partial | The only multiplayer Minecraft world model, but predicts pixels with zero social-material state. |
| Dreamer 4 (2509.24527) | Y | Y (latent WM) | Y | N | ~ (in-loop control) | ~ | partial | Feasibility proof that structured/latent (not pixel) WM does the hard Minecraft work cheaply; physical only. |
| S3AP / Social World Models (2509.00559) | N | Y (social WM p(S'|S,A,a)) | N | ~ (social, dialogue-scored) | N | ~ | code ~ | Closest SOCIAL world model and proves structured social-state beats free text, but state is an LLM parse, scored on a dialogue goal, not embodied, not verified. The bridge to make S' a verified Minecraft delta. |
| AIvilization v0 (2602.10429) | N | N | N (economic sandbox) | Y (material-grounded economics) | N | ? | deployed; scoring artifacts unverified | Material-grounded social, but the material layer is abstract economics (prices, tiers), not located/durable items; not embodied; no predictor; no loop. |
| Generative Agents (2304.03442) | N | N | N | Y (dialogue) | N | ~ | code Y | Defined memory/reflection/planning social arch, but entirely natural-language; no external state can refute a claim. |
| SOTOPIA (2310.11667) | N | N | N | Y (7-dim social rubric, dialogue) | N | ~ | code Y | Rich social vocabulary, but all actions resolve to text and even the material dimension is LLM/human-judged, not ledger-enforced. |
| MineDojo (2206.08853) | Y | N (task suite + knowledge base) | Y | N | N | Y | code + data Y | Substrate proof: Minecraft is an open-ended, internet-scale-knowledge task world; not a predictor and not social. |
| SICA (2504.15228) | N | N | N | N | Y (self-improving coding agent, external grader) | ~ | code Y | Digital self-improvement done right: edits its own software, no weight authority, external overseer; the loop discipline to import, not a Minecraft or social system. |
| Position: unify physical+social (2510.21219); Agentic World Modeling survey (2604.22748) | N | conceptual | N | named, not built | N | n/a | papers | Two 2025-2026 papers explicitly name physical-plus-social world modeling an open frontier and call them "separate silos". Confirm the gap AND prove the FRAMING is shared, not novel. |
| THIS PROJECT (target cell) | Y | Y (advisory, structured social-material) | Y | Y (predicted material-grounded social delta, checked against the world) | Y (improves the predictor; not self-judged) | Y (deterministic scoring script) | planned release | The empty intersection: advisory WAM over physical-material-social deltas in embodied Minecraft, improved by a self-improvement loop, small-N and reproducible. |

## Reading

- Every single AXIS is occupied and crowded (Minecraft agents, world models, social simulation,
  self-improving agents). No axis is the contribution.
- Several PAIRS and one near-TRIPLE are occupied. The closest triple, Minecraft + WM +
  self-improvement (EvolvingAgent 2502.05907), is single-actor, physical, and improves against its own
  judgment, and has no social-material layer.
- The two TRIPLES that include the social-material layer (MC + WM + social-material; MC +
  social-material + self-improve) and the full FOUR-way are empty across 560+ old sources and 10 newly
  verified 2025-2026 works (lane B census).
- Project Sid is the nearest neighbor and the clearest cautionary tale at once: embodied society at
  scale, but unreproduced, no world model, no loop, social signals LM-judged. See
  `minecraft-vs-robotics-vs-dialogue-sim.md` for substrate, `../notes/by-theme/reproducibility-norms-and-sid-cautionary.md`
  for its 0/5 artifact status.

## Honesty bound

The empty-cell claim is bounded by what Hugging Face, web, and arXiv surfaced (lane B). A private or
very recent unindexed system could exist; this is a strong census, not a proof of non-existence. All 10
new 2025-2026 sources were verified at abstract level, not full LaTeX deep-read (flagged per row in the
manifest).
