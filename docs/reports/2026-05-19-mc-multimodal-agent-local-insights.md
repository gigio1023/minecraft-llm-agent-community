# mc-multimodal-agent 로컬 구현 인사이트

조사 대상: `/Users/naem1023/git/mc-multimodal-agent`

목적: 이 repo의 headless `/probe`와 live NPC dialogue loop를 키울 때 참고할 만한 실제 구현 패턴을 추리는 것. 웹 요약이 아니라 로컬 구현과 테스트를 기준으로 정리했다.

## 핵심 요약

`mc-multimodal-agent`는 Voyager식 코드 생성보다 "런타임이 소유한 도구 루프"에 가깝다. 모델은 구조화된 action JSON 또는 tool call을 고르고, 런타임은 도구 스키마, 실행, 관찰, 반복 감지, 체크포인트, 메모리, 스킬 기록을 관리한다.

이 repo의 현재 `/probe` 방향과 가장 잘 맞는 교훈은 세 가지다.

- 액션 도구 실행 뒤 결과에 `post_tool_state`와 새 관찰을 붙여 다음 턴이 같은 행동을 반복하지 않게 한다.
- 스킬은 코드 덩어리보다 `{ tool, arguments }`의 순서 있는 atomic trace와 성공 기준으로 저장한다.
- 장기 구조는 처음부터 크게 만들지 말고, `transcript -> memory -> goal/task -> skill` 순서로 계층을 얇게 쌓는다.

## AgentLoop: 도구 루프와 post-tool observation

핵심 파일은 `/Users/naem1023/git/mc-multimodal-agent/src/agent/AgentLoop.ts`다.

좋은 점은 도구 실행 결과를 단순 문자열로 끝내지 않는다는 것이다. `AUTO_OBSERVE_AFTER_TOOLS`에 포함된 이동, 대기, 채굴, 배치, 전투, 제작, 스킬 실행 도구 뒤에는 `enrichActionToolResult()`가 실행되고, 결과 text/content/data에 다음 상태를 붙인다.

- 상태: `ctx.bot.statusSummary()`
- 네비게이션: `ctx.bot.navigationStatus()`
- 시각 관찰: `vision.capture()` 결과
- 구조 데이터: `data.postToolState`

관련 구현: `/Users/naem1023/git/mc-multimodal-agent/src/agent/AgentLoop.ts`

이 패턴은 현재 `/probe/src/mutual/runLiveDialogueProbe.ts`의 `lastResults`보다 한 단계 유용하다. 지금은 `{ tool, status }`만 다음 actor context에 들어가므로, 모델이 "왜 실패/성공했는지"를 world state와 함께 해석하기 어렵다.

## Tool-loop schema

모델 출력 계약은 `/Users/naem1023/git/mc-multimodal-agent/src/openai/ModelProvider.ts`에 있다.

`AGENT_TURN_SCHEMA`는 다음 세 가지 action만 허용한다.

- `tool_call`: 단일 도구
- `tool_calls`: 결과를 기다릴 필요 없는 ordered batch
- `final`: 종료 답변

중요한 점은 도구 선택을 prose로 말하게 하지 않고 `tool_name`, `arguments_json`, `tool_calls`, `final_text`로 고정한다는 것이다. `structuredInstructions()`도 "뒤 도구가 앞 결과를 읽을 필요가 없을 때만 batch"라고 명시한다.

현재 `/probe/src/mutual/dialogueContext.ts`는 `oneToolPerTurn` 규칙을 잘 갖고 있다. 다만 provider 출력 쪽은 `Proposal` 타입과 validation에 의존하므로, 다음 단계에서는 JSON Schema 또는 최소한 엄격한 parser error 분류를 붙이는 것이 좋다.

## 도구 레지스트리와 결과 계약

도구 레지스트리는 작다. `/Users/naem1023/git/mc-multimodal-agent/src/tools/ToolRegistry.ts`는 도구 정의를 OpenAI function schema 형태로 내보내고, 실행 실패를 `{ ok: false, text }`로 표준화한다.

공통 결과 타입은 `/Users/naem1023/git/mc-multimodal-agent/src/types.ts`의 `ToolResult`다.

- `ok: boolean`
- `text: string`
- `data?: JsonValue`
- `content?: text/image`

현재 `/probe/src/mutual/tools/index.ts`는 도구별 result에 `status` 문자열을 요구한다. 이 단순함은 좋지만, live loop가 커지면 `status`만으로는 실패 분석과 anti-repeat가 약하다. `ok/text/data`와 `status`를 함께 쓰는 작은 표준 결과 타입이 적당하다.

## Anti-repeat behavior

반복 감지는 `/Users/naem1023/git/mc-multimodal-agent/src/agent/toolLoopDetection.ts`에 있다.

