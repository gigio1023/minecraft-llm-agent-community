# mineflayer-chatgpt 로컬 구현 인사이트

검토 대상: `/Users/naem1023/git/mineflayer-chatgpt`

이 repo는 “Minecraft 안에서 오래 살아남는 방송형 봇”에 가깝다. 현재 workspace의 목표인 작은 headless NPC 대화 probe와 범위는 다르지만, 실제 구현에는 `/probe`에 바로 옮길 수 있는 구조가 몇 가지 있다. 특히 이벤트 기반 brain, 프롬프트 분리, 팀 bulletin, role별 action gate, 실패 blacklist는 유용하다. 반대로 Voyager식 동적 JS skill 실행은 현재 방향과 맞지 않으므로 참고만 해야 한다.

## 핵심 관찰

### 이벤트 기반 brain

`/Users/naem1023/git/mineflayer-chatgpt/src/bot/brain.ts`는 500ms polling 대신 이벤트 큐를 둔다. 이벤트 타입은 `strategic`, `reactive`, `chat`, `critic`이며 priority로 정렬된다. hostile scan, health event, chat, idle timeout, action 완료 후 critic이 각각 다른 이벤트를 넣는다.

좋은 점은 LLM 호출을 “상황이 바뀌었을 때”로 줄인다는 것이다. `processing` 플래그와 queue dedupe가 있어 한 bot이 동시에 여러 결정을 실행하지 않는다. `/probe`도 매 tick마다 판단하지 말고, `spawned`, `chat_received`, `tool_result`, `idle_timeout`, `blocked` 같은 작은 이벤트만 처리하는 편이 맞다.

주의할 점은 이 구현이 여전히 거대한 생존 봇에 맞춰져 있다는 것이다. `/probe`에는 hostile scanner, overlay, TTS, long skill 실행까지 가져오면 안 된다. 이벤트 큐와 priority 모델만 축소해서 가져오면 충분하다.

### 프롬프트 분리

`/Users/naem1023/git/mineflayer-chatgpt/src/llm/prompts.ts`는 prompt를 네 개로 나눈다.

- strategic: 목표 계획, 강한 모델, JSON decision
- reactive: 위협/체력/허기 대응, 작은 prompt
- critic: 직전 action 결과 평가 및 다음 step 제안
- chat: viewer/player에게 짧게 응답

이 분리는 `/probe`에도 잘 맞는다. 다만 첫 proof에서는 `strategic + critic`만 있어도 충분하다. `reactive`는 “말하기 실패, 대상 busy, 너무 멂” 같은 social/reactive failure에 대응하도록 축소하면 된다. `chat` prompt는 외부 viewer보다 NPC 간 utterance 생성에 맞게 바꿔야 한다.

### 실행 계층과 action gate

`/Users/naem1023/git/mineflayer-chatgpt/src/bot/actions.ts`는 `executeAction(bot, action, params)`로 모든 실행을 모은다. `go_to`, `chat`, `respond_to_chat`, `craft`, `eat`, `attack`, `invoke_skill` 등 문자열 action을 실제 mineflayer 호출로 매핑한다. `safeGoto()`는 timeout과 stall detection을 둔다.

`/Users/naem1023/git/mineflayer-chatgpt/src/bot/brain.ts`의 `executeDecision()`은 role별 `allowedActions`와 `allowedSkills`를 검사하고, 허용되지 않은 action은 실행하지 않는다. 이 구조는 현재 repo의 원칙과 잘 맞는다. LLM은 intent만 내고, runtime이 schema/거리/대상/turn/busy 상태를 검증해야 한다.

테스트는 `/Users/naem1023/git/mineflayer-chatgpt/src/bot/actions.test.ts`가 핵심이다. unknown action, chat, alias, missing param, stash 위치 없음, thrown error를 문자열 result로 안정화하는지 확인한다. `/probe`도 mineflayer 없이 action router 단위 테스트를 먼저 둘 수 있다.

### Team bulletin

`/Users/naem1023/git/mineflayer-chatgpt/src/bot/bulletin.ts`는 같은 Node process 안의 module singleton Map으로 bot status를 공유한다. 각 bot은 action 후 자신의 `name`, `action`, `position`, `thought`, `health`, `food`, `timestamp`를 갱신하고, 다른 bot의 상태는 `TEAM STATUS (live)`로 prompt context에 주입된다.

