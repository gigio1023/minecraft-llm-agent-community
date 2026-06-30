# Lane 20 (H3) search log: LLM-driven reward, code, skill generation

All dates 2026-06-17 unless noted. HF CLI first (authenticated as naem1023), then web
via WebSearch/WebFetch. arXiv ids verified before LaTeX fetch.

## Seed verification (HF papers search + web)

- `hf papers search "Eureka reward design coding LLM" --limit 8`
  -> CONFIRMED Eureka = 2310.12931; CARD = 2410.14660. Also surfaced 2601.19100
  (reward-engineering-for-SE survey), 2601.08237 (End of Reward Engineering, cites
  Eureka+CARD+RLVR) as on-thesis 2026 breadth.
- `hf papers search "ONI online intrinsic rewards LLM feedback NetHack" --limit 5`
  -> CONFIRMED ONI = 2410.23022. Surfaced 2603.19453 (LLM policy synthesis for social
  dilemmas) as the social-code-gen bridge.
- `hf papers search "Auto MC Reward automated dense reward Minecraft LLM" --limit 5`
  -> CONFIRMED Auto MC-Reward = 2312.09238. Surfaced 2406.07381 (World Models with
  Hints of LLMs), 2502.12130 (Automatic Reward Modeling and Planning).
- `hf papers search "DrEureka sim-to-real reward design domain randomization" --limit 5`
  -> DrEureka did NOT surface on HF for this query. Verified via WebSearch:
  DrEureka = 2406.01967 (RSS 2024), project eureka-research.github.io/dr-eureka,
  code github.com/eureka-research/DrEureka. Seed was correct.
- `hf papers search "ToolRL reward tool learning reinforcement" --limit 4`
  -> CONFIRMED ToolRL = 2504.13958. Surfaced 2603.01620 (ToolRLA, 2026 follow-up).
- `hf papers search "Text2Reward dense reward code generation RL" --limit 4`
  -> Text2Reward = 2309.11489 (CORRECTED: the seed brief did not give an id; this is a
  Sept 2023 paper, ICLR 2024). Not 2410.xxxx.
- `hf papers search "Language to Rewards robotic skill synthesis reward" --limit 4`
  -> CONFIRMED L2R = 2306.08647 (CoRL 2023).
- WebSearch "GenSim ... RoboGen ... Eurekaverse arXiv id"
  -> CONFIRMED GenSim = 2310.01361, RoboGen = 2311.01455, Eurekaverse = 2411.01775.
  NOTE: GenSim/RoboGen/Eurekaverse are task/environment/curriculum generation, which is
  lane H4's territory. Logged as breadth (abstract-level) with a deconflict note in the
  theme file, NOT deep-read here.

## Skill-library / intrinsic-reward thread

- `hf papers search "Voyager open-ended embodied agent skill library Minecraft GPT-4"`
  -> CONFIRMED Voyager = 2305.16291. Per brief, EXTEND only (skill-library-as-code
  mechanism), do not re-survey.
- `hf papers search "LLM intrinsic reward exploration Motif preference" --limit 5`
  -> CONFIRMED Motif = 2310.00166. Surfaced ELLM = 2302.06692.
- `hf papers search "code as policies reusable skill library generation robot"`
  -> Code as Policies = 2209.07753. Surfaced 2602.08234 (SkillRL/SAGE), 2605.18693
  (SkillGenBench) as 2026 skill-generation breadth.

## 2026 frontier + thesis-bound evidence

- WebSearch "reward code / skill generation LLM agent self-improvement 2026 reward
  hacking specification gaming"
  -> KEY: Reward Hacking Benchmark = 2605.02964 (exploit rates 0%-13.9%, RL
  post-training raises hacking, environmental hardening cuts it ~87.7% relative).
  Also: Self-Evolving Agents survey = 2507.21046 (revised 2026; names the missing
  VERIFIER for open-world improvement). Both directly support the thesis bound.
- `hf papers search` confirmed 2602.08234 (SkillRL) and 2603.19453 (social dilemmas)
  ids for the manifest.

## LaTeX fetches (LaTeX-first; 8 cornerstones, all tarball_extracted)

NOTE on tooling: `scripts/fetch_arxiv_latex.sh` failed in this sandbox with
"Malformed input to a URL function" because curl rejected the script's hardcoded
User-Agent string (parentheses in the UA). The network itself works (verified:
plain `curl https://arxiv.org/e-print/2310.12931` returns a 3.4MB gzip tarball). To
avoid editing the SHARED script (used by all lanes), fetched manually with an inline
function replicating the script's exact output layout (papers/latex/<id>/,
papers/pdf/<id>.pdf, papers/metadata/<id>.json) minus the broken `-A "$UA"` flag. The
3s polite sleep between arXiv calls was preserved. Metadata JSONs written for all 8.

Fetched (all latex=tarball_extracted):
- 2310.12931 eureka (8 tex)
- 2410.14660 card-reward-design (2 tex)
- 2410.23022 oni-intrinsic-rewards (9 tex)
- 2312.09238 auto-mc-reward (24 tex)
- 2504.13958 toolrl (18 tex)
- 2305.16291 voyager (31 tex)
- 2406.01967 dreureka (1 tex)
- 2310.00166 motif (2 tex)

## Deep-read coverage

- Full LaTeX deep-read (intro+method+key experiments): Eureka, CARD, Auto MC-Reward,
  ONI (approach + intro taxonomy), ToolRL (method), Voyager (method/skill-library
  only), DrEureka (abstract+intro+method).
- Motif: intro skimmed in its own LaTeX; mechanism deep-read inside ONI's approach.tex
  (ONI reproduces Motif's Bradley-Terry equation and 3-stage pipeline).

## Counts

- Sources logged in manifest: 21 (8 LaTeX deep-read + 13 abstract/breadth).
- LaTeX downloaded: 8. PDF-only: 0. Abstract-only: 13.

## Unverified / flagged

- 2026 ids (2602.08234, 2601.19100, 2601.08237, 2605.02964, 2603.19453, 2507.21046)
  surfaced via HF/web abstracts; author lists left "unverified author list" where I did
  not open the paper. Numbers quoted from 2605.02964 (exploit rates, hardening %) are
  WebSearch-surfaced abstract claims, marked as such in the theme file ("paper-stated").
- Did NOT deep-read GenSim/RoboGen/Eurekaverse (H4 territory) or the 2026 breadth set;
  abstract-level only.