도구 이름과 arguments를 digest로 해시하고, 같은 args와 같은 result가 반복되면 warning/critical을 만든다. 기본값은 history 30, warning 8, critical 16이다. `AgentLoop`는 critical이면 도구를 실제 실행하지 않고 "Stop retrying and choose a different plan"을 tool result로 반환한 뒤 멈춘다.

테스트는 `/Users/naem1023/git/mc-multimodal-agent/test/tool-loop.test.ts`가 같은 `observe {}` 반복을 경고로 검증한다.

현재 `/probe/src/mutual/mutualLoop.ts`는 대화 턴 수와 이동 타이밍은 잘 제한하지만, 동일 도구/동일 args 반복 자체는 감지하지 않는다. NPC dialogue에서는 같은 `converse`를 반복하는 것보다 같은 `wait`, `observe_world`, 실패한 `move_to` 반복이 더 위험하다.

## Skill recording format

스킬 저장은 `/Users/naem1023/git/mc-multimodal-agent/src/skills/SkillLibrary.ts`가 담당한다.

스킬은 다음 필드를 가진다.

- `name`, `description`, `trigger`
- `steps: JsonValue[]`
- `tags`, `scope`
- `preconditions`
- `successCriteria`
- `failureModes`
- `attempts`, `successes`
- `jsonPath`, `mdPath`

저장 시 JSON과 Markdown을 같이 쓴다. Markdown은 사람이 읽기 좋은 요약이고, JSON은 런타임 replay용이다. `renderMarkdown()`은 각 step을 `tool`과 `arguments`로 렌더링한다.

`AgentLoop.maybeRecordSkill()`도 참고할 만하다. 완료된 작업의 tool trace를 보고, 충분한 action step이 있고 meta/memory/goal 도구가 섞이지 않았을 때만 자동 스킬 초안을 만든다. 특히 `execute_steps` 성공을 nested skill로 저장하지 않고 expanded atomic steps로 저장하려는 규칙이 좋다.

테스트: `/Users/naem1023/git/mc-multimodal-agent/test/skills.test.ts`

## Memory layers

메모리 구현은 `/Users/naem1023/git/mc-multimodal-agent/src/memory/MemoryStore.ts`와 `/Users/naem1023/git/mc-multimodal-agent/src/memory/TranscriptStore.ts`다.

`MemoryStore`는 LevelDB 기반이며 `kind`와 `layer`를 분리한다.

- kind: `fact`, `lesson`, `failure`, `goal`, `environment`
- layer: `episodic`, `semantic`, `procedural`, `working`
- source: `agent`, `player`, `system`, `flush`, `migration`

검색은 token index와 recent fallback을 섞고, semantic/procedural과 importance에 점수를 더 준다. transcript가 커지면 `latestCompaction`과 `addCompaction()`으로 요약을 보존한다.

`TranscriptStore`는 JSONL append와 최근 transcript render만 담당한다. 이 분리가 좋다. transcript는 원장, memory는 재사용 지식이다.

테스트: `/Users/naem1023/git/mc-multimodal-agent/test/memory-store.test.ts`

현재 `/probe/src/runtime/memory.ts`는 단순 ring buffer다. 첫 proof에는 충분하지만, live NPC 대화가 길어지면 최소한 `working`과 `episodic`을 분리하는 것이 좋다.

## Goal/task planning

목표 트리는 `/Users/naem1023/git/mc-multimodal-agent/src/goals/GoalStore.ts`가 담당한다.

각 goal은 `status`, `priority`, `successCriteria`, `blockers`, `notes`, `verification`을 가진다. `next()`는 running/pending 중 우선순위와 order로 다음 작업을 고른다. `goal_update`가 blocked/failed를 memory에도 적어 반복 실패를 줄이는 점이 실용적이다.

테스트: `/Users/naem1023/git/mc-multimodal-agent/test/goal-store.test.ts`

별도 planner 테스트 `/Users/naem1023/git/mc-multimodal-agent/test/goal-planner.test.ts`는 LLM JSON 파싱 실패 시 단일 fallback subgoal로 축소한다. 이 repo의 `/probe`에는 아직 goal tree가 필요 없지만, "대화 후 이동/아이템 전달" 같은 2-3단계 목표에는 `successCriteria`와 `blockers`만 먼저 가져오면 충분하다.

## Craft/material planner

제작 계획은 `/Users/naem1023/git/mc-multimodal-agent/src/bot/CraftPlanner.ts`가 담당한다.

`planCraft()`는 inventory를 소비 시뮬레이션하면서 `have`, `craft`, `smelt`, `gather`, `missing` step을 만든다. recursion depth, max steps, cycle fallback, crafting table/furnace requirement를 같이 반환한다.

테스트: `/Users/naem1023/git/mc-multimodal-agent/test/craft-planner.test.ts`

