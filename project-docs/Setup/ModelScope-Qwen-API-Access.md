---
sidebar_position: 31
---

# ModelScope Qwen API Access

Search token: `MODELSCOPE_QWEN_API_ACCESS`.

Status: private Qwen model access operation note.

Recorded: 2026-06-07.

This document records how to use the private Qwen model access currently
available through ModelScope. It intentionally avoids marketing language and
role descriptions. It records only model ids, endpoints, token handling,
quota/rate-limit inspection, and future runtime usage-guard requirements.

## Current Access

The user's supplied ModelScope model pages showed access to these private model
ids:

- `Qwen-Ambassador/Qwen3.7-Max`
- `Qwen-Ambassador/Qwen3.7-Plus`

`Qwen-Ambassador/...` is the namespace that appears in API request payloads.
Use the exact model id in request code, quota records, and run reports. Avoid
describing the namespace as a role or product claim.

Suggested experimental use:

- `Qwen3.7-Max`: text, coding, and tool-use evaluation.
- `Qwen3.7-Plus`: multimodal smoke tests that need image input.

This repo now has a `modelscope-api` social-cycle provider adapter for
provider-backed benchmark and smoke runs. Keep manual smoke tests in this note
because they are still the quickest way to isolate ModelScope account, quota,
or request-shape failures from Minecraft runtime behavior.

## Auth

ModelScope API-Inference uses a ModelScope Access Token. Token management pages:

```text
https://modelscope.cn/my/myaccesstoken
https://modelscope.ai/my/myaccesstoken
```

Store local credentials in the repo-local ignored `.env`:

```text
MODELSCOPE_API_KEY=...
MODELSCOPE_BASE_URL=https://api-inference.modelscope.ai/v1
```

Rules:

- `MODELSCOPE_API_KEY` is a ModelScope Access Token. It is separate from
  `OPENAI_API_KEY`, `GEMINI_API_KEY`, and any Codex auth store.
- Do not commit the token or print it into transcripts, reports, shell history,
  or docs.
- If the token appears in an attachment, screenshot, example, or committed
  artifact, revoke it and create a new token.

Official ModelScope CN docs state that API-Inference requires a registered
ModelScope account, Aliyun account binding, and real-name verification. Private
`.ai` access may still fail if account binding, private model permission, or
quota state is incomplete.

## Endpoint

The private Qwen model pages supplied by the user used:

```text
https://api-inference.modelscope.ai/v1
```

Official ModelScope API-Inference docs also show:

```text
https://api-inference.modelscope.cn/v1/
```

Operational rule:

- For these private Qwen models, start from the exact endpoint shown in the
  private model page sample: `https://api-inference.modelscope.ai/v1`.
- If the page sample changes, treat the model page sample as the current source
  of truth for that private model.
- Do not use `GET` or `HEAD /v1/chat/completions` as an availability test.
  Chat Completions is a `POST` API, and a 404 from `HEAD` does not prove the
  provider is unavailable.

## Minimal Smoke

Use `curl -D` so response headers are preserved for quota inspection.

```bash
MODEL_ID=Qwen-Ambassador/Qwen3.7-Max

curl -sS -D /tmp/modelscope-qwen.headers \
  -o /tmp/modelscope-qwen.response.json \
  "$MODELSCOPE_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $MODELSCOPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "'"$MODEL_ID"'",
    "messages": [
      {
        "role": "user",
        "content": "Return one short sentence confirming the API works."
      }
    ],
    "stream": false
  }'

rg -i 'modelscope-ratelimit|retry-after|x-ratelimit' /tmp/modelscope-qwen.headers
jq '.usage // .' /tmp/modelscope-qwen.response.json
```

Python SDK smoke:

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url=os.environ.get("MODELSCOPE_BASE_URL", "https://api-inference.modelscope.ai/v1"),
    api_key=os.environ["MODELSCOPE_API_KEY"],
)

