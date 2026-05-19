# mindcraft-ce 로컬 구현 인사이트

조사 대상: `/Users/naem1023/git/mindcraft-ce`

이 문서는 웹 요약이 아니라 로컬 구현을 기준으로, 현재 repo의 작은 headless Minecraft LLM agent `/probe`에 반영할 만한 점만 추린 메모다.

## 전체 판단

`mindcraft-ce`는 “LLM이 대화 중 명령을 고르고, 필요하면 코드를 생성해 실행하며, task benchmark로 평가하는” 큰 시스템이다. 현재 repo의 목표인 `observe -> allowed tool -> validated result -> transcript` 루프와 방향은 일부만 겹친다.

가져올 핵심은 프레임워크가 아니라 운영 규칙이다. 특히 실행 중인 행동을 중단하는 방식, world query와 action helper를 분리한 방식, 긴 대화를 요약하는 방식, 협업 task의 validation 구조는 참고 가치가 있다. 반대로 generated JS 실행, 방대한 command surface, benchmark/evaluation/tmux 흐름은 `/probe` 첫 단계에는 너무 무겁다.

## ActionManager: 타임아웃과 인터럽트

`/Users/naem1023/git/mindcraft-ce/src/agent/action_manager.js`는 모든 장기 행동을 `runAction(actionLabel, actionFn, { timeout, resume })`로 감싼다. 실행 전 기존 action을 `stop()`으로 끊고, `requestInterrupt()`를 반복 호출해 digging, collectBlock, pathfinder, pvp를 멈춘다. `bot.interrupt_code`를 helper 루프들이 주기적으로 확인하는 구조도 중요하다.

참고할 점:

- action마다 `actionLabel`을 남긴다. 이 값은 상태 관찰과 대화 지연 판단에 재사용된다.
- 동시에 두 action이 실행되지 않게 `executing` gate를 둔다.
- timeout은 action 바깥에서 관리하고, timeout 발생 시 interrupt 후 history에 기록한다.
- 너무 빠른 resume 반복은 infinite loop 징후로 보고 중단한다.

주의할 점:

- `timedout`이 action 시작마다 명확히 reset되지 않아 이전 timeout 상태가 남을 여지가 있다.
- timeout 단위가 분 단위이고 기본 action surface가 커서 `/probe`에는 과하다.
- `cleanKill()`로 process 종료하는 회복 방식은 작은 probe에서는 transcript를 망칠 수 있다. 종료보다 `ToolResult{ status: "timeout" }`로 되돌리는 편이 낫다.

## skill/world helper split

`/Users/naem1023/git/mindcraft-ce/src/agent/library/world.js`는 관찰 전용 helper에 가깝고, `skills.js`는 world mutation/action helper다. 예를 들어 `world.getInventoryCounts()`, `world.getNearbyPlayers()`, `world.getNearestBlock()`은 상태 조회를 맡고, `skills.goToPosition()`, `skills.giveToPlayer()`, `skills.wait()`, `skills.placeBlock()`은 행동을 수행한다.

이 분리는 `/probe`에도 그대로 유효하다. 다만 `mindcraft-ce`의 `skills.js`는 2천 줄이 넘고 mining, crafting, combat, chest, villager trade, construction까지 포함한다. 복사 대상이 아니라 “관찰 helper와 mutation helper를 섞지 않는다”는 원칙만 가져오는 편이 맞다.

`/Users/naem1023/git/mindcraft-ce/src/agent/library/full_state.js`도 좋은 참고다. position, gameplay, action, surroundings, inventory, nearby, modes를 하나의 structured state로 만든다. `/probe`의 `observe()`도 문자열보다 구조화된 JSON을 먼저 만들고, LLM prompt에는 그중 필요한 필드만 줄이는 쪽이 좋다.

## history compaction

`/Users/naem1023/git/mindcraft-ce/src/agent/history.js`는 최근 turn을 유지하다가 `settings.max_messages`를 넘으면 앞쪽 `summary_chunk_size`만큼 잘라 `promptMemSaving()`으로 자연어 memory를 갱신한다. 잘린 chunk는 full history file에 append한다.

가져올 점:

- active context와 full transcript를 분리한다.
- 오래된 대화는 요약 memory로 압축한다.
- history 저장에는 `turns`, `memory`, task start, last sender 같은 재시작 정보를 같이 둔다.