재료 계획은 `/Users/naem1023/git/mc-multimodal-agent/src/planning/MaterialPlanner.ts`다. blueprint 또는 preset 요구량을 inventory와 비교하고, wood 계열은 plank-equivalent로 정규화한다.

테스트: `/Users/naem1023/git/mc-multimodal-agent/test/material-planner.test.ts`

현재 `/probe` 목표는 대화 proof이므로 crafting은 지금 넣지 않는 편이 맞다. 다만 나중에 NPC가 "marker item을 준비/전달"하는 과제로 넘어갈 때 `plan -> execute -> verify` 결과 형태를 참고할 수 있다.

## Modular hierarchy

구조적으로는 다음 계층이 보인다.

1. `ModelProvider`: provider API 차이와 structured output parsing을 감춘다.
2. `AgentLoop`: segment, tool budget, retry, checkpoint, transcript, memory를 묶는다.
3. `ToolRegistry`: 도구 schema와 실행을 한 곳에서 관리한다.
4. `MemoryStore`, `TranscriptStore`, `GoalStore`, `SkillLibrary`: 런타임 상태를 각각 독립 저장소로 둔다.
5. Planner류: craft/material/goal처럼 LLM 없이 deterministic하게 줄일 수 있는 계획은 별도 pure module로 뺀다.

이 repo의 방향과 맞는 점은 "큰 society runtime"이 아니라 작은 런타임 계층을 하나씩 얹는 방식이다.

## 이 repo에 반영할 점

`/probe`에는 아래 순서로 작게 반영하는 것이 좋다.

1. `probe/src/mutual/types.ts` 또는 새 `toolResult.ts`에 표준 결과 타입을 둔다.
   - 예: `{ ok: boolean; status: string; text: string; data?: JsonValue }`
   - 기존 transcript의 `result.status`는 유지하되, `text`와 `data`를 추가한다.

2. `runLiveDialogueProbe`의 `lastResults`를 확장한다.
   - 지금: `{ tool, status }`
   - 제안: `{ tool, ok, status, text, observationAfter? }`
   - `executeMutualTool` 뒤에 현재 위치, visible actors, heard messages, recent utterances를 얇게 붙인다.

3. post-tool observation은 모든 도구가 아니라 action 도구에만 붙인다.
   - 대상: `move_to`, `wait`, `converse`, `drop_item`
   - `observe_world`와 `remember`에는 불필요하게 새 관찰을 중복하지 않는다.

4. anti-repeat는 최소 구현으로 시작한다.
   - actor별 최근 8개 `{ tool, argsHash, resultStatus }`만 보관한다.
   - 같은 actor가 같은 args로 같은 실패를 2-3회 반복하면 provider context에 warning을 넣고, 4회면 run을 실패시킨다.
   - 첫 구현은 LevelDB 없이 메모리 Map으로 충분하다.

5. memory는 당장 DB로 가지 말고 layer만 추가한다.
   - `createMemory()`를 `{ layer, kind, text, tags? }` note 배열로 바꾼다.
   - live prompt에는 `working`과 최근 `episodic`만 넣는다.
   - transcript는 계속 evidence 원장으로 유지한다.

6. 스킬은 "generated TypeScript skill" 전에 atomic trace 저장부터 한다.
   - 성공한 대화/이동 절차를 `build/generated-skills/*.json`에 `{ name, trigger, scope, steps, successCriteria }`로 저장한다.
   - replay는 나중에 붙인다.
   - raw code skill은 현재 repo의 non-goal과 충돌하므로, 먼저 trace skill이 안전하다.

7. goal tree는 아주 작게만 도입한다.
   - live dialogue의 목표를 `conversation`, `handoff/move`, `remember` 세 subgoal 정도로 표현한다.
   - 각 subgoal은 `successCriteria`, `status`, `blockers`, `verification`만 있으면 충분하다.

8. `execute_steps`는 아직 도입하지 않는다.
   - 현재 live dialogue는 one-tool-per-turn이 acceptance criteria와 잘 맞다.
   - 나중에 deterministic non-dialogue sequence가 필요할 때만 bounded `execute_steps`를 추가한다.

## 주의할 점

`mc-multimodal-agent`의 범위는 이미 크다. 이 repo에 그대로 가져오면 첫 proof가 다시 무거워진다. 특히 combat, blueprint, subagent, web search, modded window workflow는 지금 `/probe`에 넣지 않는 것이 맞다.

가져올 것은 기능 목록이 아니라 계약이다.

- 도구 결과는 다음 판단에 충분한 상태를 포함한다.
- 반복 실패는 런타임이 감지한다.
- 스킬은 재현 가능한 atomic trace로 기록한다.
- transcript와 memory를 분리한다.
- goal은 성공 기준과 blocker 중심으로 작게 둔다.