response = client.chat.completions.create(
    model="Qwen-Ambassador/Qwen3.7-Max",
    messages=[
        {
            "role": "user",
            "content": "Return one short sentence confirming the API works.",
        }
    ],
    stream=False,
)

print(response.choices[0].message.content)
print(response.usage)
```

Streaming chunks from these examples may expose both `delta.reasoning_content`
and `delta.content`. Treat reasoning text as provider diagnostics only. It must
not become executable authority, primitive arguments, progress evidence, or
public-facing transcript content unless a specific test explicitly needs it.

## Tool Calling Smoke Findings

Checked on 2026-06-13 with `Qwen-Ambassador/Qwen3.7-Max` and
`Qwen-Ambassador/Qwen3.7-Plus`:

- `tools` with `tool_choice: "auto"` returned OpenAI-compatible
  `message.tool_calls` for both models.
- multiple visible tools with `tool_choice: "auto"` selected the expected
  function tool in a simple Minecraft action-selection smoke.
- named tool choice returned usable `message.tool_calls` only when the request
  included top-level `chat_template_kwargs: { "enable_thinking": false }`.
- `tool_choice: "required"`, named tool choice without `chat_template_kwargs`,
  and legacy `functions`/`function_call` shapes returned empty/zero-token
  responses in this API-Inference path.

Runtime implication: the `modelscope-api` social-cycle adapter uses Chat
Completions `tools`, `tool_choice: "auto"`, `parallel_tool_calls: false`, and
top-level `chat_template_kwargs.enable_thinking=false`. The Actor Turn prompt
must still require exactly one visible function tool, and the runtime
parser/validator remains the authority for accepted tool calls.

## Multimodal Smoke

Use `Qwen-Ambassador/Qwen3.7-Plus` for an image input smoke.

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url=os.environ.get("MODELSCOPE_BASE_URL", "https://api-inference.modelscope.ai/v1"),
    api_key=os.environ["MODELSCOPE_API_KEY"],
)

response = client.chat.completions.create(
    model="Qwen-Ambassador/Qwen3.7-Plus",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Describe the image in one sentence."},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://modelhub-us-west-1.oss-us-west-1.aliyuncs.com/prod/example/audrey_hepburn.jpg"
                    },
                },
            ],
        }
    ],
    stream=False,
)

print(response.choices[0].message.content)
print(response.usage)
```

## Usage And Rate Limits

Official ModelScope API-Inference limits checked on 2026-06-07 and
re-checked on 2026-06-13:

- API-Inference is a free evaluation interface, not a high-concurrency or SLA
  production service.
- The total daily API-Inference request limit is currently 2000 requests per
  registered user across all models.
- Each model also has a model-specific daily request limit. That limit is
  dynamically adjusted and is at most 200; actual available quota can be lower.
- Model concurrency/rate limits are dynamically adjusted by platform pressure,
  with normal single-concurrency use as the stated target.
- A `429` should be treated as provider quota/rate evidence. Switch models,
  lower concurrency, or wait for the next day instead of retrying aggressively.
- AIGC image models have separate throttling. Do not reuse AIGC quota behavior
  for these Qwen LLM/MLLM calls.

The official docs do not provide a confirmed reset timezone in the source
checked here. Do not assume Korea midnight or UTC midnight for ModelScope.
Record response headers and the exact time of `429` failures, then set local
guardrails conservatively.

Qwen Ambassador monthly quota recorded on 2026-06-14 from the user's supplied
program rule:

- `Qwen-Ambassador/Qwen3.7-Max`: 2500 API calls/month.
- `Qwen-Ambassador/Qwen3.7-Plus`: 10000 API calls/month.
- Usage resets and refreshes at the end of each calendar month.
- The quota unit is API calls, not input/output tokens.
- Available model ids may move to the latest flagship Qwen release, such as a
  future Qwen 3.8. Update the repo policy matrix and local budget file before
  running a new flagship id.

