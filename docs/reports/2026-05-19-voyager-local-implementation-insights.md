# Voyager 로컬 구현 인사이트

대상: `/Users/naem1023/git/Voyager`의 실제 구현 파일.  
목적: 이 workspace의 작은 headless Minecraft NPC tool-loop, 특히 `/probe` 설계에 재사용할 아이디어와 버릴 부분을 구분한다.

## 요약

Voyager의 강점은 Minecraft 상태를 꽤 실용적인 텍스트 관찰값으로 압축하고, 실패 원인을 다음 LLM 입력으로 되돌려 보내는 루프에 있다. 반대로 핵심 런타임은 LLM이 JavaScript를 생성하고 `eval`로 실행하는 구조라서 이 repo의 목표와 맞지 않는다. 이 repo는 Voyager의 관찰 필드, 실패 피드백, 작은 curriculum 순서만 가져오고, 실행은 반드시 제한된 tool schema와 runtime validation으로 소유해야 한다.

## 실제 아키텍처 흐름

핵심 루프는 `/Users/naem1023/git/Voyager/voyager/voyager.py`에 있다.

- `CurriculumAgent`가 다음 task와 context를 제안한다.
- `ActionAgent`가 task/context/critique/관찰값을 보고 Mineflayer JavaScript 함수를 생성한다.
- `VoyagerEnv.step()`이 Node mineflayer 서버의 `/step`에 code와 primitive program을 POST한다.
- Node runtime은 `/Users/naem1023/git/Voyager/voyager/env/mineflayer/index.js`에서 `eval("(async () => {" + programs + "\n" + code + "})()")`로 실행한다.
- `CriticAgent`가 최종 observation을 보고 success/critique JSON을 만든다.
- 성공하면 `SkillManager`가 함수를 skill library에 저장하고 Chroma로 검색 가능하게 만든다.

이 repo가 복사하면 안 되는 부분은 이 전체 “LLM-generated JS -> eval -> generated skill DB”이다. 가져올 만한 부분은 “관찰 -> 실행 결과 -> 실패 이유 -> 다음 선택”이라는 피드백 구조뿐이다.

## Prompt와 Curriculum 설계

`/Users/naem1023/git/Voyager/voyager/prompts/curriculum.txt`는 다음 task를 한 문장으로 제한한다. “Mine 3 wood logs”, “Craft 1 item”처럼 검증 가능한 단일 행동으로 좁히며, 여러 task를 한 번에 제안하지 말라고 강하게 제한한다. `/Users/naem1023/git/Voyager/voyager/agents/curriculum.py`도 첫 task를 `Mine 1 wood log`로 하드코딩하고, 진행도에 따라 observation 필드를 점진적으로 노출한다.

좋은 점:

- 첫 task를 deterministic하게 시작한다.
- task는 단일 목표와 명확한 완료 조건을 가진다.
- inventory가 거의 꽉 차면 chest 관련 정리 task를 강제로 제안한다.
- completed/failed task를 유지해 반복을 줄인다.

주의할 점:

- QA cache와 Chroma 기반 context 확장은 `/probe`에는 과하다.
- “세계 탐험과 다양성 극대화” 목적은 social NPC probe와 다르다.
- placement/building task는 화면 검증 의존도가 커서 초기 proof에는 부적합하다.

## Observation Pipeline

관찰 주입은 `/Users/naem1023/git/Voyager/voyager/env/mineflayer/lib/observation/base.js`가 담당한다. 각 observation class를 `bot.obsList`에 넣고, event가 발생할 때 `[eventName, result]`를 `bot.cumulativeObs`에 쌓은 뒤 `bot.observe()`가 JSON 문자열로 반환한다.

쓸 만한 필드:

