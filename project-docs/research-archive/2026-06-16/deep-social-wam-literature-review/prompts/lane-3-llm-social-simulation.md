# Lane 3 — LLM Social Simulation and Social Benchmarks

Read `prompts/00-shared-lane-contract.md` first. You are Lane 3 (N=3).

## Scope

How LLM social behavior is defined, evaluated, and where validity claims are
weak. Cover dialogue-only social benchmarks, grounded multi-agent environments,
population-scale simulators, mixed-motive/economic games, and validity-warning
papers. Then translate their metrics into Minecraft social-material transitions.

## Focus questions

- How is "social behavior" defined and operationalized in each work?
- What metrics (trust, obligation, norms, cooperation, conflict, repair, memory)?
- Which benchmarks are dialogue-only vs grounded in environment state?
- How can each metric translate into a Minecraft social-material transition
  (a verified change in possession/claim/affordance/obligation/memory)?
- Where are validity claims weak or overextended (plausibility != validity)?

## Seed sources (verify + extend; download LaTeX for the ~10 most relevant)

Social simulation / agents:
- Generative Agents (2304.03442) ; AgentSociety ; SocioVerse ;
  Generative Agent Simulations of 1,000 People (2411.10109)
- Concordia (DeepMind; github google-deepmind/concordia) and its paper
Social evaluation benchmarks:
- SOTOPIA (2310.11667) ; Lifelong SOTOPIA ; SOTOPIA-pi ; AgentSense
  (2025.naacl-long.257) ; M3-Bench / M3-BENCH (2601.08462) ; SimBench ;
  SocialVeil ; SALM (2505.09081)
Mixed-motive / economic / multi-agent:
- MAgIC ; GLEE (LLM economic games) ; MultiAgentBench ; Melting Pot (DeepMind) ;
  Concordia Contest ; Multi-Agent Craftax ; ALEM
Embodied collaboration (non-Minecraft):
- PARTNR (Meta) ; TEACh ; CoELA ; Overcooked-AI / Overcooked-style
Validity warnings:
- "Do Not Trust Generative Agents To Mimic Communication Unless Benchmarked"
  (2506.21974) ; SimBench ; belief-behavior consistency (2507.02197) ;
  PersonaGym (2407.18416) ; PsyMem (2505.12814)

Read existing repo grounding:
- `<repo>/project-docs/research-archive/2026-06-16/reference-sweep-beyond-project-sid.md`
- `<repo>/project-docs/research-archive/2026-06-16/expanded-related-work-sweep.md`
- `<repo>/project-docs/research-archive/Project-Sid-2411-00114-Review-2026-06-15.md`
  and the Project Sid technical report (arXiv 2411.00114) + altera-al/sid github.

## Owned deliverables

- `notes/by-theme/llm-social-simulation.md` — Generative Agents, SOTOPIA family,
  AgentSense, M3-Bench, Concordia, AgentSociety, mixed-motive games: how social
  state is defined/measured; dialogue-only vs grounded; memory/trust/norm metrics.
- `notes/by-theme/benchmark-validity-and-evaluation.md` — SimBench, the
  "do not trust generative agents" paper, belief-behavior consistency, plausibility
  vs validity, solver-sampler mismatch; the overclaim boundaries this repo must
  respect; how to report social behavior AS behavior with cost/failure traces.
- `notes/by-theme/project-sid-critical-review.md` — build on the repo's existing
  Sid review: what Sid (2411.00114) actually claims vs what is reproducible
  (code/data/logs?), its civilization-scale framing, useful case designs/metrics/
  failure modes to extract WITH citation, and why this repo's narrower
  evidence-grounded social-microeconomy frame is more defensible.
- `matrices/benchmark-metrics-matrix.md` — table: benchmark x {social construct
  measured, grounded or dialogue-only, metric form, environment, repro status,
  Minecraft-transition translation, validity caveat}.
- by-paper notes; manifest + search-log fragments; brief.

Caution: separate "this benchmark measures plausible dialogue" from "this measures
a verified world consequence." The repo's whole point is the latter.
