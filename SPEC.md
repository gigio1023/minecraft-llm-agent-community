# SPEC

작성 기준 시점: 2026-05-20

## 1. 목표

이 레포의 다음 큰 목표는 단순한 headless probe를 넘어서, Minecraft 안에서
 "살아 숨쉬는 페르소나를 가진 사람처럼 보이는 NPC 사회"의 최소 유효 버전을
 만드는 것이다.

하지만 이 목표는 persona prompt를 더 쓰는 것으로 달성되지 않는다. 다음 세 축이
 동시에 맞아야 한다.

1. Minecraft를 숙련된 플레이어처럼 다루는 gameplay competence
2. 역할, 자원, 저장소, 위험, 의무를 기반으로 한 social pressure
3. 긴 시뮬레이션을 버티는 transcript, memory, compaction architecture

## 2. 핵심 판단

### 지금까지 실패한 이유

기존 실패는 모델이 멍청해서가 아니라 runtime이 Minecraft를 실제 게임처럼 주지
 않았기 때문이다.

주요 원인:

- concrete curriculum 부재
- trusted gameplay primitives 부재
- seed skill이 social/visibility 위주였고 survival progression 위주가 아님
- shared storage, obligations, scarcity 같은 사회 압력이 없음
- post-action refresh와 anti-repeat policy가 약함
- 긴 세션을 버틸 메시지/메모리 관리 구조가 아직 없음

### 새로운 방향

다음 단계의 중심 질문은 다음이다.

> 어떻게 하면 NPC가 Minecraft 안에서 실제 플레이어처럼 자원을 모으고,
> 제작하고, 저장하고, 역할을 나누고, 서로 돕거나 제한적으로 적대하면서,
> 장기적으로도 일관된 기억과 행동을 유지할 수 있는가?

### 현재 branch-local 설계 묶음

이번 branch의 pressure/intent/lifecycle 확장 설계는 아래 문서 묶음에서
유지한다.

- `docs/plans/2026-05-20-pressure-intent-lifecycle/README.md`
- `docs/plans/2026-05-20-pressure-intent-lifecycle/architecture.md`
- `docs/plans/2026-05-20-pressure-intent-lifecycle/implementation-phases.md`
- `docs/plans/2026-05-20-pressure-intent-lifecycle/pressure-data-model.md`

`SPEC.md`는 canonical 방향만 유지하고, branch-local 상세 설계는 위 문서
묶음에 쌓는다.

## 3. 리서치 결론 요약

### Voyager에서 가져올 것

- one-task-at-a-time curriculum
- trusted gameplay primitives
- early-game progression seed skills
- task verification
- chest/world memory

### mc-multimodal-agent에서 가져올 것

- post-action refresh
- layered memory
- goal/blocker tracking
- craft/material planner
- loop detection

### mineflayer-chatgpt에서 가져올 것

- event-driven multi-bot brain
- role restrictions
- team bulletin
- per-bot failure memory
- shared stash cooperation
- one bounded combat-capable role

### mindcraft-ce에서 가져올 것

- single active action gate
- interruption/timeout/resume policy
- compact world helper queries
- inventory-aware craft/smelt logic
- busy-aware conversation scheduling
- small survival reflexes

### opencode에서 가져올 것

- part-based transcript model
- explicit tool lifecycle records
- summary + recent raw tail compaction
- derived UI/debug timeline separate from replay state
- child-session branching

### codex에서 가져올 것

- thread-store abstraction
- append-oriented rollout persistence
- replacement-history compaction checkpoints
- turn-context baselines and diff reinjection
- mailbox delivery phases for multi-agent coordination
- separate transcript persistence from offline memory extraction

## 4. 목표 상태

목표 상태의 최소 사회는 다음과 같다.

### NPC 구성

- 3~4명의 cooperative NPC
- 1명의 bounded hostile NPC

### cooperative NPC 예시 역할

- gatherer
- crafter
- scout/forager
- guard or quartermaster

### hostile NPC 원칙

- 정확히 1명만 둔다
- 모든 NPC에게 전투 권한을 열지 않는다
- 공격/방해는 role-based, bounded, cooldown-based여야 한다
- 짧은 leash, retreat rule, engagement timeout이 있어야 한다

### 사회가 성립하는 최소 조건