바꿀 점:

- `/probe`의 첫 단계에서는 LLM memory summarization까지 필요 없다.
- 대신 `recentEvents`는 마지막 N개만 prompt에 넣고, 전체 event log/transcript는 파일에 전부 남긴다.
- memory는 자연어 하나보다 `notes: string[]` 또는 `remember(note)` 결과 목록으로 작게 시작하는 편이 좋다.

## generated code safety

`/Users/naem1023/git/mindcraft-ce/src/agent/coder.js`는 `!newAction`을 통해 LLM-generated JS를 만들고, ESLint와 skill doc 검사를 거친 뒤 SES compartment처럼 보이는 `makeCompartment()`에서 실행한다. 또한 generated code 곳곳에 `if(bot.interrupt_code)` 체크를 삽입한다.

이 구현은 안전장치를 많이 넣었지만 현재 repo의 방향과는 맞지 않는다. `/Users/naem1023/git/mindcraft-ce/docs/minecollab.md`도 construction task 실행에는 `--insecure_coding`을 켜라고 설명하고, Docker 사용을 강하게 권한다. 즉 이 방식은 강력하지만 작은 NPC dialogue probe의 기본 runtime으로 삼으면 안 된다.

반영할 결론:

- generated JS 실행은 복사하지 않는다.
- LLM 출력은 tool schema를 따르는 JSON proposal로 제한한다.
- runtime이 `move_to`, `say`, `wait`, `remember`, `inspect_*`만 실행한다.
- tool 실패도 prompt retry가 아니라 structured result로 다음 step에 제공한다.

## Task system과 평가

`/Users/naem1023/git/mindcraft-ce/src/agent/tasks/tasks.js`는 task data를 읽어 초기 inventory, blocked actions, timeout, validator, initial conversation, bot teleport를 한 번에 다룬다. cooking/crafting은 inventory presence로 성공을 판단하고, construction은 blueprint mismatch score로 평가한다.

좋은 점:

- task definition에 `goal`, `conversation`, `initial_inventory`, `agent_count`, `target`, `timeout`, `blocked_actions`가 들어간다.
- validator를 task type별로 분리한다.
- timeout과 missing agents를 task failure로 명시한다.
- multi-agent task에서는 agent별 initial inventory와 blocked action을 다르게 줄 수 있다.

과한 점:

- `/clear`, `/give`, `/tp`, `/fill`, `/setblock` 같은 cheat command orchestration이 task init에 깊게 섞여 있다.
- cooking world 생성과 construction blueprint benchmark는 `/probe` 첫 단계에 불필요하다.
- file-based progress manager는 Hell's Kitchen 전용 예외가 섞여 있어 일반 설계로 가져오면 복잡도가 올라간다.

## NPC와 multi-agent collaboration

`/Users/naem1023/git/mindcraft-ce/src/agent/conversation.js`가 multi-agent 협업에서 가장 참고할 만하다. 동시에 하나의 active conversation만 유지하고, 상대가 busy인지와 내가 busy인지에 따라 응답 지연을 조절한다. 메시지는 queue에 모았다가 합쳐 처리하고, 응답 대기 시간이 길어지면 system message로 “상대가 응답하지 않았다”고 agent에게 알려준다.

구체적으로 참고할 규칙:

- 다른 bot과 대화 중이면 새 bot에게 “나 지금 다른 사람과 대화 중”이라고 거절한다.
- `awaiting_response`와 `wait_time_limit`로 응답 지연을 명시한다.
- busy action 중에도 `stay`, `followPlayer`, `mode:` 같은 일부 action은 말 위에 말할 수 있게 예외를 둔다.
- `(FROM OTHER BOT)` 태그를 붙여 LLM이 발화 출처를 혼동하지 않게 한다.

`/Users/naem1023/git/mindcraft-ce/src/agent/npc/controller.js`, `item_goal.js`, `build_goal.js`는 독립 NPC routine과 item/build goal planner에 가깝다. `/probe`에는 아직 이 수준의 autonomous routine이 필요 없다. 다만 idle event 후 약간 기다렸다가 행동하는 규칙과, goal execution을 작은 step으로 쪼개는 방식은 참고할 수 있다.

