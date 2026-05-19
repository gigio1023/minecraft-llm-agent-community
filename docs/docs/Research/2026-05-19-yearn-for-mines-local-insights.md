# yearn_for_mines 로컬 구현 인사이트

대상 repo: `/Users/naem1023/git/yearn_for_mines`  
작성 목적: 이 workspace의 작은 Minecraft LLM agent `/probe` 설계를 개선하기 위한 실제 구현 기반 참고.

## 핵심 요약

`yearn_for_mines`는 Minecraft 행동을 MCP 도구로 감싸고, 에이전트가 `perceive -> plan -> execute -> verify -> remember` 루프를 돌도록 만든 비교적 큰 실험이다. 이 repo가 바로 가져올 것은 전체 구조가 아니라 세 가지다.

- 도구 실행 결과가 곧 다음 observation이 되는 패턴
- runtime이 transient/system error와 game error를 구분하는 패턴
- macro tool을 "LLM이 세부 mineflayer 절차를 쓰지 않게 하는 안전한 축약 행동"으로 쓰는 패턴

반대로 지금 `/probe`에는 MemPalace, 전체 crafting/combat/build toolset, broad observation spec을 바로 들이면 과하다. 먼저 dialogue probe의 작은 tool contract와 transcript 품질을 강화하는 쪽이 맞다.

## 실제 구현에서 확인한 구조

### Agent loop

`/Users/naem1023/git/yearn_for_mines/packages/agent/src/agent-loop.ts`는 `AgentLoop.run()` 안에서 도구 discovery, memory retrieval, system prompt 구성 후 루프를 돈다. 주석과 구현 모두 명시적으로 `PERCEIVE`, `PLAN`, `EXECUTE`, `VERIFY`, `REFLECT & REMEMBER` 단계를 둔다.

실행 흐름에서 참고할 만한 부분:

- `discoverTools()`가 Minecraft MCP tools와 MemPalace tools를 합쳐 LLM에 제공한다.
- `plan()`은 현재 observation, 목표, 이전 대화 history를 넣고 tool call을 요구한다.
- tool call이 없고 목표도 미달이면 "반드시 tool call을 내라"는 user message를 추가해 다음 turn으로 넘긴다.
- `executeWithRetry()`는 tool result를 `role: "tool"` message로 history에 넣어 다음 판단의 근거로 만든다.
- `verify()`는 tool 성공 문자열만 믿지 않고 다시 `bot_status`를 읽은 뒤 LLM에게 목표 달성 여부를 묻는다.
- `reflectAndRemember()`는 성공/실패 후 LLM reflection을 통해 facts와 heuristics를 MemPalace에 저장한다.

주의할 점도 있다. 이 구현의 perceive/verify는 OpenSpec의 `observe` 요구와 달리 실제로는 `bot_status`만 호출한다. 또한 agent-loop 파일 안에는 이전 수정 흔적으로 보이는 주석이 남아 있어, 구현 신뢰도는 "패턴 참고" 수준으로 보는 편이 안전하다.

### Observation builder와 formatter

`/Users/naem1023/git/yearn_for_mines/packages/mc-mcp-server/src/observation-builder.ts`는 mineflayer bot에서 다음 정보를 모아 `ContextFrame`으로 줄인다.

- health, food, oxygen, position, dimension, biome
- inventory summary
- nearby entities, dropped items, blocks를 합친 `pointsOfInterest`
- 가장 가까운 PoI 5개만 선택
- 도구 실행 후 outcome description을 observation 최상단에 포함

`/Users/naem1023/git/yearn_for_mines/packages/mc-mcp-server/src/observation-formatter.ts`는 이 구조를 LLM prompt용 텍스트로 바꾼다. `=== Outcome ===`, `=== Vital Stats ===`, `=== Inventory Summary ===`, `=== Points of Interest ===`, `=== Recent Events ===`처럼 사람이 읽기 쉬운 구획을 만든다.

좋은 점은 tool result가 단순 "success"가 아니라 "행동 결과 + 새 world state"가 된다는 점이다. 다음 LLM turn이 별도 observe를 기다리지 않아도 방금 행동의 결과를 읽을 수 있다.

한계도 분명하다. shared type인 `/Users/naem1023/git/yearn_for_mines/packages/shared/src/types/observation.ts`와 OpenSpec의 `/Users/naem1023/git/yearn_for_mines/openspec/specs/observation-pipeline/spec.md`는 훨씬 풍부한 observation을 요구하지만, 실제 `ContextFrame`은 축약형이다. `/probe`는 오히려 이 축약형을 참고해야 한다. 전체 Minecraft player HUD를 재현하기보다 dialogue에 필요한 visible actors, recent utterances, last action result, inventory delta 정도가 더 맞다.

## MCP/tool boundary