이건 social multi-bot probe에 매우 유용하다. `/probe`에서는 health/food보다 `actor`, `lastUtterance`, `busyUntil`, `currentIntent`, `position`, `lastToolResult` 정도만 공유하면 된다. stale 표시도 그대로 쓸 만하다.

### role별 action과 social behavior

`/Users/naem1023/git/mineflayer-chatgpt/src/bot/role.ts`는 Atlas, Flora, Forge, Mason, Blade에 다른 personality, role, allowedActions, allowedSkills, priorities를 준다. social behavior는 깊은 시뮬레이션보다 “서로 다른 prompt constraints + team bulletin”으로 만든다.

현재 `/probe`에는 복잡한 직업 체계가 필요 없다. 대신 `npc_a`는 질문자/요청자, `npc_b`는 응답자/작업중 NPC 정도로 role을 나누고, allowed tools를 다르게 제한하면 된다. 예: `npc_a`는 `observe`, `move_to`, `say`, `wait`, `remember`; `npc_b`는 `observe`, `say`, `wait`, `remember`, `set_busy`.

### 실패 blacklist와 memory

`/Users/naem1023/git/mineflayer-chatgpt/src/bot/memory.ts`는 구조물, death, ore, skill history, lesson, brokenSkillNames를 JSON에 저장한다. 중요한 부분은 실패를 두 종류로 나눈다는 점이다.

- precondition failure: 재료 없음, 물 없음, 나무 없음처럼 상황이 바뀌면 다시 가능
- real failure: skill 자체가 계속 깨지는 경우

`/Users/naem1023/git/mineflayer-chatgpt/src/bot/brain.ts`는 `recentFailures`와 `failureCounts`로 최근 실패 action을 막고, 성공이 쌓이면 일부를 만료한다. `/Users/naem1023/git/mineflayer-chatgpt/src/bot/memory.test.ts`는 precondition failure가 broken skill로 계산되지 않는지, static skill은 reload 때 heal되는지 테스트한다.

`/probe`에는 장기 skill memory까지 필요 없지만, “방금 막힌 action을 바로 반복하지 않기”는 반드시 필요하다. 예: `say:npc_b`가 `target_busy`로 막히면 다음 step에서는 `wait` 또는 `rephrase`만 허용하고, 같은 `say` 재시도는 1턴 막는다.

### built-in skills와 Voyager seed skills

`/Users/naem1023/git/mineflayer-chatgpt/src/skills/registry.ts`는 `build_house`, `craft_gear`, `light_area`, `build_farm`, `strip_mine`, `smelt_ores`, `go_fishing`, `build_bridge`, `setup_stash`를 등록한다. `Skill` interface는 `/Users/naem1023/git/mineflayer-chatgpt/src/skills/types.ts`에 있고, `estimateMaterials()`와 `execute()`를 분리한다.

정적 skill들은 LLM 없이 실행되는 긴 macro다. 예를 들어 `/Users/naem1023/git/mineflayer-chatgpt/src/skills/build-farm.ts`는 물을 찾고, seed를 모으고, till/plant까지 deterministic하게 실행한다. `/Users/naem1023/git/mineflayer-chatgpt/src/skills/build-house.ts`는 blueprint 기반으로 집을 짓고 memory에 위치를 기록한다.

반면 `/Users/naem1023/git/mineflayer-chatgpt/skills/voyager/*.js`는 포팅된 seed skill이다. `craftWoodenPickaxe.js`, `mineFiveIronOres.js`, `smeltFiveRawIron.js`, `collectBamboo.js`, `killFourSheep.js` 같은 파일은 Voyager helper 전제를 갖는다. `/Users/naem1023/git/mineflayer-chatgpt/src/skills/dynamic-loader.ts`는 이 JS를 `vm`에서 실행하고, `mineBlock`, `craftItem`, `smeltItem`, `killMob`, `exploreUntil` 같은 primitive shim을 넣는다.

이 부분은 현재 repo에는 반영하지 않는 편이 좋다. 파일 자체도 “trusted source만 load해야 한다”고 주석으로 경고한다. 현재 workspace의 핵심 원칙은 LLM-generated JS eval loop를 피하는 것이므로, seed skill은 action vocabulary와 missing-precondition message 설계 참고 정도로만 쓰는 게 맞다.

