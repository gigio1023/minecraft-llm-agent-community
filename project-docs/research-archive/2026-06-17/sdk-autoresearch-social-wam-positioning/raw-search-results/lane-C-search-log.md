# Lane C search log: substrate comparison

Lane: C. Date: 2026-06-17. Mission: light new search to fill substrate-comparison gaps;
mostly synthesis of existing 2026-06-16 archive notes.

## Tools used

- Read (existing 2026-06-16 archive theme files + by-paper notes + 2 matrices).
- `hf papers search`, `hf papers read` (Hugging Face CLI 1.16.1, /Users/user/.local/bin/hf).
- WebSearch, WebFetch (id + title/author verification, abstracts).
- Bash grep over the old archive's `source-manifest.jsonl` and `notes/by-paper/`.

## Existing notes reused (cited, not rewritten)

Read in full from `../../../2026-06-16/deep-social-wam-literature-review/`:
- theme: minecraft-vla-and-visual-policy.md, minecraft-agent-benchmarks.md,
  wam-foundations.md, benchmark-validity-and-evaluation.md, llm-social-simulation.md,
  minestudio-positioning.md.
- matrices: observation-space-comparison.md, action-space-comparison.md.
- by-paper: 2206.08853-minedojo.md, 2304.03442-generative-agents.md,
  2310.11667-sotopia.md, 2503.14734-groot-n1.md.

## Queries run and outcome

1. `hf papers search "Habitat 3.0 social rearrangement human-robot"` -> found
   **2310.13724** "Habitat 3.0: A Co-Habitat for Humans, Avatars and Robots" with full
   abstract. Accessed.
2. WebSearch "Habitat 3.0 social rearrangement human-robot collaboration arxiv 2310" ->
   confirmed arXiv id 2310.13724, Meta FAIR, Oct 2023, ICLR 2024; abstract corroborated.
   Accessed (arxiv.org, ai.meta.com).
3. `hf papers read 2310.13724` -> body fetched; extracted speed paragraph (robot 245+/-19
   FPS, humanoid 188+/-2 FPS single-env; robot-humanoid 1191+/-3 FPS over 16 envs; two
   robots 1345 FPS). Tasks: Social Navigation, Social Rearrangement. Accessed (partial:
   speed + abstract; not a full LaTeX deep-read).
4. WebSearch "sim-to-real gap reality gap robot learning domain randomization survey ...
   MuJoCo Isaac Sim" -> found surveys 2009.13303 and 2502.13187; plus MuJoCo/Isaac
   throughput context (claim-only). Accessed.
5. WebFetch https://arxiv.org/abs/2502.13187 -> verified title "A Survey of Sim-to-Real
   Methods in RL: Progress, Prospects and Challenges with Foundation Models", authors (Da,
   Turnau, Kutralingam, Velasquez, Shakarian, Wei), 2025; quote "inevitable sim-to-real
   gap". Accessed.
6. WebFetch https://arxiv.org/abs/2009.13303 -> verified title "Sim-to-Real Transfer in
   Deep Reinforcement Learning for Robotics: a Survey", authors (Zhao, Pena Queralta,
   Westerlund), IEEE SSCI 2020; solution categories (domain randomization, domain
   adaptation, imitation learning, meta-learning, knowledge distillation). Accessed.
7. WebSearch "PARTNR benchmark planning reasoning embodied multi-agent tasks Habitat" ->
   confirmed 2411.00081 (Meta FAIR), 100,000 tasks, 60 houses, 5,819 objects,
   simulation-in-the-loop verification; human-pairing step ratios (claim-only). Accessed.

## Manifest checks

- Habitat 3.0 (2310.13724): NOT in old manifest -> new by-paper note written.
- PARTNR (2411.00081): in old manifest as abstract-only with empty notes_path -> wrote a
  new by-paper note in this archive (no prior note existed).
- Sim-to-real surveys (2009.13303, 2502.13187): not previously noted -> new combined note.
- MineDojo / Generative Agents / SOTOPIA / GR00T-N1: existing old-archive notes, cited by
  path, not rewritten.

## New by-paper notes written (this archive)

- notes/by-paper/2310.13724-habitat-3.md
- notes/by-paper/2009.13303-sim-to-real-survey.md (covers 2502.13187 too)
- notes/by-paper/2411.00081-partnr.md

## Unresolved / inaccessible / honesty notes

- No full LaTeX deep-read for Habitat 3.0, PARTNR, or either sim-to-real survey. All
  numbers from those are marked claim-only (abstract/body/summary). Conclusions rest on the
  verified abstracts plus the speed paragraph, which is enough for the substrate-comparison
  argument.
- MuJoCo/Isaac throughput figures are web-benchmark claim-only; used only as
  order-of-magnitude context, not load-bearing for any conclusion.
- No paid LLM calls, no runtime source edits, no repo-root file edits (per contract).