도구는 `/Users/naem1023/git/yearn_for_mines/packages/mc-mcp-server/src/tools/*.ts`에 흩어져 있고, 대부분 `server.registerTool()`로 mineflayer API를 감싼다.

좋은 경계:

- LLM은 `gather_materials`, `craft_items`, `reposition`, `interact` 같은 의도 수준의 tool call만 낸다.
- tool handler가 block/item registry 검증, pathfinder 호출, equip, dig/place/craft를 소유한다.
- 실패해도 대체로 `buildObservation(bot, "...실패 이유...")`를 붙여 LLM이 다음 행동을 바꿀 수 있게 한다.
- `lifecycle.ts`의 `bot_connect`는 연결 실패를 `transientErrorResult()`로 반환하고, agent-loop가 이를 connection/system error로 분류한다.

위험한 경계:

- 많은 gameplay 실패가 `errorResult()`가 아니라 `textResult(formatObservation(...failure...))`로 반환된다. 예: `gather_materials.ts`, `craft_items.ts`, `reposition.ts`, `interact.ts`의 실패 대부분은 `isError: false`다.
- agent-loop의 retry/alternative 로직은 `result.isError`에 의존한다. 따라서 "목표 블록을 못 찾음", "pathfinding 실패", "재료 부족" 같은 중요한 game failure가 retry로 들어가지 않고 성공 result처럼 history에 남을 수 있다.
- `/probe`에서는 이 실수를 피해야 한다. tool result는 최소한 `{ ok, kind, message, observation }` 같은 구조를 갖고, blocked/unavailable/invalid/transient를 명확히 분리해야 한다.

## Macro tools

`/Users/naem1023/git/yearn_for_mines/packages/mc-mcp-server/src/tools/macro/craft_macro.ts`는 2x2 craft, crafting table 탐색, table 제작/배치, craft, optional cleanup까지 한 tool로 묶는다. `/Users/naem1023/git/yearn_for_mines/packages/mc-mcp-server/src/tools/macro/interact_block_macro.ts`도 block 탐색, 필요 시 craft/place, activate, cleanup을 묶는다.

이 접근은 LLM agent에 유용하다. LLM에게 "crafting table을 만들고 놓고 바라보고 craft하라"는 세부 절차를 매번 맡기면 실패 surface가 커진다. macro tool은 자주 반복되는 embodied routine을 runtime 소유 절차로 고정한다.

하지만 지금 `/probe`에는 바로 필요하지 않다. dialogue probe에서의 macro는 crafting이 아니라 사회적 상호작용 쪽이어야 한다. 예를 들면 `approach_and_converse(target, text)`처럼 이동 가능 여부, 거리, target availability, chat delivery, transcript append를 하나의 검증된 macro로 묶는 식이 더 적합하다.

## Retry와 alternative behavior

`agent-loop.ts`의 retry 관련 구현은 참고 가치가 높다.

- `maxRetries` 기본값은 3이다.
- 동일 tool call이 최근 3번 모두 실패하면 `checkStallCondition(3)`이 true가 되고, 다음 prompt에 "다른 tool 또는 전략을 고려하라"는 system injection을 붙인다.
- 마지막 retry에서 `tryAlternative()`가 임시 conversation을 만들어 LLM에게 다른 tool을 요청한다.
- transient error는 일반 game retry와 분리해 `handleDisconnection()`으로 paused state에 들어간다.

이 repo에 필요한 핵심은 "같은 실패를 반복하면 runtime이 다른 선택을 요구한다"는 부분이다. 다만 `/probe`에서는 LLM에게 임시 대체 tool call을 새로 받기보다, transcript에 `blocked_reason`을 명시하고 다음 normal turn에서 선택하게 하는 편이 작고 추적 가능하다.

## Memory

`/Users/naem1023/git/yearn_for_mines/packages/agent/src/memory-manager.ts`는 MemPalace를 통해 세 층의 기억을 관리한다.

- `minecraft-skills` wing: `wood-gathering`, `crafting`, `mining`, `navigation`, `combat`, `farming`, `survival`
- `minecraft-knowledge` wing: `blocks`, `items`, `mobs`, `recipes`, `biomes`, `mechanics`
- diary: milestone/failure 기록

성공 episode에서는 LLM reflection으로 facts와 heuristic을 뽑아 저장한다. 실패 episode에서는 diary에 "목표, 에러, 시도한 tool sequence"를 남긴다. OpenSpec의 `/Users/naem1023/git/yearn_for_mines/openspec/specs/memory-integration/spec.md`도 raw tool call 저장보다 semantic heuristic 저장을 요구한다.

`/probe`에 바로 필요한 것은 외부 memory DB가 아니다. actor별 짧은 episodic memory면 충분하다.

- 최근 들은 말
- 상대 actor에 대한 짧은 note
- 방금 실패한 행동과 이유
- 이번 run의 objective 관련 사실

이 네 가지를 transcript와 함께 JSON으로 남기면, 나중에 MemPalace류 장기 기억으로 확장하기 쉽다.

