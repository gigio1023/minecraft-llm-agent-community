# Gemini Native Audio Dialog — Codegen Verdict

Status: **recorded 2026-05-23**  
Scope: long-objective / direct-generated TypeScript planner (`ObjectivePhasePlannerPort`)

## Summary

**Do not use Gemini Native Audio Dialog (`live-transcription` / `Modality.AUDIO` + `outputAudioTranscription`) as the primary path for Mineflayer TypeScript codegen.**

Use instead:

1. **REST `text-genai`** (`callGeminiTextGenai` / `gemini-2.5-flash`) — proven sandbox-valid TS, or
2. **Gemini OpenAI-compatible Chat Completions** (experimental; see matrix report under `tmp/gemini-openai-compat-matrix-report.json`).

`@google/genai` Live Native Audio remains in the repo for dialog/smoke experiments; it is not removed.

## What Native Audio Dialog actually is (this repo)

| Direction | Field | Used for planner output? |
|-----------|--------|---------------------------|
| **In** | `sendClientContent({ turns: prompt })` — **text only** | Yes |
| **Out (kept)** | `serverContent.outputTranscription.text` | **Yes** (production) |
| **Out (discarded)** | `modelTurn.parts[].text` | **No** (by design) |
| **Out (discarded)** | `modelTurn.parts[].inlineData` audio | No |

Implementation: `probe/src/provider/gemini/nativeAudioDialog.ts`, mode `transcription_only`.

## Evidence (parallel matrix, short codegen prompt)

Report: `tmp/gemini-planner-matrix-report.json`  
Script: `probe/scripts/experimentLivePlannerMatrix.ts`

| Path | Sandbox-valid TS |
|------|------------------|
| REST `text-genai` / `gemini-2.5-flash` | **PASS** |
| Live AUDIO + transcription only (production) | **FAIL** (broken spacing: `asyncfunctionrun`) |
| Live AUDIO + `modelTurn.text` only | Unreliable (CoT markdown; false PASS possible) |
| Live `Modality.TEXT` (native-audio or flash model) | **EMPTY** (no `turnComplete` in 45s) |

Long-objective default run (`craft_current_run_stone_pickaxe_1`, no `--force-path`): both phases executed **builtin-phase-source**; Gemini was called but no LLM-generated TS ran.

## Operational defaults (until OpenAI-compat path lands)

```bash
# Planner
--provider gemini-live-planner --force-path text-genai

# Or env
GEMINI_PLANNER_PRIMARY=text-genai
PROBE_LONG_OBJECTIVE_PROVIDER_ORDER=text-genai,live-transcription
```

## Follow-up

- OpenAI SDK → Gemini OpenAI-compatible endpoint for codegen + structured JSON (see `probe/scripts/experimentGeminiOpenAiCompatMatrix.ts`).
- Optional: planner adapter `gemini-openai-compat-planner` sharing message shape with existing Codex prompts.