- `/Users/naem1023/git/Voyager/voyager/env/mineflayer/lib/observation/status.js`: `health`, `food`, `position`, `velocity`, `yaw`, `pitch`, `onGround`, `isInWater`, `isInLava`, `isCollidedHorizontally`, `biome`, nearby `entities`, `timeOfDay`, `inventoryUsed`, `elapsedTime`.
- `/Users/naem1023/git/Voyager/voyager/env/mineflayer/lib/observation/voxels.js`: 주변 block set과 최근 본 block record. 주변 scan은 `8 x 2 x 8` 범위로 작고 실용적이다.
- `/Users/naem1023/git/Voyager/voyager/env/mineflayer/lib/observation/inventory.js`: item name -> count dict.
- `/Users/naem1023/git/Voyager/voyager/env/mineflayer/lib/observation/chests.js`: chest 위치를 `Unknown`, `{items}`, `Invalid`로 기억한다.
- `/Users/naem1023/git/Voyager/voyager/env/mineflayer/lib/observation/onChat.js`, `onError.js`, `onSave.js`: chat/error/save 이벤트를 다음 관찰에 포함한다.

`/probe`에는 이 구조를 더 작게 줄이면 된다. 기본 observation은 `actor`, `position`, `visibleActors`, `recentChat`, `busy/available`, `nearbyBlocks`, `inventory`, `lastToolResult`, `memory` 정도면 충분하다. 특히 social probe에서는 `entities`를 mob 이름 집계가 아니라 actor id, distance, line-of-sight 가능 여부, busy 상태로 바꾸는 편이 좋다.

## Primitive API와 실패 피드백

Voyager primitive는 LLM이 직접 Mineflayer raw API를 부르지 않도록 하는 좋은 예시다.

- `/Users/naem1023/git/Voyager/voyager/control_primitives/mineBlock.js`: `name`, `count` 타입을 검사하고, `maxDistance: 32`로 제한하며, 못 찾으면 `No X nearby, please explore first`를 chat log에 남긴다.
- `/Users/naem1023/git/Voyager/voyager/control_primitives/craftItem.js`와 `craftHelper.js`: recipe가 없을 때 부족한 재료를 계산해 `I cannot make X because I need: ...`로 되돌려준다.
- `/Users/naem1023/git/Voyager/voyager/control_primitives/exploreUntil.js`: direction을 `-1/0/1` 벡터로 제한하고, callback 성공 또는 timeout까지 움직인다.
- `/Users/naem1023/git/Voyager/voyager/control_primitives/killMob.js`와 `waitForMobRemoved.js`: target 탐색, 공격, timeout, drop 수거를 하나의 고수준 primitive로 감싼다.
- `/Users/naem1023/git/Voyager/voyager/env/mineflayer/lib/skillLoader.js`: `useOn`, `activateBlock`은 6 block 밖이면 chat feedback만 남기고 실행하지 않는다. `fish`는 60초 timeout을 둔다.

다만 Voyager는 실패를 주로 chat string과 global fail count로 전달한다. `/probe`에서는 chat이 아니라 structured result가 먼저여야 한다.

추천 result shape:

```ts
type ToolResult =
  | { ok: true; code: "arrived" | "said" | "waited" | "remembered"; observationPatch?: object }
  | { ok: false; code: "not_found" | "too_far" | "busy" | "timeout" | "invalid_args" | "missing_item"; message: string };
```

LLM에게는 `message`를 보여주되, runtime과 테스트는 `code`를 검증해야 한다.

## Skill Library 예시에서 얻을 점

초기 생존 skill은 seed task 순서를 보여준다.

- `/Users/naem1023/git/Voyager/skill_library/trial1/skill/code/mineWoodLog.js`: 여러 log 종류를 허용하고, `exploreUntil` 후 `mineBlock`으로 단순히 1개를 캔다.
- `/Users/naem1023/git/Voyager/skill_library/trial1/skill/code/craftCraftingTable.js`: plank 부족 시 log를 plank로 바꾸고 crafting table을 만든다.
- `/Users/naem1023/git/Voyager/skill_library/trial1/skill/code/craftWoodenPickaxe.js`: crafting table, planks, sticks, place table, craft pickaxe 순서를 보여준다.
- `/Users/naem1023/git/Voyager/skill_library/trial3/skill/code/mineEightCobblestone.js`: pickaxe 장착 후 stone을 찾아 cobblestone을 얻는다.
- `/Users/naem1023/git/Voyager/skill_library/trial3/skill/code/eatCookedMuttonIfHungry.js`: hunger 조건 기반 행동의 작은 예다.

