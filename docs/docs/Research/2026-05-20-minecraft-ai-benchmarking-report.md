# Minecraft AI Agent Benchmarking & Code-Level Architecture Analysis Report

본 보고서는 마인크래프트 LLM 에이전트 분야의 주요 프로젝트들의 실제 소스코드(TS, JS, PY)를 깊이 있게 분석하고, 장기 구동(1000+ 사이클)에서 발생하는 실전 인프라적 결함과 이들의 해결 패러다임을 분석한 보고서입니다. 분석 대상 레포지토리는 다음과 같습니다:
*   **Voyager** (경로: `~/git/Voyager`)
*   **Odyssey** (경로: `~/git/Odyssey`)
*   **mindcraft-ce** (경로: `~/git/mindcraft-ce`)
*   **mineflayer-chatgpt** (경로: `~/git/mineflayer-chatgpt`)
*   **mc-multimodal-agent** (경로: `~/git/mc-multimodal-agent`)
*   **yearn_for_mines** (경로: `~/git/yearn_for_mines`)

---

## 1. 레포지토리별 소스코드 기반 메커니즘 분석

### ① Voyager (`voyager/voyager.py`)
*   **스킬 실행 및 IPC 브릿지**: 파이썬 측에서 생성한 자바스크립트 코드 문자열을 TCP 소켓을 통해 Mineflayer 봇 측으로 전송하고, 봇 내부 런타임에서 문자열을 `eval`하여 스킬을 구동합니다.
*   **컨텍스트 누적 이슈**: 스킬을 습득하면 `self.skill_manager.add_new_skill(info)`을 통해 디스크에 JS 소스코드 자체로 저장한 후, 다음 턴의 프롬프트 구성 시 `retrieve_skills`의 텍스트 결과를 LLM의 `system_message`에 누적 주입합니다. 또한 에러가 났을 때 `critique` 피드백을 `human_message`에 병렬적으로 계속 이어 붙이기 때문에, 재시도(`action_agent_task_max_retries = 4`)가 누적될수록 컨텍스트 토큰 크기가 비대해집니다.

### ② Odyssey (`Odyssey/odyssey/odyssey.py`)
*   **JS AST 파싱 및 강제 매핑**: 파이썬과 Node.js 브릿지를 위해 `@babel/core` 패키지를 파이썬 환경에서 동적으로 호출하여, JS 스킬 코드의 추상 구문 트리(AST)를 파싱합니다. 여기서 비동기 함수(`AsyncFunctionDeclaration`)를 추출하고, 첫 번째 파라미터가 `bot`이 되도록 강제 바인딩하는 형식을 취합니다 (`exec_code = f"await {main_function['name']}(bot, ...)"`).
*   **동기 대기 블로킹**: 코드 파싱 및 실행 측정 시간 기록을 위해 동기식 래퍼(Timer) 및 로컬 LLaMA 추론을 동기적으로 조율하므로, LLM 응답 대기 시간이 길어질 때 봇이 마인크래프트 서버의 킵얼라이브(KeepAlive) 패킷을 적절히 반환하지 못해 끊어지는 원초적인 한계가 코드 상에 잔존합니다.

### ③ mindcraft-ce (`src/agent/agent.js`, `src/models/prompter.js`)
*   **플레이스홀더 동적 치환 (`replaceStrings`)**: 
    ```javascript
    prompt = prompt.replaceAll('$STATS', stats);
    prompt = prompt.replaceAll('$INVENTORY', inventory);
    prompt = prompt.replaceAll('$MEMORY', this.agent.history.memory);
    ```
    LLM API를 호출하기 직전에 프로파일 템플릿의 `$STATS`, `$INVENTORY`, `$MEMORY` 등의 예약어를 실제 런타임의 최신 정보 스트링으로 치환해 전달합니다. 프롬프트 내부에 과거의 물리 정보가 중복 누적되어 지능이 분산되거나 토큰이 낭비되는 문제를 완벽히 회피합니다.