## 테스트에서 얻은 힌트

`/Users/naem1023/git/mineflayer-chatgpt/src/bot/perception.test.ts`는 world context를 문자열로 만드는 함수도 mock bot으로 충분히 검증할 수 있음을 보여준다. nearby entity, player 제외, water warning, hunger/health warning 등이 모두 deterministic test다.

`/Users/naem1023/git/mineflayer-chatgpt/src/llm/index.test.ts`는 LLM JSON 파싱을 별도 테스트한다. markdown fence, `<think>` 제거, alias normalization, malformed `invoke_skill`, top-level param hoist를 검증한다. `/probe`도 provider 응답 parser를 mineflayer 없이 테스트해야 한다.

`/Users/naem1023/git/mineflayer-chatgpt/src/skills/dynamic-loader.test.ts`와 `generator.test.ts`는 동적 skill 시스템을 테스트하지만, 이 repo에는 이 방향을 가져오면 안 된다. 다만 “registry에 등록된 callable만 실행한다”는 원칙은 그대로 유용하다.

## 이 repo에 반영할 점

1. `/probe` brain은 event queue로 시작한다. 최소 이벤트는 `start`, `tool_result`, `chat_received`, `idle_timeout`, `blocked`면 충분하다. priority는 `blocked/tool_result > chat_received > idle_timeout` 정도로 둔다.

2. provider prompt를 처음부터 하나로 만들지 말고 `strategic`과 `critic`으로 분리한다. `strategic`은 다음 allowed tool call과 utterance를 고르고, `critic`은 직전 result가 성공/blocked/unavailable인지 보고 다음 step을 계속할지 재계획할지만 판단한다.

3. `/probe` action registry는 작게 유지한다. 첫 버전은 `observe`, `move_to`, `say`, `wait`, `remember`만 둔다. 각 action은 LLM 문자열을 직접 실행하지 말고 typed schema 검증 후 mineflayer wrapper가 실행한다.

4. `say`는 social runtime action으로 별도 검증한다. 대상 actor가 없거나, 거리 밖이거나, `busyUntil`이 남아 있으면 `blocked` result를 반환한다. 이 result가 다음 prompt에 들어가야 한다.

5. team bulletin을 `/probe`에 작게 넣는다. shape는 `{ actorId, position, busyUntil, lastIntent, lastUtterance, lastToolResult, updatedAt }` 정도면 충분하다. prompt에는 자기 자신을 제외한 stale-aware 요약만 넣는다.

6. role config는 과하게 만들지 않는다. `npc_a`와 `npc_b`의 personality, allowedTools, initialBusyState 정도만 둔다. role별 action 제한은 multi-bot social behavior를 만드는 가장 싼 방법이다.

7. failure blacklist는 short-lived로 구현한다. 예: `{ key: "say:npc_b", reason: "target_busy", expiresAfterSteps: 1 }`. 같은 실패 action을 즉시 반복하지 않게 하는 정도가 첫 proof에는 충분하다.

8. memory는 장기 파일 저장보다 transcript-local memory로 시작한다. `remember(note)`는 현재 run artifact에만 쌓고, 다음 prompt의 `memory` 배열에 넣는다. persistent memory는 proof 이후로 미룬다.

9. 테스트는 Detroit-style로 작게 둔다. mineflayer 서버를 띄우기 전에도 action router, provider response parser, bulletin formatting, blocked-result-to-next-action 흐름은 mock으로 검증할 수 있다.

10. Voyager seed skill은 가져오지 않는다. 대신 그 파일들의 교훈, 즉 “precondition failure message가 다음 행동을 구체적으로 안내해야 한다”는 점만 반영한다. 예: `target_busy`는 “wait 20 ticks or ask later”처럼 다음 valid tool을 안내해야 한다.

## 결론

`mineflayer-chatgpt`에서 가장 쓸 만한 것은 큰 skill library가 아니라 runtime 구조다. `/probe`는 이 repo의 `BotBrain`을 아주 작게 줄인 형태로 시작하고, `executeAction`의 문자열 router 대신 typed tool registry를 두는 것이 좋다. social multi-bot behavior는 복잡한 society simulation보다 `role config + team bulletin + blocked result + critic prompt` 조합으로 먼저 증명할 수 있다.
