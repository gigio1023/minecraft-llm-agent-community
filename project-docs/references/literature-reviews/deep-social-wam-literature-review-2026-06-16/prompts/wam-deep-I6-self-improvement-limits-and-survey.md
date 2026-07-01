# Lane 29 (I6): The self-improvement concept, its surveys, and its limits

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave5.md`. This brief layers scope on top.

## Area
The field-level view of "자가발전": what self-improvement / self-evolving AI means as a concept, how
the surveys organize it, and crucially WHERE IT BREAKS, model collapse, self-consuming loops,
plateaus, and the gap between recursive-self-improvement rhetoric and evidence. Central question:
when does a self-improvement loop actually compound, and when does it degrade or stall?

## Seeds (verify ids before fetching)
- Surveys: self-evolving agents survey (2508.07407, cited by H1; extend at the concept level), plus
  one recent self-improvement / self-evolving-LLM survey (verify a 2025/2026 id).
- Model collapse: "The Curse of Recursion / AI models collapse when trained on recursively generated
  data" (Shumailov et al, 2305.17493, Nature 2024 version). Self-consuming generative models go MAD
  (Alemohammad et al, 2307.01850). Is model collapse inevitable? accumulating data breaks the curse
  (Gerstgrasser et al, 2404.01413). Verify.
- Limits theory: the sharpening mechanism of self-improvement (2412.01951, cited by H5; here the
  conceptual claim that self-improvement sharpens an existing distribution, it does not add new
  capability). "Can Large Reasoning Models Self-Train" collapse result (2505.21444, cited by H5).
- Verify-then-add: recursive-self-improvement feasibility/safety pieces, intelligence-explosion
  critiques, empirical "self-improvement plateaus" studies. Distinguish argument from evidence.

## Owned deliverables
- Theme: `notes/by-theme/research-area-self-improvement-limits-and-survey.md`.
- by-paper notes (at least model collapse, self-consuming-models, one limits/sharpening source).
- `raw-search-results/lane-29-manifest.jsonl`, `raw-search-results/lane-29-search-log.md`,
  `notes/subagent-briefs/lane-29-self-improvement-limits-and-survey.md`.

## Deconflict
- You synthesize the CONCEPT and its LIMITS across the field. Cite H1 (loops), H5 (verifiable-reward
  collapse), I4 (recursive-self-improvement theory) rather than re-surveying them. Your distinctive
  contribution is the honest limits map: what compounds, what collapses, what only sharpens.

## WAM tie + thesis
This lane delivers the thesis's guardrails at the field level. Land three honest bounds: (1)
self-improvement trained on its own un-verified outputs collapses (curse of recursion, self-consuming
MAD), so the loop needs fresh, externally-verified data, which the repo's runtime verifier supplies;
(2) self-improvement often only SHARPENS existing ability rather than adding new capability, so do not
claim an autoresearch loop will make the WAM socially smart, only better-calibrated where the verifier
checks it; (3) recursive-self-improvement-to-superintelligence is rhetoric, not evidence. The modest,
defensible repo claim is a bounded, verifier-grounded improvement loop at the Physical/Material layers,
not open-ended self-evolution.