## OpenSpec에서 참고할 의도

유용한 spec:

- `/Users/naem1023/git/yearn_for_mines/openspec/specs/agent-controller/spec.md`: 루프 단계, verify-before-success, retry 후 alternative 요구
- `/Users/naem1023/git/yearn_for_mines/openspec/specs/minecraft-mcp-server/spec.md`: lifecycle, observation, movement, chat, event subscription tool boundary
- `/Users/naem1023/git/yearn_for_mines/openspec/specs/agent-connection-lifecycle/spec.md`: connection/system error와 game error 분리
- `/Users/naem1023/git/yearn_for_mines/openspec/specs/crafting-macro/spec.md`: 자주 실패하는 세부 절차를 macro로 승격하는 기준
- `/Users/naem1023/git/yearn_for_mines/openspec/specs/block-interaction-macro/spec.md`: "찾기 -> 이동 -> 상호작용 -> optional 생성/정리" 형태의 runtime-owned macro

다만 OpenSpec은 실제 구현보다 더 넓다. `/probe`에서는 spec의 큰 목록을 구현 목표로 삼기보다, 작은 dialogue scenario에 필요한 contract만 추려야 한다.

## 이 repo에 반영할 점

1. `/probe`의 tool result를 구조화한다.

   권장 최소 형태:

   ```ts
   type ProbeToolResult = {
     ok: boolean;
     status: "done" | "blocked" | "invalid" | "unavailable" | "transient";
     message: string;
     observation: ProbeObservation;
   };
   ```

   `ok: false`를 game failure에도 사용해야 한다. 그래야 같은 실패 반복, retry, 다른 행동 선택을 runtime이 감지할 수 있다.

2. observation은 compact context bundle로 유지한다.

   `yearn_for_mines`의 formatter처럼 읽기 쉬운 구획은 좋지만, `/probe`에는 다음 정도면 충분하다.

   - actor 상태: 위치, 현재 objective, last action result
   - visible actors: 이름, 거리, busy/available, 최근 발화
   - conversation: 최근 4-8개 utterance
   - memory: actor별 최근 note 3-5개
   - allowed tools와 one-tool-per-turn rule

3. `converse`를 first-class tool로 두고 delivery result를 남긴다.

   `converse(targetActor, text)`는 단순 chat wrapper가 아니라 target 검증, 거리 검증, availability 검증, transcript append, heard-by 목록을 반환해야 한다. 실패 시 `blocked`로 남기고 다음 turn에서 `move_to`, `wait`, `rephrase` 중 하나를 고르게 한다.

4. dialogue용 macro를 하나만 추가한다.

   crafting macro를 가져오지 말고, 첫 macro는 `approach_and_converse` 또는 `request_attention` 정도가 좋다. 내부적으로 `move_to`와 `converse`를 묶되, transcript에는 substep을 남긴다. 이렇게 하면 LLM이 거리 문제 때문에 같은 실패를 반복하는 것을 줄일 수 있다.

5. retry는 작게 시작한다.

   `/probe`에서는 자동 재실행보다 "반복 실패 감지 + 다음 prompt에 명시"가 적합하다. 같은 actor가 같은 tool/args로 2번 `blocked`되면 다음 provider call에 `Do not repeat the same action; choose wait, move_to, or a different utterance.`를 넣는다.

6. verify는 runtime-owned rule로 둔다.

   `yearn_for_mines`는 LLM에게 goal achieved를 묻지만, `/probe`의 첫 acceptance는 runtime이 판정할 수 있다. 예: 최소 4턴 대화, 양쪽 actor 발화 존재, 하나 이상의 non-dialogue action, memory note 1개 이상. LLM verification은 나중에 붙인다.

7. memory는 파일 기반 short memory부터 시작한다.

   MemPalace 같은 장기 기억은 아직 과하다. `/probe`에는 run transcript 옆에 actor별 memory snapshot을 저장하고, 다음 turn prompt에 최근 note만 넣는다. 성공/실패 reflection은 "짧은 note 생성"까지만 한다.

8. lifecycle/transient error 분리는 바로 반영한다.

   `bot_connect`, `bot_status`, `move_to`, `converse` 실패를 `transient`와 `blocked`로 나누면 provider가 서버 문제를 game decision으로 오해하지 않는다. 이 점은 작은 probe에서도 중요하다.

## 결론

`yearn_for_mines`에서 가장 좋은 교훈은 "LLM에게 mineflayer 세부 API를 맡기지 말고, runtime-owned validated tools와 rich result observation을 제공하라"는 점이다. `/probe`는 그 원칙을 dialogue에 맞게 축소해야 한다. 지금 필요한 구현 방향은 full Minecraft agent가 아니라, `observe -> one validated social/tool action -> structured result -> short memory -> transcript`를 반복하는 작은 루프다.