- shared chest 또는 shared storage 존재
- public/private resource 구분 존재
- role별 keep-items 정책 존재
- obligations/promises 존재
- recent social ledger 존재
- scarcity or competition 존재
- busy/idle state를 반영한 대화 존재

## 5. 아키텍처 원칙

### A. Gameplay First, Persona Second

persona text는 마지막 층이다. 먼저 아래가 있어야 한다.

- bootstrap/recovery scaffold
- primitives
- seed skills
- verification
- anti-repeat
- resource/storage model

### B. Runtime Owns Reality

runtime이 반드시 소유해야 하는 것:

- world observation normalization
- tool validation
- action timeout/interruption
- inventory/craft/smelt/path checks
- shared storage ledger
- hostility bounds
- transcript persistence
- compaction and replay
- mailbox timing

LLM이 소유하는 것:

- next intent
- short plan
- intent switching and delegation
- obligation triage
- utterance style
- role-consistent prioritization

### C. Society Emerges From Material Pressure

협력과 적대는 prompt가 아니라 아래에서 나와야 한다.

- logs, cobblestone, coal, iron, food, beds, torches, chests
- workstation access
- shared stash upkeep
- crafting dependency
- scout reports
- danger around hostile entities or hostile NPC

### D. Long Runs Need Real Session Architecture

flat transcript로는 장기 시뮬레이션을 버틸 수 없다.

필수 요소:

- part-based transcript
- canonical replay history
- derived debug timeline
- explicit tool records
- compaction checkpoints
- per-agent thread store
- optional shared thread/store
- offline memory extraction

## 6. Domain Model

### 6.1 Agent Thread

각 NPC는 독립 agent thread를 가진다.

필드 예시:

- agent id
- role
- persona style
- current task
- active action
- recent events
- last observation
- last result
- private memory summary
- mailbox queue
- thread lineage

### 6.2 Shared Settlement State

shared society state는 별도 구조로 둔다.

최소 필드:

- known shared chests
- workstation registry
- settlement resources summary
- public obligations ledger
- recent major events
- danger/tension state
- hostile NPC last known state

### 6.3 Tool Transcript Part

각 tool execution은 flat text가 아니라 structured part로 남긴다.

필드 예시:

- tool name
- validated args
- start/end time
- status
- code
- message
- post-observation snapshot
- inventory diff
- position diff
- attachments/evidence refs

### 6.4 Memory Layers

#### Private episodic memory

- 최근 실제 경험
- 누가 무엇을 했는지
- 실패와 성공

#### Private procedural memory

- 이 NPC가 익힌 작업 절차
- 예: furnace restock, chest deposit

#### Shared semantic memory

- shared chest 위치
- village/forest/cave anchor
- who usually crafts what

#### Working memory

- 현재 task
- current blocker
- current promise
- next intended action

## 7. Gameplay Competence Layer

### 7.1 Bootstrap And Recovery Scaffold

초기 progression spine은 중요하지만 영구 스크립트가 되어서는 안 된다.

이 scaffold는 다음 상황에서 foreground로 올라와야 한다.

- 새 world bootstrap
- death와 gear loss 이후 recovery
- shared storage/station collapse
- severe scarcity

초기 bootstrap/recovery objective 예시:

- `Collect 4 logs`
- `Craft planks and sticks`
- `Craft crafting table`
- `Craft wooden pickaxe`
- `Mine 8 cobblestone`
- `Craft stone pickaxe`
- `Craft furnace`
- `Mine coal`
- `Smelt raw iron`
- `Inspect village chest`
- `Deposit shared materials`

이 scaffold는 LLM의 행동을 직접 강제하지 않는다. runtime은 current
world, memory, bulletin, role, recent failure를 바탕으로 pressure를
계산하고, LLM은 그 pressure 위에서 current intent를 고른다.

settlement가 안정되면 bootstrap pressure는 약해져야 한다. 반대로 death,
scarcity, gear loss, storage collapse가 오면 recovery pressure와 함께 다시
강해져야 한다.

각 bootstrap/recovery objective는 다음을 가져야 한다.

- reason
- machine-checkable success condition
- blockers
- preferred actor roles

### 7.1.1 Pressure And Intent Loop

runtime은 각 actor에 대해 compact pressure set을 계산해야 한다.

pressure 예시:

- bootstrap missing progress
- shared shortage
- blocked teammate
- public obligation due
- nearby opportunity
- hostile risk
- recovery after death

