# Gemini Native Audio Dialog — Codegen Verdict

Status: **recorded 2026-05-23; planner path removed 2026-05-29**
Scope: long-objective / direct-generated TypeScript planner (`ObjectivePhasePlannerPort`)

## Summary

**Do not use Gemini Native Audio Dialog (`live-transcription` / `Modality.AUDIO` + `outputAudioTranscription`) as a Mineflayer TypeScript codegen path.**

Use instead:

1. **REST `text-genai`** (`callGeminiTextGenai` / `gemini-2.5-flash`) with structured JSON output (`source` field contains the generated TS), or
2. **Gemini OpenAI-compatible Chat Completions** (experimental; see matrix report under `tmp/gemini-openai-compat-matrix-report.json`).

The planner no longer falls back to `live-transcription`. The Native Audio
Dialog implementation and smoke CLI have been removed from active code.

## What Native Audio Dialog actually is (this repo)

| Direction | Field | Used for planner output? |
|-----------|--------|---------------------------|
| **In** | `sendClientContent({ turns: prompt })` — **text only** | Yes |
| **Out (kept)** | `serverContent.outputTranscription.text` | **Yes** (production) |
| **Out (discarded)** | `modelTurn.parts[].text` | **No** (by design) |
| **Out (discarded)** | `modelTurn.parts[].inlineData` audio | No |

Historical implementation path: `probe/src/provider/gemini/nativeAudioDialog.ts`,
mode `transcription_only` (removed from active code).

## Evidence (parallel matrix, short codegen prompt)

Report: `tmp/gemini-planner-matrix-report.json`  
Historical script: `probe/scripts/experimentLivePlannerMatrix.ts` (removed from
active code).

| Path | Sandbox-valid TS |
|------|------------------|
| REST `text-genai` / `gemini-2.5-flash` | **PASS** |
| Live AUDIO + transcription only (production) | **FAIL** (broken spacing: `asyncfunctionrun`) |
| Live AUDIO + `modelTurn.text` only | Unreliable (CoT markdown; false PASS possible) |
| Live `Modality.TEXT` (native-audio or flash model) | **EMPTY** (no `turnComplete` in 45s) |

Long-objective default run (`craft_current_run_stone_pickaxe_1`, no `--force-path`): both phases executed **builtin-phase-source**; Gemini was called but no LLM-generated TS ran.

## Operational defaults

```bash
# Planner
--provider gemini-planner --force-path text-genai

# Or env
GEMINI_PLANNER_PRIMARY=text-genai
PROBE_LONG_OBJECTIVE_PROVIDER_ORDER=text-genai
```

## Follow-up

- OpenAI SDK → Gemini OpenAI-compatible endpoint for codegen + structured JSON (see `probe/scripts/experimentGeminiOpenAiCompatMatrix.ts`).
- Optional: planner adapter `gemini-openai-compat-planner` sharing message shape with existing Codex prompts.