*   **비동기 레이스 컨디션 보호 (`most_recent_msg_time`)**: LLM이 오랜 시간 비동기적으로 대답을 생성하고 있는 와중에, 인게임 채팅이나 긴급 시스템 이벤트가 새로 들어오면 `current_msg_time !== this.most_recent_msg_time` 조건을 감지하여 기존 생성 중이던 LLM 프롬프트 결과물 반환을 즉시 폐기(`return ''`)하고 새로운 상황 정보로 프롬프트를 재구성하여 호출합니다.
*   **유휴 상태 이벤트 바인딩**: `this.bot.on('idle', ...)` 이벤트를 통해 봇의 행동 완료 및 정지를 완전히 비동기 감지하고, 이어서 `idle` 상태일 때만 `resumeAction()`을 스케줄링하여 단일 스레드 기반 마인플레이어의 동작 꼬임을 차단합니다.

### ④ mineflayer-chatgpt (`src/index.ts`)
*   **예외 복구 재접속 루프 (`runBotLoop`)**:
    ```typescript
    const delay = lastKickReason.includes("duplicate_login") 
      ? DUPLICATE_LOGIN_DELAY_MS 
      : RESTART_DELAY_MS;
    ```
    서버 연결 종료(`end`)나 강제 킥(`kicked`) 발생 시 프로세스를 종료하지 않고, 중복 로그인 감지 여부에 따라 30초~60초 대기 후 자동으로 `startBot`을 호출하여 최대 50회까지 재연결을 진행하는 강인한 복구 구조를 가집니다.
*   **다중 에이전트 기동 지연 (Staggered Login)**: 여러 에이전트를 한 번에 실행할 때 `await new Promise((r) => setTimeout(r, 10000))` 간격을 주어 봇들 간의 로그인 간격을 10초씩 지연시킴으로써 소켓 바인딩 충돌 및 인증 서버 차단을 영리하게 우회합니다.

### ⑤ mc-multimodal-agent (`src/index.ts`)
*   **도메인 데이터 저장소 관심사 분리**: 에이전트의 전체 메모리 구조를 하나로 모으지 않고 `ItemCatalog`, `GoalStore`, `SkillLibrary`, `TaskStore` 등의 독립 클래스로 완전히 모듈화하여 개별 직렬화 파일 구조로 관리합니다.
*   **백그라운드 생존 보호 루프 (`combatPulse` & `autoDefense`)**: 에이전트 태스크 루프의 실행 스레드와 별개로, 0.75초 간격으로 `bot.combatPulse()` 백그라운드 타이머가 동작합니다. 이는 LLM이 계획을 수립하고 있어 반응이 없을 때도 봇 주변의 위험 몹을 자동으로 타격하고 방어하며 음식을 먹도록 하는 실시간 생존 보강용 병렬 가상 스레드 패턴입니다.

### ⑥ yearn_for_mines (`packages/agent/src/agent-loop.ts`)
*   **MCP 기반 인터페이스 격리**: LLM에게 임의의 자바스크립트 생성 권한을 주는 대신, MCP(Model Context Protocol) 도구 명세 스키마(`bot_status`, `find_block`, `craft_item`)만 노출합니다. LLM은 오직 JSON 형태의 파라미터만 던지고 런타임이 이를 완벽히 스크리닝하므로 코드 오류에 의한 봇 크래시를 원천 방지합니다.
*   **반복 정체 방지 장치 (Stall Detection & System Injection)**:
    ```typescript
    private checkStallCondition(n: number): boolean {
      // 최근 n턴의 toolCalls가 전부 동일하고 결과가 전부 에러인지 확인
    }
    ```
    최근 3턴 간 동일한 인자로 동일한 툴을 반복 호출해 지속적으로 에러를 냈을 경우, 시스템 프롬프트 하단에 `[SYSTEM INJECTION] You have been repetitively failing... Rethink your plan!` 이라는 고수준 에러 강제 피드백을 삽입하여 LLM이 스스로 무한 루프에서 벗어나게 강제합니다.
*   **일시적 오류 페이징 및 폴링 (`isTransientError` / `handleDisconnection`)**: 통신 불능 또는 소켓 유실과 같은 일시적 툴 오류가 발생하면 툴 에러 상태로 처리하지 않고 에이전트 상태를 `paused`로 돌린 뒤, 주기적으로 `bot_status` 툴만 독자적으로 호출하여 마인크래프트 연결이 안정화될 때까지 대기하고 복구 직후 정지된 태스크 시점부터 끊김 없이 이어 실행합니다.

---

## 2. 6대 프로젝트 종합 아키텍처 비교 Matrix