LLM은 direct next task 대신 one current intent를 선택해야 한다.

그 intent는:

- 여러 turn에 걸쳐 유지될 수 있고
- stronger interrupting pressure가 오면 교체될 수 있으며
- bounded skill/tool 집합으로만 실행되어야 한다

### 7.2 Gameplay Primitives

반드시 runtime-owned TypeScript helper로 제공한다.

초기 필수 primitives:

- `mineBlock`
- `collectLogs`
- `craftItem`
- `smeltItem`
- `exploreUntilFound`
- `collectDroppedItems`
- `inspectChest`
- `depositToSharedChest`
- `withdrawFromSharedChest`
- `equipItem`
- `attackTarget` for bounded hostile role only
- `retreatFromThreat`

### 7.3 Seed Skills

초기 curated seed skills:

1. `collectLogs`
2. `craftPlanksAndSticks`
3. `craftCraftingTable`
4. `craftWoodenPickaxe`
5. `mineCobblestone`
6. `craftStonePickaxe`
7. `craftFurnace`
8. `mineCoal`
9. `smeltRawIron`
10. `inspectSharedChest`
11. `depositSharedItems`
12. `collectDroppedItems`

추가 social seed skills:

- `approachAndRequestItem`
- `announceResourceDiscovery`
- `handoffItemAtChest`
- `waitForBusyCrafter`

bounded hostile seed skills:

- `patrolArea`
- `threatenApproach`
- `stealFromChestIfExposed`
- `attackThenRetreat`

## 8. Social Simulation Layer

### 8.1 Role Contract

각 role은 최소한 아래를 가진다.

- allowed tools
- allowed skills
- keep-items policy
- home/leash radius
- priority list
- public obligations type
- hostility policy

### 8.2 Team Bulletin

모든 cooperative NPC는 shared bulletin을 본다.

bulletin 예시 필드:

- current role status
- current task
- last successful contribution
- current blocker
- resource needs
- danger warning
- last known hostile sighting

### 8.3 Conversation Scheduler

대화는 action-independent free chat가 아니어야 한다.

필수 규칙:

- busy/idle-aware delay
- one conversation partner lock for short window
- queue and batch inbound social messages
- same-turn vs next-turn mailbox phase separation
- interrupt messages should explain why the action changed

### 8.4 Hostile NPC Policy

hostile NPC는 작은 드라마 장치이지 chaos engine이 아니다.

필수 제한:

- single hostile agent only
- explicit target selection policy
- short patrol/home radius
- engagement timeout
- retreat condition on low health or after short conflict
- theft/sabotage limited to clear resource points
- no world-spanning vendetta loops

## 9. Runtime Loop

권장 루프는 다음과 같다.

```text
observe compact world state
-> merge mailbox / bulletin / role state
-> choose one task or continue current task
-> choose one validated tool or bounded skill
-> execute through single-action gate
-> attach post-action observation and diffs
-> update private memory and shared ledger
-> run critic / verification
-> possibly compact or checkpoint
-> continue
```

### 9.1 Event-Driven Brain

loop는 constant polling보다 event-driven이 좋다.

핵심 이벤트:

- strategic tick
- reactive safety
- social message received
- action finished
- critic needed
- hostile seen
- hunger/health threshold crossed
- stash changed

### 9.2 Single Active Action Gate

항상 world action은 하나만 active여야 한다.

필수 요소:

- timeout
- interrupt
- resumable small subset only
- repeat-loop detection
- summarized result

### 9.3 Post-Action Refresh

중요 tool/skill 이후에는 runtime이 자동으로 fresh post-state를 붙인다.

필수 post-state 예시:

- position diff
- inventory diff
- nearby blocks/resources diff
- nearby actors diff
- danger diff
- task progress diff

## 10. Transcript, Replay, Compaction

### 10.1 Transcript Layers

세 층을 분리한다.

1. canonical replay transcript
2. derived debug/event timeline
3. metadata index

### 10.2 Part-Based Transcript

message/turn은 다음 같은 part를 가질 수 있다.

- observation
- task
- plan
- tool call
- tool result
- chat utterance
- reasoning summary
- world event
- memory update
- compaction marker
- checkpoint

### 10.3 Compaction Strategy

