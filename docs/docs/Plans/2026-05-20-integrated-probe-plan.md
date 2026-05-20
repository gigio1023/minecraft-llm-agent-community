# 마인크래프트 LLM 에이전트 프로브 통합 계획서 (Integrated Probe Plan)

본 계획서는 자동 승인되었던 **Option A: Full Evolution & Multi-File Architecture**의 뼈대에, 6대 벤치마킹 프로젝트의 소스코드 분석을 통해 도출한 4대 핵심 복원력 및 비용 최적화 설계 방안을 융합한 통합 기술 구현 계획서입니다.

---

## 1. 개요 및 설계 목표
마인크래프트 자바 데몬과 비동기 Mineflayer 소켓 통신 환경에서, LLM 에이전트 루프가 1000+ 사이클 이상의 장기 구동을 안정적으로 유지하고, 비용(토큰 사용량)을 현실적으로 통제하며, 네트워크 에러나 몬스터 습격 등의 런타임 위협으로부터 스스로를 복구할 수 있는 무중단 런타임을 구축합니다.

---

## 2. As-Is vs To-Be 아키텍처 비교

| 영역 | AS-IS (기존 프로브) | TO-BE (본 통합 계획의 대상) |
| :--- | :--- | :--- |
| **I/O 및 상태 직렬화** | 단일 JSON 파일 동기 쓰기 (`writeFileSync`). 100턴 이상 구동 시 파일 비대화 및 이벤트 루프 블로킹으로 봇 튕김 현상 초래. | **완전 비동기 논블로킹 I/O** 및 3대 분산 저장(`tasks.json`, `memory.json`, `physical.json`) + 100턴 단위 롤링 로깅 적용. |
| **LLM 호출 및 비용** | 매 틱마다 월드 관찰 정보를 LLM에 송신하여 응답 대기 및 토큰 요금 누적 과다. | **Event-Driven LLM Bypass**: 고수준 태스크 진행 중 런타임 TS 프리미티브 자율 실행. 특이 이벤트 발생 시에만 LLM 기동. |
| **무한 루프 방지** | 툴 에러 발생 시 LLM이 동일한 인자로 무한 재시도하여 루프 정체(Stall) 및 토큰 낭비. | **Stall Detection Guard**: 최근 3턴 간의 동일 실패 패턴 감지 시 시스템 프롬프트에 경고 가이드 강제 인젝션. |
| **프롬프트 관리** | 상태 정보를 계속 누적하여 대화 이력을 전달하므로 토큰 사용량 기하급수적 증가. | **Prompter 플레이스홀더 동적 치환**: 프롬프트 전송 직전에 `$STATS`, `$INVENTORY` 등을 최신 데이터로 실시간 교체. |
| **생존 및 복원력** | LLM 생각 대기 및 기동 중 적대적 몹에게 피격당하면 반응하지 못하고 사망. | **Combat Pulse 백그라운드 스레드**: 에이전트 루프 외부에서 0.75초 간격으로 몹 감지 및 자동 전투/회피 스레드 독립 구동. |
| **네트워크 단절 회복** | 소켓 단절이나 중복 로그인 차단 시 즉시 에러 크래시 발생 및 수동 재시작 필요. | **50회 한도 엇박자(Staggered) 자동 재연결 루프**: 단절 감지 시 30s/60s 지연 후 상태 로드 복구 접속 시도. |

---

## 3. 세부 구현 태스크 목록

### [태스크 1] Stall Detection Guard (반복 정체 방지)
*   **구현 파일**: `probe/src/runtime/antiRepeat.ts` 또는 `agentLoop.ts` 내에 슬라이딩 윈도우 스토리지 추가.
*   **세부 내용**: 
    1. 최근 3턴 간 LLM이 발행한 `intent`와 파라미터가 동일하며, 그 실행 결과가 전부 `error`인지 체크하는 `checkStallCondition` 메서드 작성.
    2. 정체 감지 시, 프롬프트 파싱 버퍼에 `[STALL GUARD] 해당 동작이 반복 실패하고 있으니 다른 조합법이나 좌표를 사용하세요.` 문구 주입.

### [태스크 2] Dynamic Placeholder Prompter (프롬프트 동적 치환)
*   **구현 파일**: `probe/src/runtime/intentToSkill.ts` 및 프로바이더 프롬프트 빌더.
*   **세부 내용**:
    1. 프롬프트 템플릿에 `$STATS`, `$INVENTORY`, `$MEMORY` 치환용 토큰 정의.
    2. API 요청 직전에 봇의 `bot.entity.position`, `bot.inventory`, 요약 메모리 객체를 파싱하여 스트링으로 일괄 변경 적용.

### [태스크 3] Combat Pulse Thread (백그라운드 생존 보호)
*   **구현 파일**: `probe/src/npc/hostile/combatPulse.ts` (신규 생성) 및 `agentLoop.ts` 연동.
*   **세부 내용**:
    1. `setInterval` 혹은 논블로킹 타이머로 0.75초마다 주변 몹(`hostile`) 감시.
    2. 피격 혹은 위협 발생 시 메인 태스크 루프 일시 정지(Pause) 후 물리적 회피/타격/음식 섭취 프리미티브 강제 구동.

### [태스크 4] Auto Reconnect Loop (재접속 회복기)
*   **구현 파일**: `probe/src/runtime/createBots.ts` 및 `agentLoop.ts` 재연결 리포트 연동.
*   **세부 내용**:
    1. `bot.on('kicked' | 'end')` 감지 시 런타임을 폭발시키지 않고 재접속 상태 머신(`connecting` -> `paused`) 전환.
    2. `DUPLICATE_LOGIN_DELAY_MS = 60000` 및 `RESTART_DELAY_MS = 30000` 지연 후 순차적 로그인 시도. 최대 50회 제한.
    3. 복구 성공 시 디스크의 `physical.json` 등을 재수화(Rehydration)하여 실행 지점 복원.

---

## 4. 검증 및 테스트 계획 (Stress Test)
1.  **1000턴 시뮬레이션 모크 구동**:
    *   인위적인 네트워크 소켓 끊김, 몹 타격 이벤트, 조합대 탐색 실패 등의 가혹 조건 무작위 주입.
    *   비동기 파일 라이터가 힙 메모리 점유율을 50MB 이내로 통제하고 컴팩션이 정상 동작하는지 테스트.
2.  **메모리 가비지 컬렉션 모니터링**:
    *   반복 구동 시 V8 힙 누수가 발생하지 않는지 `node --expose-gc` 옵션을 사용해 정기 감시.