## 모델/프롬프트 사용

`/Users/naem1023/git/mindcraft-ce/src/models/prompter.js`는 chat, code, vision, embedding model을 분리하고 profile prompt placeholder를 치환한다. `$STATS`, `$INVENTORY`, `$COMMAND_DOCS`, `$CODE_DOCS`, `$MEMORY`, `$CONVO` 같은 placeholder가 있고, prompt log 저장도 지원한다.

현재 repo에는 이 정도 profile system이 필요 없다. 하지만 provider boundary는 분리해야 한다. `/probe`는 model별 adapter보다 먼저 `AgentProposal` interface를 고정하고, fake provider가 같은 interface를 반환하게 두는 편이 맞다.

## 너무 무거워서 복사하지 말 것

- `/Users/naem1023/git/mindcraft-ce/src/agent/coder.js`의 generated JS loop.
- `/Users/naem1023/git/mindcraft-ce/src/agent/library/skill_library.js`의 embedding 기반 skill doc retrieval.
- `/Users/naem1023/git/mindcraft-ce/src/agent/tasks/cooking_tasks.js`의 대형 cooking world 생성.
- `/Users/naem1023/git/mindcraft-ce/src/agent/tasks/construction_tasks.js`의 blueprint/procedural generation 전체.
- `/Users/naem1023/git/mindcraft-ce/src/agent/commands/actions.js`의 광범위 command list.
- `docs/minecollab.md`의 tmux/evaluation/parallel worlds 흐름.

이 repo의 첫 proof는 benchmark platform이 아니라 NPC dialogue/tool-loop probe다.

## 이 repo에 반영할 점

`/probe`에는 다음 정도만 작게 반영한다.

1. `ActionRunner`를 둔다.
   - `run(label, fn, timeoutMs)`만 제공한다.
   - 현재 실행 중인 tool이 있으면 새 tool을 거절하거나 cancel 후 시작하는 정책을 명시한다.
   - `AbortController` 또는 공유 `interrupted` flag를 모든 장기 tool helper가 확인한다.
   - 결과는 항상 `{ ok, status, message, durationMs }`로 transcript에 남긴다.

2. `observeWorld`와 `tools`를 분리한다.
   - `observeWorld(bot)`은 position, nearby actors, current action, recent chat, inventory summary만 반환한다.
   - `tools/moveToActor`, `tools/say`, `tools/wait`, `tools/remember`는 상태 변경만 맡는다.
   - 첫 probe에는 crafting, mining, combat, chest, villager trade를 넣지 않는다.

3. history는 LLM memory보다 event ledger로 시작한다.
   - prompt에는 최근 5~10 event만 넣는다.
   - 전체 transcript는 `data/evidence`에 모두 기록한다.
   - `remember(note)`만 별도 short memory 배열에 쌓는다.

4. multi-agent 대화에는 busy/available gate를 넣는다.
   - actor별 `busyUntil` 또는 `currentAction`을 관찰에 포함한다.
   - `say(target, text)`는 target이 busy이면 `blocked_busy`를 반환한다.
   - LLM은 그 결과를 보고 `wait` 또는 짧은 재시도를 선택하게 한다.
   - 한 번에 하나의 active peer conversation만 허용한다.

5. task는 benchmark가 아니라 scenario spec으로 둔다.
   - 예: `npc_a wants answer from npc_b`, `npc_b starts busy for 2 turns`.
   - success는 “3회 이상 observe/tool/result 반복”, “blocked result 이후 다른 action 선택”, “transcript 저장” 정도로 검증한다.
   - inventory/cooking/construction validation은 나중에 별도 task type으로 추가한다.

6. generated code는 금지한다.
   - LLM 출력은 `AgentProposal` JSON만 허용한다.
   - tool 이름과 args는 runtime schema로 검증한다.
   - unknown tool, invalid args, timeout, unreachable target은 모두 structured failure로 돌려준다.

## 한 줄 결론

`mindcraft-ce`에서 가져올 것은 “큰 agent framework”가 아니라 action 실행 계약, 관찰/action helper 분리, 짧은 history 운영, busy-aware bot conversation 규칙이다. `/probe`는 이 네 가지만 작게 구현하고, generated code와 benchmark task stack은 의도적으로 배제해야 한다.