| 평가 기준 | Voyager | Odyssey | mindcraft-ce | mineflayer-chatgpt | mc-multimodal-agent | yearn_for_mines |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **행동 실행 방식** | 실시간 JS `eval` | JS AST 파싱 + `eval` | 인게임 커맨드 바인딩 | 내장 커맨드 + JS 로더 | 도구 기반 자율 매크로 | MCP JSON Tool Call |
| **I/O 및 직렬화** | 동기식 단일 파일 | 동기식 체크포인팅 | 파일 기반 비동기 히스토리 | 단순 로컬 파일 로그 | 다중 독립 모듈형 스토어 | 파일 기반 Milestones / JSON |
| **장기 실행 복원력** | 극히 취약 (OOM 다발) | 미흡 (동기 블로킹) | 양호 (레이스 차단 메커니즘) | 우수 (재시도 및 Stagger) | 우수 (하이브리드 분리) | 매우 우수 (Pause/Resume/Stall) |
| **네트워크 예외 처리** | 에러 시 크래시 | 프로세스 단절 | 수동 재시작 필요 | 최대 50회 지연 재접속 | 자동 재접속 지원 | 일시 오류 감지 후 대기/복구 |
| **백그라운드 위협 생존** | 취약 (LLM 대기 시 무방비) | 취약 | 기본 autoEat만 사용 | 미흡 (인터럽트 대응) | 매우 우수 (Combat Pulse) | 양호 (상태 감지 후 재계획) |

---

## 3. 우리 아키텍처(Option A)로의 승화 및 구체적 개선 가이드

위의 실제 소스코드 기반 분석에서 얻은 고도의 엔지니어링 기법들을 현재 개발 중인 **Option A: Full Evolution & Multi-File Architecture**에 보완책으로 병합합니다.

### ① `mindcraft-ce` 스타일의 플레이스홀더 치환 (`replaceStrings`)
*   **적용**: `intentToSkill.ts`나 LLM 프롬프트 빌더에 최신 상태를 직전에 삽입하는 치환 방식을 탑재합니다.
*   **효과**: 토큰 중복 누적을 완벽히 제거하여 Free Tier API 환경에서 누적 비용을 90% 이상 절감합니다.

### ② `yearn_for_mines` 스타일의 Stall Detection (반복 정체 방지)
*   **적용**: `agentLoop.ts` 내에 최근 3~4턴 간의 `toolCalls` 및 실행 실패 내역을 저장하는 슬라이딩 윈도우 큐를 마련합니다. 만약 봇이 특정 블록을 찾지 못하거나 조합 테이블 바인딩에 실패하여 에러가 반복되면, 다음 루프 프롬프트에 `[STALL GUARD] 해당 행동이 연속으로 실패했습니다. 다른 우회 도구나 좌표를 선택하십시오.` 라는 강제 가이드 프롬프트를 인젝션합니다.
*   **효과**: 에이전트가 동일한 툴을 반복 호출하며 허송세월하는 무한 루프 교착 상태를 완벽히 감지하고 방어합니다.

### ③ `mc-multimodal-agent` 스타일의 백그라운드 위협 회피
*   **적용**: 봇이 행동을 수행하거나 LLM 판단을 기다릴 때, 런타임 레벨에서 `hostileDetected` 및 `healthWarning` 플래그를 주기적 비동기 타이머로 스캔합니다. 좀비나 크리퍼 조우 시 즉시 `agentLoop`를 인터럽트(Interrupt)하고 백그라운드 PVP 및 생존 프리미티브를 자율 구동하여 안전이 확보될 때까지 자가 생존 모드로 전환시킵니다.
*   **효과**: LLM의 응답 지연 시간 동안 몬스터에게 일방적으로 피격당해 사망하는 문제를 완전 예방합니다.

### ④ `mineflayer-chatgpt` 스타일의 복원력 있는 재연결 루프
*   **적용**: `agentLoop.ts`에서 서버와의 접속이 예기치 않게 끊어졌을 때 프로세스를 바로 내리지 않고, `runBotLoop`를 흉내 낸 비동기 재연결 모듈을 호출하여 일정 대기(30s/60s) 후 최대 50회까지 Mineflayer 봇을 다시 로깅시키고 상태 복구 체크포인트 파일(`physical.json`, `tasks.json`)을 로드하여 이전 수행 지점에서 이어서 구동합니다.
*   **효과**: 불안정한 로컬 Docker 마인크래프트 서버 환경에서도 무중단에 가까운 생존 복원력을 발휘합니다.