Source:

```text
https://modelscope.cn/docs/model-service/API-Inference/limits
user-provided Qwen Ambassador monthly quota note, recorded 2026-06-14
```

## Local Monthly Guard

ModelScope's public API-Inference limit page describes daily request quotas and
dynamic per-model daily quotas. The Qwen Ambassador quota used by this repo is
the user-provided monthly API-call allowance above.

Operational rule:

- Treat the Qwen Ambassador monthly allowance as a provider/model policy:
  `Qwen-Ambassador/Qwen3.7-Max` is capped at 2500 API calls/month and
  `Qwen-Ambassador/Qwen3.7-Plus` is capped at 10000 API calls/month.
- Track Qwen usage through the repo-local provider ledger:
  `build/provider-usage/provider-usage-ledger.jsonl`.
- Enforce the built-in policy matrix in
  `probe/src/provider/providerQuotaPolicies.ts` on every live request.
- Use the ignored budget file `build/provider-usage/free-tier-budgets.json` only
  for stricter local brakes, emergency stops, or usage already consumed outside
  this repo's ledger.
- Use `request_limit_per_month` for this cap. Do not model this Qwen allowance
  as a token budget.
- Use `total_token_limit_per_month` only if the operator has a concrete token
  budget to enforce.
- Use `already_used_this_month` only for usage that happened outside this
  repo's ledger. Normal repo runs should be counted from the ledger itself.

The current Qwen policy entries are:

```json
[
  {
    "provider_id": "modelscope-api",
    "model": "Qwen-Ambassador/Qwen3.7-Max",
    "quota_metric": "api_calls",
    "reset_window": "calendar_month_utc",
    "request_limit_per_month": 2500,
    "mode": "enforce"
  },
  {
    "provider_id": "modelscope-api",
    "model": "Qwen-Ambassador/Qwen3.7-Plus",
    "quota_metric": "api_calls",
    "reset_window": "calendar_month_utc",
    "request_limit_per_month": 10000,
    "mode": "enforce"
  }
]
```

If a provider dashboard, private account page, or Qwen Ambassador program update
shows a different monthly allowance, update both the policy matrix and this
document before running a new Qwen benchmark batch.

## Reasoning Configuration

OpenAI and Gemini expose explicit runtime reasoning controls in this repo's
provider adapters. ModelScope Qwen access is different in the current
OpenAI-compatible API-Inference path:

- the working Qwen tool-call shape uses top-level
  `chat_template_kwargs.enable_thinking=false`;
- named tool choice without that setting returned empty/zero-token responses in
  the 2026-06-13 smoke;
- no OpenAI-style `reasoning.effort = "medium"` setting has been confirmed for
  this ModelScope endpoint.

Official Qwen documentation checked on 2026-06-13 says Qwen3 supports
thinking/non-thinking modes, and OpenAI-compatible vLLM examples disable
thinking with:

```json
{
  "chat_template_kwargs": {
    "enable_thinking": false
  }
}
```

The same docs state that thinking budget is currently implemented by Alibaba
Cloud Model Studio API, while open-source frameworks need custom generation
logic for a budget-like effect. This is not equivalent to OpenAI
`reasoning.effort`.

Sources:

```text
https://qwen.readthedocs.io/en/latest/framework/function_call.html
https://qwen.readthedocs.io/en/latest/getting_started/quickstart.html#thinking-budget
https://qwen.readthedocs.io/en/latest/deployment/vllm.html#thinking-non-thinking-modes
https://qwen.readthedocs.io/en/latest/inference/transformers.html#thinking-non-thinking-mode
```

Benchmark rule: do not pretend Qwen has the same reasoning-effort knob as
OpenAI. For Actor Turn tool-call runs, record the condition as
`qwen-no-think` and keep Qwen thinking disabled unless a separate smoke proves
a supported ModelScope API-Inference request field and records the result here.

## Header-Based Quota Check