compaction은 summary-only가 아니라 replacement-history checkpoint를 남겨야 한다.

compact summary에는 최소한 다음이 필요하다.

- overall mission
- per-agent role and constraints
- shared settlement state
- key world anchors
- inventory/resource summary
- active tensions and hostilities
- unresolved blockers
- next expected actions

또한 recent raw tail을 소량 보존해야 한다.

### 10.4 Persistence Modes

두 가지 persistence mode를 둔다.

- `limited`: semantic action/result/checkpoint only
- `extended`: raw observations, traces, diagnostics, path logs 포함

## 11. Memory Extraction

hot loop와 long-term memory extraction은 분리한다.

### Hot loop memory

- bounded
- deterministic
- replay-safe

### Offline memory worker

- recurring summaries
- social pattern extraction
- trust/reputation summaries
- settlement history summaries

external/manual context가 섞였을 때는 memory trust를 낮추는 policy도 필요하다.

## 12. 제안 디렉토리 구조

```text
probe/src/
  runtime/
    loop/
    actions/
    mailbox/
    compaction/
    checkpoints/
  transcript/
    canonical/
    projectors/
    persistence/
  memory/
    private/
    shared/
    summaries/
    extraction/
  observation/
    worldHelpers/
    snapshots/
  gameplay/
    curriculum/
    primitives/
    seedSkills/
    planners/
    verification/
    storage/
  npc/
    roles/
    social/
    hostile/
  provider/
    promptCompiler/
    replayCompiler/
  server/
  cli/
```

## 13. 단계별 실행 계획

### Phase 1. Gameplay competence foundation

- bootstrap/recovery scaffold 도입
- pressure engine 도입
- intent selector 도입
- gameplay primitives 도입
- early-game seed skills 도입
- task verification 도입
- anti-repeat policy 도입

### Phase 2. Shared storage and role society

- shared chest/storage ledger
- role contracts
- keep-items policy
- team bulletin
- obligation routing
- intent-to-skill role filtering
- cooperative handoff skills

### Phase 3. Transcript and memory architecture

- per-agent thread store
- canonical replay transcript
- derived debug timeline
- compaction checkpoints
- private/shared memory separation

### Phase 4. Bounded hostile NPC

- exactly one hostile role
- patrol/leash/retreat logic
- theft/sabotage/attack policy
- tension ledger and hostile sighting memory

### Phase 5. Long-run stability

- mailbox delivery phases
- resumable action subset
- offline memory extraction
- long-run checkpoint/replay validation

## 14. 수용 기준

다음 작업의 최소 완료 기준은 아래다.

1. NPC들이 random wandering이 아니라 early-game progression bootstrap을 수행한다.
2. NPC들이 bootstrap/recovery progression을 필요할 때 수행하고, 더 강한
   shared or personal pressure가 있을 때는 이를 유연하게 뒤로 미룰 수 있다.
3. 최소 3개 이상의 cooperative role이 shared storage와 obligations를 통해 상호작용한다.
4. 1개의 hostile NPC가 bounded policy 안에서만 적대 행동을 한다.
5. 대화는 busy/idle, recent events, shared bulletin을 반영한다.
6. 각 agent는 private memory와 shared settlement state를 구분해 사용한다.
7. canonical replay transcript와 compaction checkpoint가 존재한다.
8. 긴 세션에서도 recent raw tail + compact summary 구조로 재개 가능하다.
9. transcript만 읽어도 누가 무엇을 왜 했는지 재구성 가능하다.

## 15. 당장 하지 말아야 할 것

- persona prompt만 늘리는 작업
- generated JS / eval loop 재도입
- full village/economy grand simulation부터 시작
- 모든 NPC에게 combat authority 부여
- giant monolith runner 추가
- UI/debug event stream을 canonical replay source로 쓰는 설계

## 16. 즉시 다음 구현 슬라이스 제안

현재 branch의 즉시 다음 구현 슬라이스는 아래 3단계다.

1. `pressure engine` + `lifecycle state` + `intent selector`
2. `bounded seed skills` + `intent-to-skill compiler` + `role obligation routing`
3. `memory/transcript wiring` + `bootstrap/recovery reinjection` + `checkpoint-ready lifecycle summary`

상세 설계는 `docs/plans/2026-05-20-pressure-intent-lifecycle/` 아래 문서 묶음을 기준으로 유지한다.
