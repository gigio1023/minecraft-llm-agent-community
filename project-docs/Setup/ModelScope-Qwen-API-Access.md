---
sidebar_position: 31
---

# ModelScope Qwen API Access

Search token: `MODELSCOPE_QWEN_API_ACCESS`.

Status: private Qwen model access operation note.

Recorded: 2026-06-07.

이 문서는 ModelScope에서 받은 Qwen 모델 접근 권한을 기술적으로 쓰기
위한 운영 메모다. 홍보 문구나 역할 설명은 남기지 않고, 요청 endpoint,
model id, 토큰 보관, usage/rate-limit 확인, repo usage guard 연결 기준만
기록한다.

## Current Access

첨부된 ModelScope 모델 페이지 기준으로 현재 접근 가능한 private model id:

- `Qwen-Ambassador/Qwen3.7-Max`
- `Qwen-Ambassador/Qwen3.7-Plus`

`Qwen-Ambassador/...`는 요청 payload에 들어가는 ModelScope model id의
namespace다. 문서나 리포트 설명에서는 역할/마케팅 표현을 쓰지 말고,
요청 코드와 quota 기록에서만 정확한 model id로 사용한다.

Use case 기준:

- `Qwen3.7-Max`: 텍스트, 코딩, tool-use 평가용 우선 후보.
- `Qwen3.7-Plus`: 이미지 입력이 필요한 multimodal smoke 또는 UI/screen
  판단 실험용 후보.

이 repo의 Minecraft social-cycle runtime에는 아직 `modelscope-api` provider
adapter가 없다. 지금 단계의 목적은 수동 smoke, quota 확인, future adapter
구현 시 사용할 auth/usage contract를 고정하는 것이다.

## Auth

ModelScope API-Inference는 ModelScope Access Token을 쓴다. 공식 문서의
토큰 관리 페이지:

```text
https://modelscope.cn/my/myaccesstoken
https://modelscope.ai/my/myaccesstoken
```

Repo-local `.env`에는 다음처럼 저장한다.

```text
MODELSCOPE_API_KEY=...
MODELSCOPE_BASE_URL=https://api-inference.modelscope.ai/v1
MODELSCOPE_MODEL=Qwen-Ambassador/Qwen3.7-Max
```

주의:

- `MODELSCOPE_API_KEY`는 ModelScope Access Token이다. `OPENAI_API_KEY`,
  `GEMINI_API_KEY`, `openai-codex` auth store와 다른 인증 경로다.
- 토큰을 커밋하거나 transcript, report, shell history, docs에 출력하지
  않는다.
- 첨부/캡처/예시 코드에 실제 토큰이 노출됐다면 폐기하고 새 토큰으로
  교체한다.

Official ModelScope CN docs state that API-Inference requires a registered
ModelScope account, Aliyun account binding, and real-name verification. Private
`.ai` access may still fail if account binding, private model permission, or
quota state is incomplete.

## Endpoint

Private Qwen model pages supplied in the attachment use:

```text
https://api-inference.modelscope.ai/v1
```

Official ModelScope API-Inference docs use:

```text
https://api-inference.modelscope.cn/v1/
```

Operational rule:

- For these private Qwen models, start from the exact endpoint shown in the
  model page sample: `https://api-inference.modelscope.ai/v1`.
- If the page sample changes, treat the model page sample as the current source
  of truth for that private model.
- Do not use `GET` or `HEAD /v1/chat/completions` as an availability test.
  Chat Completions is a `POST` API, and a 404 from `HEAD` is not enough to prove
  the provider is unavailable.

## Minimal Smoke

Use `curl -D` so the response headers are preserved for quota inspection.

```bash
curl -sS -D /tmp/modelscope-qwen.headers \
  -o /tmp/modelscope-qwen.response.json \
  "$MODELSCOPE_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $MODELSCOPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "'"$MODELSCOPE_MODEL"'",
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
    model=os.environ.get("MODELSCOPE_MODEL", "Qwen-Ambassador/Qwen3.7-Max"),
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

Official ModelScope API-Inference limits checked on 2026-06-07:

- API-Inference is a free evaluation interface, not a high-concurrency or SLA
  production service.
- The total daily API-Inference request limit is currently 2000 requests per
  registered user across all models.
- Each model also has a model-specific daily request limit. That limit is
  dynamically adjusted and is at most 200; actual available quota can be much
  lower.
- Model concurrency/rate limits are dynamically adjusted by platform pressure,
  with normal single-concurrency use as the stated target.
- A `429` should be treated as provider quota/rate evidence. Switch models,
  lower concurrency, or wait for the next day instead of retrying aggressively.
- AIGC image models have separate throttling; do not reuse AIGC quota behavior
  for these Qwen LLM/MLLM calls.

The official docs do not provide a confirmed reset timezone in the source
checked here. Do not assume Korea midnight or UTC midnight for ModelScope.
Record response headers and the exact time of `429` failures, then set local
guardrails conservatively.

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

The repo's provider usage tracker is provider-id agnostic, but the current
social-cycle provider union does not include ModelScope yet. When a
`modelscope-api` adapter is added, use the same ledger/guard shape already used
for Gemini/OpenAI:

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
      "request_limit_per_day": 20,
      "already_used": { "requests": 0 },
      "mode": "enforce",
      "source": "operator cap until ModelScope response headers confirm active remaining quota"
    },
    {
      "provider_id": "modelscope-api",
      "model": "Qwen-Ambassador/Qwen3.7-Plus",
      "request_limit_per_day": 10,
      "already_used": { "requests": 0 },
      "mode": "enforce",
      "source": "operator cap until ModelScope response headers confirm active remaining quota"
    }
  ]
}
```

After a successful header smoke, update `already_used` or the local limit based
on observed remaining quota. The local guard is an operator safety brake, not an
official quota guarantee.

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

If this repo later adds a ModelScope social-cycle provider:

- use provider id `modelscope-api`;
- read `MODELSCOPE_API_KEY`, `MODELSCOPE_BASE_URL`, and requested model from
  repo-local `.env` or CLI args;
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