ModelScope documents these response headers for quota inspection:

```text
modelscope-ratelimit-requests-limit
modelscope-ratelimit-requests-remaining
modelscope-ratelimit-model-requests-limit
modelscope-ratelimit-model-requests-remaining
```

Interpretation:

- `requests-*`: current user's total daily API-Inference pool.
- `model-requests-*`: current requested model's daily pool.
- `remaining` is the number to use when deciding whether to run another batch.
- If headers are absent but the response has `usage`, record the usage and keep
  the run small until a quota signal appears.
- If a `429` response includes `Retry-After`, respect it.

For a long or repeated smoke, preserve:

```text
/tmp/modelscope-qwen.headers
/tmp/modelscope-qwen.response.json
request timestamp
model id
status code
```

Do not paste raw authorization headers or tokens into committed artifacts.

## Local Guardrail

The repo's provider usage tracker is provider-id agnostic, and the
`modelscope-api` social-cycle adapter uses the same ledger/guard shape already
used for Gemini/OpenAI:

```text
build/provider-usage/provider-usage-ledger.jsonl
build/provider-usage/free-tier-budgets.json
```

Conservative local budget example:

```json
{
  "schema": "provider-usage-budgets/v1",
  "budgets": [
    {
      "provider_id": "modelscope-api",
      "model": "Qwen-Ambassador/Qwen3.7-Max",
      "request_limit_per_month": 2500,
      "already_used_this_month": { "requests": 0 },
      "mode": "enforce",
      "source": "Qwen Ambassador Max monthly API-call quota"
    },
    {
      "provider_id": "modelscope-api",
      "model": "Qwen-Ambassador/Qwen3.7-Plus",
      "request_limit_per_month": 10000,
      "already_used_this_month": { "requests": 0 },
      "mode": "enforce",
      "source": "Qwen Ambassador Plus monthly API-call quota"
    }
  ]
}
```

After a successful header smoke, preserve daily header evidence as a secondary
rate-limit signal. The monthly Qwen guard remains API-call based and is checked
against the local ledger before every request.

## External API Provider

ModelScope also has an API-Provider mode where external provider keys can be
hosted in ModelScope account settings. Official docs say API-Provider calls keep
the same general API-Inference call shape and use the ModelScope token for
platform auth, but the model id includes an external provider suffix such as
`:DashScope`.

This is not the default path for the private Qwen model ids above. Use it only
if the model page explicitly shows an external provider option or if the user
intentionally routes through a commercial provider. External provider billing
and rate limits then belong to that external provider, not the free ModelScope
API-Inference pool.

## Runtime Integration Notes

The ModelScope social-cycle provider should keep these runtime boundaries:

- use provider id `modelscope-api`;
- read `MODELSCOPE_API_KEY` and `MODELSCOPE_BASE_URL` from repo-local `.env`;
- require the requested model id as an explicit runtime input, such as
  `--model Qwen-Ambassador/Qwen3.7-Max`;
- append provider usage records before/after every provider request;
- store raw usage from the OpenAI-compatible response when available;
- store rate-limit headers as provider output metadata;
- fail as `provider_error` or provider-budget blocker on `429`, not as Minecraft
  actor failure;
- do not parse model rationale or `reasoning_content` as action authority.

## Sources

Checked on 2026-06-07:

- ModelScope API-Inference intro:
  `https://modelscope.cn/docs/model-service/API-Inference/intro`
- ModelScope API-Inference usage limits:
  `https://modelscope.cn/docs/model-service/API-Inference/limits`
- ModelScope API-Provider intro:
  `https://modelscope.cn/docs/model-service/API-Inference/api-provider`
- ModelScope Access Token management:
  `https://modelscope.cn/docs/accounts/token`
- Private ModelScope Qwen model pages from the user's attached source:
  `Qwen-Ambassador/Qwen3.7-Max` and `Qwen-Ambassador/Qwen3.7-Plus`