복사하지 말아야 할 점도 분명하다. 일부 skill은 `oak_log`, `oak_planks`에 강하게 묶여 있고, `craftFurnace.js`처럼 primitive signature와 맞지 않는 호출을 포함한다. generated skill library는 품질이 들쭉날쭉하므로 `/probe`의 seed skill은 “저장된 JS 함수”가 아니라 “runtime-owned tool recipes”로 작성해야 한다.

## Safety, Timeout, Error Feedback

Voyager의 안정장치는 실험적으로 유용하지만 운영 모델로는 위험하다.

- `/Users/naem1023/git/Voyager/voyager/env/bridge.py`는 request timeout으로 Python 쪽 step을 끊는다.
- `/Users/naem1023/git/Voyager/voyager/env/mineflayer/index.js`는 stuck 감지 시 teleport로 풀고, reset 때 `/clear`, `/kill`, `/give`, `/tp`를 적극 사용한다.
- primitive별 fail count가 10회를 넘으면 throw한다.
- `CriticAgent`는 `/Users/naem1023/git/Voyager/voyager/prompts/critic.txt`에 따라 inventory/status 기반 성공 여부를 JSON으로 판단한다.

`/probe`에서는 teleport나 command 보정은 fixture setup에만 허용하고, agent tool 결과에는 명시적으로 드러내야 한다. timeout은 tool별로 작게 두고, 실패가 발생하면 retry를 runtime이 숨기지 말고 transcript에 남겨야 한다.

## 이 repo에 반영할 점

1. `/probe`의 curriculum은 자동 생성보다 deterministic seed sequence로 시작한다: `observe -> move_to(npc_b) -> say -> wait 또는 rephrase -> remember`. 생존형 확장은 그 다음에 `inspect_nearby_blocks -> collect_log -> inspect_inventory -> craft_planks` 정도만 추가한다.
2. tool schema는 Voyager primitive처럼 작고 고수준이어야 한다. 초기 tool은 `observe`, `move_to`, `say`, `wait`, `remember`만 두고, 각 tool은 args type, target 존재, distance, busy state, timeout을 runtime에서 검증한다.
3. observation은 Voyager 필드를 축소해서 `position`, `nearbyBlocks`, `visibleActors`, `recentChat`, `inventory`, `health/food`, `elapsedTicks`, `lastToolResult`를 포함한다. social loop에는 `visibleActors[].busy`와 `visibleActors[].distance`가 필수다.
4. 실패 피드백은 chat log 문자열이 아니라 structured `ToolResult.code`로 남긴다. 예: `busy`, `too_far`, `not_found`, `timeout`, `invalid_args`.
5. transcript는 Voyager의 cumulative event 방식처럼 step별 event ledger로 저장한다. 최소 필드: `step`, `actor`, `observation`, `proposal`, `toolResult`, `utterance`, `memoryAfter`.
6. critic은 LLM critic으로 시작하지 않는다. `/probe` acceptance는 deterministic verifier로 둔다: 두 봇 접속, 3회 이상 observe/tool/result, blocked result 1회, blocked 이후 다른 action, memory 기록.
7. seed skill set은 generated code가 아니라 hand-written runtime tools와 fixtures로 둔다. Voyager skill examples는 task ordering 참고용으로만 사용한다.
8. `eval`, Chroma skill DB, broad QA curriculum, Minecraft command 기반 자동 보정, manual client inspection은 초기 `/probe`에서 제외한다.

## 결론

Voyager는 “Minecraft에서 LLM agent가 배울 수 있게 만드는 관찰/피드백 루프”의 좋은 참고 자료다. 하지만 이 repo의 방향은 LLM이 코드를 쓰는 agent가 아니라, LLM이 제한된 행동 의도를 고르고 runtime이 안전하게 실행하는 NPC다. 따라서 Voyager에서 가져올 것은 상태 압축, primitive 단위, 실패를 다음 입력으로 되돌리는 방식이고, 버릴 것은 generated JS execution과 장기 skill library 중심 아키텍처다.
