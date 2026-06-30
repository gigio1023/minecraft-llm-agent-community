# Wave-3 Contract Addendum: Research-Area Mapping (read after the shared contract)

You are a parallel research subagent in **wave 3** of this literature review. Waves 1 and 2
produced a 156-source review covering the WAM foundations (world models, VLA, the WAM
synthesis, training/eval, the WAM-vs-VLA distinction) and the Minecraft/social-simulation
application. Wave 3 has a different job: **map the research AREAS (sub-fields) relevant to
the original research question, comprehensively, and research the ones that are not yet
covered in depth.**

Read `prompts/00-shared-lane-contract.md` first. Every rule there binds you: working root
(`<ROOT>`; write only inside it), no paid LLM / provider / API calls, no runtime edits, no
edits outside `<ROOT>`, every claim source-backed, separate Primary-source facts vs
Interpretation vs Mechanically-useful-vs-research-contribution, Hugging Face CLI first then
web, LaTeX-first via `scripts/fetch_arxiv_latex.sh`, the by-paper note schema, the manifest
fragment schema, the search-log fragment, and the per-lane brief. Punctuation: ASCII only,
no em-dash, middle-dot, or bullet-char (use `-`, `:`, `,`, `.`).

## 1. The original query (anchor everything to this)

"Can a hierarchical action-conditioned world model predict and evaluate how Minecraft
actions transform physical state, material economy, social relations, memory, and future
action opportunities in an embodied open world?"

The project's shape (faithful, condensed): an LLM tool-use actor on a Mineflayer runtime
where the runtime owns physical truth; a WAM, if adopted, stays **advisory** (predicts and
evaluates consequences as typed deltas, scored against verifier evidence; never acts, fills
args, marks progress, or overrides the verifier). The 4 layers it must populate:

1. Physical (movement, mining, crafting, inventory/block/container deltas, vitals, durability).
2. Material / economic (possession, claims, borrow/lend, weak commons, public affordances,
   obligation/credit, cost to others).
3. Social (request, promise, refuse, accept, handoff, return, repair, trust, reputation,
   memory commitment).
4. Institutional / settlement (routines, roles, division of labor, norms, ownership practice,
   settlement persistence, post-goal continuation).

## 2. Your job (research-AREA mapping, not just papers)

Your lane is a **research area** (a sub-field), not a single paper. For that area:

- Define the area in plain language for a newcomer; name its central question.
- Trace its key works and sub-threads (genealogy where useful), source-backed.
- For each source and for the area as a whole, state explicitly: **which of the 4 layers it
  informs**, whether it is **mechanically useful vs a research contribution** for this project,
  and a **one-line tie to the original query** (how predicting/evaluating this area's quantity
  bears on the hierarchical advisory social-material WAM).
- Be honest about maturity and what is unproven. Avoid civilization-scale overclaim.

## 3. Extend, do not duplicate (the 17 existing theme files)

These areas are already covered in depth. **Do NOT re-survey them.** Cite them where your area
connects, and focus your lane on the genuinely-uncovered area in your brief.

Wave-1 themes: `wam-foundations.md`, `minecraft-world-models.md`,
`minecraft-vla-and-visual-policy.md`, `minecraft-agent-benchmarks.md`,
`minecraft-multi-agent-social.md`, `minestudio-positioning.md`, `llm-social-simulation.md`,
`benchmark-validity-and-evaluation.md`, `project-sid-critical-review.md`,
`sociology-grounding-for-social-wam.md`, `data-and-training-feasibility.md`,
`hierarchical-wam-for-minecraft-societies.md`.

Wave-2 themes: `wam-lineage-rl-and-latent-dynamics.md`,
`wam-generative-video-and-the-world-model-debate.md`,
`wam-action-models-vla-and-synthesis.md`, `vla-and-the-wam-vs-vla-distinction.md`,
`wam-training-evaluation-and-open-problems.md`.

If your area touches one of these (e.g. the sociology theme covers Ostrom; the social-sim
theme covers Generative Agents), cite it and cover only the *computational / technical research
area* your brief assigns, which those files do not.

## 4. Output locations (wave-3 specific)

- Manifest fragment: `raw-search-results/lane-<N>-manifest.jsonl` (your N is 12-17, in your
  brief). Same JSON schema. The coordinator re-runs `scripts/merge_manifest.py` (dedupes by
  `id`, unions tags/lanes), so logging a source another lane also logged is fine.
- Search-log fragment: `raw-search-results/lane-<N>-search-log.md`.
- Per-lane brief: `notes/subagent-briefs/lane-<N>-<name>.md`.
- New by-paper notes: `notes/by-paper/<arxiv_id_or_slug>-<slug>.md` (only for sources you
  deep-read; abstract-level sources need only a manifest row).
- Owned theme file: `notes/by-theme/research-area-<name>.md` (named in your brief).

## 5. Theme-file shape (the area survey)

Your `research-area-<name>.md` should have: a one-line "what this area is", a glossary of the
area's terms (defined once), the key works and sub-threads (source-backed, lead each with
"what it introduced and why it matters"), a "maturity and open problems" note, a table or list
mapping the area to the 4 layers, and a closing "relevance to the original query" section
(mechanically-useful vs research-contribution). Keep it newcomer-readable and modest.

## 6. Scope and honesty

- Depth over breadth: deep-read (LaTeX) your ~6-10 cornerstone papers; abstract-level is fine
  for the long tail. Note which are LaTeX vs PDF vs abstract.
- Verify arXiv IDs before fetching (`hf papers search`, web). Correct wrong seeds in your search
  log. Mark anything you cannot verify as "unverified report claim". Do not fabricate IDs,
  numbers, or quotes.
- Return ONLY a concise summary (<=300 words): files created, counts (sources/LaTeX/PDF/abstract),
  top 5 sources with one line each, 3 strongest findings, the area's tie to the original query
  in one sentence, and the biggest thing you could not verify.
