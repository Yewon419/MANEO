# MANEO 프로젝트 — 통합 현황 문서

> 작성일: 2026-04-28 / 마감 D-8 (2026-05-06 18:00)
> **새 세션 진입 시 이 파일을 첫 번째로 읽을 것.**
> 사용자가 "코딩 시작"을 명시하기 전까지는 **설계 작업만**, 코드 수정 금지.

---

## 0. 자료 인덱스 (지금 있는 것 전부)

| 문서 | 위치 | 크기 | 내용 |
|------|------|------|------|
| **이 문서** | `PROJECT_STATUS.md` | — | 전체 그림 + 모든 결정사항 + 다음 단계 |
| 기획 회의록 01 | `회의록_01_기획.md` | 5KB | 2026-04-06 1차 기획 (초기 컨셉, LLM 기반) |
| 게임 정체성 | `docs/game_identity.md` | 7.5KB | 한 줄 정의 / 핵심 감정 / 서사 구조 / 설계 원칙 |
| 시스템 설계서 | `docs/design_system.md` | 22.7KB | 인터랙션 / 상태 / 스테이지 / 반응엔진 / 데이터 / 사운드 |
| 성격 시스템 | `docs/personality_system.md` | 10.9KB | 3축 성격 / 재질·눈 가중치 / drift 시스템 |
| 애니메이션 시스템 | `docs/animation_system.md` | 13.7KB | 레이어 구조 / 스테이지별 동작 / 눈·다리 / 전환 시퀀스 |
| 레퍼런스 이미지 | `sprite/reference/` | — | silhouette_shapes.png, sketch_materials.png |
| 작업 샘플 | `sprite/sample/` | — | IMG_*.PNG 18장 (사용자 제공 분리 예시 등) |

> 상세 설계는 `docs/`에. 이 파일은 "지금 무엇이 결정됐고 무엇이 남았는가"의 단일 진입점.

---

## 1. 게임 정체성 (game_identity.md 압축)

### 한 줄 정의
> **"말 못하는 존재 곁에 머물러주는 것만으로, 서로의 Meum(나의 것)이 되는 게임."**

### 이름의 의미 (라틴어)
- **MANEO** — "머물다, 남다"
- **Meum** — "나의 것"

### 핵심 감정
**애착과 그리움.** 게임을 끈 뒤 "얘 괜찮으려나" 떠올리는 것 → 다시 켰을 때 거기 있다는 안도. 이 두 감정의 반복.

### 오프닝 ↔ 엔딩 대칭 (핵심 트릭)
```
오프닝:  "Meum — 나의 것"     ← 유저 시점: "내가 소유할 존재"
엔딩:    "당신이 있어서, 나올 수 있었어요"
                              ← Meum 시점: "당신이 나의 Meum이었어요"
```
"나의 것"의 주어가 뒤집힘. 명시적으로 설명하지 않음. 알아채는 유저는 알아채는 것이 보상.

### 5대 설계 원칙 (모든 판단 기준)
1. **Meum은 절대 말하지 않는다** — 엔딩 한 줄 제외. 의성어/표정/동작만.
2. **방치는 처벌이 아니다** — bond는 절대 감소하지 않는다.
3. **성장은 빠르지 않다** — 시간 투자 필수, 스팸 클릭으로 못 뚫음.
4. **모든 Meum은 다르다** — 80가지 외형 × 성격 연속값.
5. **기술은 감정을 위해 존재한다** — "이게 애착을 강화하는가?" 아니면 빼라.

---

## 2. 서사 구조 (Phase 0 ~ 3)

| Phase | 단계 | 설명 |
|-------|------|------|
| **0. 오프닝** | 검은 화면 + "Meum — 나의 것" → 돌 등장 | 1회만 재생, `opening_seen: true` 기록 |
| **1. 튜토리얼** | Stage 1 (돌) → 2 (구체) → 3 (풀 스프라이트) | 게임 본편이자 시스템 학습 |
| **2. 엔딩** | Stage 3 도달 시 1회 재생 | Meum이 처음이자 유일하게 텍스트 출력. 스킵 불가. |
| **3. 엔드 컨텐츠** | 엔딩 이후 진짜 본편 | drift 시스템, Layer 3 동적 변화, 미세 행동 변화 |

### Stage 단계
| Stage | 표시 | 행동 |
|-------|------|------|
| **1 (돌)** | rock_a→b→c, robot은 capsule | 채팅 → wobble만. 쓰다듬기 무반응. 균열만 진행. |
| **2 (원형)** | 재질×색상 원형 + 눈 (다리 없음) | 채팅·쓰다듬기·클릭 가능. bounce/wobble/scale. body transform만으로 모든 동작 표현. |
| **3 (풀)** | 재질×색상×형태 + 눈 + 다리 + 동적 레이어 | 풀 인터랙션. stand/walk/run/sit_down/stand_up/sit. Layer 3 활성. |

### Stage 전환 조건
| 전환 | 조건 |
|------|------|
| Stage 1 → 2 | bond ≥ 15 AND 총 런타임 ≥ 1440분 (24h) |
| Stage 2 → 3 | bond ≥ 50 AND 총 런타임 ≥ 4320분 (72h) |

### Stage 1 균열 진행 (`GameState.crackPhase`)
- bond < 5 → rock_a / 5~9 → rock_b / 10+ → rock_c
- robot 재질 → capsule.png (단일)

---

## 3. 캐릭터 시스템

### 3.1 외형 매트릭스 (총 80가지 조합)
| 재질 | 색상 | 형태 | 조합 |
|------|------|------|------|
| wood | brown_light, brown_medium, gray | bear, cat_ear, dog, notch, rectangle, teardrop | 18 |
| metal | gold, gold_warm, platinum | bear, cat_ear, dog, notch, rectangle, teardrop | 18 |
| pearl | pink, white | bear, cat_ear, dog, notch, teardrop | 10 |
| light | blue_neon, cream, white | bear, cat_ear, dog, lantern, notch, rectangle, teardrop | 21 |
| doll | beige, brown, navy, pink | bear, cat_ear, dog | 12 |
| robot | default | default (레어) | 1 |
| **합계** | | | **80** |

### 3.2 눈 6종
dot / half_moon / big_circle / asymmetric / empty_circle / vertical_oval

### 3.3 성격 시스템 — 3축 (personality_system.md)
```
personality = {
  base:    { courage, energy, curiosity }   // 탄생 시 고정, -1.0~+1.0
  drift:   { courage, energy, curiosity }   // Phase 3부터 -0.3~+0.3
  current: clamp(base + drift, -1.0, +1.0)  // 실제 행동 판단 기준
}
```
- ~~appetite~~ 제거됨. 먹이 시스템 없음.
- base는 불변, drift는 Phase 3 이후 유저 패턴에 의해 누적

### 3.4 성격 가중치 — 재질
| 재질 | courage | energy | curiosity |
|------|---------|--------|-----------|
| wood | 0.0 | -0.2 | -0.1 |
| metal | +0.1 | 0.0 | -0.2 |
| pearl | -0.2 | -0.1 | +0.1 |
| light | -0.1 | +0.2 | +0.3 |
| doll | -0.1 | 0.0 | +0.1 |
| robot | +0.3 | +0.3 | +0.4 |

### 3.5 성격 가중치 — 눈
| 눈 | courage | energy | curiosity |
|----|---------|--------|-----------|
| dot | 0.0 | -0.3 | -0.2 |
| half_moon | +0.1 | -0.4 | 0.0 |
| big_circle | 0.0 | +0.2 | +0.4 |
| asymmetric | +0.4 | +0.1 | +0.2 |
| empty_circle | -0.4 | 0.0 | -0.2 |
| vertical_oval | +0.2 | +0.3 | 0.0 |

### 3.6 최종 성격 계산
```javascript
base[axis] = clamp(random(-0.3, +0.3) + matBias + eyeBias, -1.0, +1.0)
```

### 3.7 drift 패턴 (Phase 3 이후)
| 패턴 | 조건 | drift 방향 | 일/변동 | 최대 |
|------|------|-----------|---------|------|
| nightOwl | 22~04시 상호작용 > 40% | energy + | +0.005 | +0.15 |
| comforter | comfort intent > 25% | courage + | +0.005 | +0.2 |
| playful | play intent > 25% | energy +, curiosity + | +0.003 | +0.15 |
| talkative | 일평균 채팅 > 20 | curiosity + | +0.003 | +0.15 |
| quiet | 일평균 채팅 < 5 | curiosity − | +0.003 | +0.15 |
| touchy | 쓰다듬기 > 채팅 | courage + | +0.005 | +0.2 |

- 자정 1회 갱신, 패턴 사라져도 drift는 유지 (감소 안 함)
- 최대 ±0.3 캡

---

## 4. 상태 시스템

### 4.1 핵심 수치 3개
| 수치 | 범위 | 변동 | 역할 |
|------|------|------|------|
| **bond** | 0~100 | 상호작용 +1~3, **감소 없음** | 성장 트리거 |
| **mood** | -10~+10 | ±1~3, 시간 경과 0 수렴 | 반응/표정 결정 |
| **energy** | 0~100 | -1/10분, 수면으로 회복 | 활동 가능 여부 |

### 4.2 상태 전이
```
[정상]  energy>30, mood>-5
  ↓ energy≤30
[졸림]  눈 반감김, 동작 느려짐
  ↓ energy≤0 OR "자" 명령
[수면]  눈 감김, energy +5/분, 100되면 기상
  ↓ mood<-5 AND energy>30
[삐침]  등 돌림, 말 걸면 회복
```

### 4.3 주기 타이머 (`Game._startTimers`)
- mood decay: 5분마다 0 수렴
- energy drain: 10분마다 -1
- 런타임 카운터: 1분마다 +1 + stage 체크
- 자동 저장: 30초마다

---

## 5. 인터랙션 모델

### 5.1 입력 채널
| 채널 | 처리 |
|------|------|
| **채팅 (메인)** | LocalEngine — IntentClassifier → ReactionTable |
| **쓰다듬기** | 로컬 — courage 기반 첫 반응 → mood 기반 이완 |
| **클릭** | 로컬 — courage + energy 기반 (3초 쿨다운) |

### 5.2 채팅 UI — "보이드(void)"
- 형태: 경계가 흐릿한 검정 원 (말풍선 X) — "속삭이는 구멍"
- Meum 클릭 → 보이드 페이드인 → `""` 안에 텍스트 → Enter → 반응 → 다시 `""` (연속 대화)
- 의도적 이질감: 도트아트 Meum vs 흐릿한 검정 원 = 유저는 이 세계 밖의 존재
- 위치: Meum 옆, 약간 아래 (위젯 영역 밖)

### 5.3 위젯 영역 & 이벤트 탈출
- **기본**: 항상 같은 자리. 유저가 찾아다니지 않는다.
- **탈출**: 이벤트성으로 위젯 밖 잠깐 → 5~10초 후 자동 귀환
- Stage 1: 탈출 없음 / Stage 2: 가장자리 삐꼼만 / Stage 3: 본격 탈출
- 구현: `BrowserWindow.setBounds()` (alwaysOnTop 'floating')

### 5.4 Intent 11종 (LocalEngine)
sleep / play / comfort / praise / scold / greet / goodbye / name / weather / story / question
- 키워드+가중치 매칭. 실패 시 "unknown" → 다채로운 반응 (confused/curious/neutral 랜덤)

### 5.5 의성어 풀 (9종 emotion)
happy, excited, sad, confused, scared, sleepy, angry, neutral, purr
- 각 emotion별 3~5개 의성어 풀 → 랜덤 선택
- **텍스트가 아닌 도트 사운드로 출력** ("말 못하는 존재" 정체성)

---

## 6. 반응 엔진 아키텍처

### 6.1 v1 (공모전) vs v2 (상용화)
```
v1: LocalEngine만으로 완전 동작. LLM 없이 .exe 배포.
v2: LLMAdapter 추가 → 구독권 유저만 활성화.
```
두 엔진 모두 동일 인터페이스 `ReactionEngine.react(input, context)` 구현.

### 6.2 v2 LLM 호출 정책 (구현은 상용화 시)
- LocalEngine "unknown" 시에만 LLM fallback
- debounce 1초, timeout 5초, 3회 재시도
- 수치 변동 검증 후 적용, 월간 토큰 캡

---

## 7. 애니메이션 시스템 (animation_system.md 압축)

### 7.1 레이어 구조
```
Layer 4: 이펙트/파티클        (Canvas or CSS)
Layer 3: 동적 장식 (Phase 3)  (CSS positioned)
Layer 2: 눈/표정              (프레임 교체)
Layer 1-B: 다리               (프레임 교체)
Layer 1-A: 바디               (정적 <img> + CSS transform)
```
- 바디 transform이 전체 동작 담당, 다리/눈만 프레임 애니메이션
- **하이브리드: 바디는 CSS, 다리·눈은 프레임**

### 7.2 Stage별 애니메이션 (요약)
**Stage 1 (돌)**: idle(정지) / wobble(채팅) / crack_glow(균열) / hatch_shake(탄생직전)
**Stage 2 (구체)**: idle(호흡) / bounce / wobble / shrink / slow_blink / sleep / purr / flinch
**Stage 3 (풀)**: + bounce_move / head_tilt / sit / sleep / tremble / peek / yawn / look_at

### 7.3 전환 연출 (특수)
- **탄생 (1→2)**: hatch_shake 3s → 균열 이펙트 → 페이드 → 플래시 → 구체 페이드인 → 첫 깜빡임
- **진화 (2→3)**: 빛남 2s → scale 폭발 → 암전 → 풀 스프라이트 → idle 호흡
- **엔딩**: 모든 동작 정지 → 화면 어두워짐 → Meum 정면 응시 → 텍스트 페이드인 (보이드 X, Meum 자신에게서) → 3초 유지 → 페이드아웃 → idle 재개 → Phase 3 시작
- **오프닝**: 검은 화면 1.5s → 텍스트 페이드인 → 2s 유지 → 페이드아웃 → 돌 페이드인

### 7.4 idle 스케줄러
- 30~120초 랜덤 간격 (energy축으로 ±)
- 행동 풀: bounce_random / look_around / yawn / sit_down / peek_out / tremble_look / nod_off / stare_cursor / approach_cursor
- 가중치: courage / energy / curiosity / mood / state.energy 조건부

---

## 8. 데이터 저장 (3-파일 분할)

> 결정 #6 (2026-04-29): 게임 상태 / 유저 사실 / drift 통계를 **3개 파일로 분리**.
> 책임 명확 + 사용자 가독성(memory.md 마크다운) + 장애 격리.

### 8.1 `userData/save.json` — 게임 현재 상태 (~2KB)
```json
{
  "version": 1,
  "created_at": "2026-04-17T12:00:00Z",
  "meum": {
    "material": "wood", "color": "brown_light", "shape": "cat_ear", "eye_type": "big_circle",
    "personality": {
      "base":  { "courage": 0.15, "energy": -0.42, "curiosity": 0.71 },
      "drift": { "courage": 0.0, "energy": 0.0, "curiosity": 0.0 }
    }
  },
  "state": {
    "stage": 2, "bond": 34, "mood": 3, "energy": 78,
    "total_runtime_minutes": 1840,
    "last_active": "2026-04-17T11:50:00Z",
    "opening_seen": true, "ending_seen": false
  },
  "window": { "x": 100, "y": 100 }
}
```

### 8.2 `userData/memory.md` — 유저 사실 (사람·LLM 둘 다 읽기, ~5~50KB)
- 마크다운 형식. 유저가 직접 열어볼 수 있음.
- 키워드 매칭으로 자동 추가 (이름, 좋아하는 것, 자주 쓰는 인사 등)
- 50줄 초과 시 가장 오래된 항목 자동 정리

```markdown
# Meum의 메모리
> 이 파일은 Meum이 당신에 대해 기억하고 있는 내용입니다.

## 유저 정보
- 이름: 예원 (2026-04-19 알게 됨)
- 좋아하는 것: 고양이 (3회 언급)

## 중요한 순간
- 2026-04-25: 처음 위로해줬다

## 자주 사용하는 표현
- "오늘 힘들었어"
```

### 8.3 `userData/drift_log.json` — Phase 3 패턴 통계 (~6KB)
- Phase 3 진입(엔딩 후)부터 생성. 그 전까지 파일 없음.
- 30일치 daily_patterns 보관. 30일 초과 시 가장 오래된 자동 삭제.
- 자정 timer로 today 키 전환 (~10줄). 세션 시작 시 누적 적용.

```json
{
  "version": 1,
  "phase3_started_at": "2026-05-15T03:42:00Z",
  "last_drift_update": "2026-06-13",
  "daily_patterns": {
    "2026-06-13": {
      "interactions": 14,
      "intent_counts": { "comfort": 3, "play": 5, "greet": 2 },
      "time_slots": { "morning": 2, "day": 4, "evening": 3, "night": 5 },
      "touch_count": 8
    }
  }
}
```

### 8.4 일관성 정책
- 3개 파일 sequential write (트랜잭션 X — 단순함 우선)
- 저장 순서: save.json → memory.md → drift_log.json (중요도 순)
- 실패 시 console.warn + 다음 autosave에서 재시도
- 손상 감지 시 자동 백업본(.bak) 사용

### 8.5 신규 모듈 (§14에서 명시)
- `MemoryFile.js` — memory.md 읽기/추가/요약
- `DriftTracker.js` — drift_log 관리 + 일별 패턴 → drift 변환 + 누적 적용

---

## 9. 에셋 현황 (sprite/)

> 단일 진리원: `sprite/MANIFEST.json` (코드는 키로만 접근).
> 명명 규칙: `sprite/NAMING.md`.

### 9.1 디렉토리 (2026-04-29 Stage 우선 하이브리드 마이그레이션 후)
```
sprite/
├─ NAMING.md                       ── 명명 규칙
├─ MANIFEST.json                   ── 단일 진리원 (코드용)
│
├─ stage1/
│  └─ body/{rock_a|b|c|capsule}.png        (4)
│
├─ stage2/
│  └─ body/{material}/{color}.png          (15, 다리 없는 원형, render scaleY 1.35)
│
├─ stage3/
│  ├─ body/{material}/{color}/{shape}.png  (80)
│  ├─ head/{material}/{color}/{shape}.png  (80)
│  ├─ leg/                                  (v1 fallback)
│  │  ├─ basic.png                          (4재질 + light 공용)
│  │  └─ robot/default.png
│  └─ leg_frames/                           (미제작 126: 7형태 × 18프레임)
│
├─ eyes/                           ── 공용 (미제작 ~55장)
├─ fx/                             ── 공용 (미제작 ~22장)
├─ dynamic/                        ── 공용 (미제작, Phase 3)
│
├─ nobg/                           ── 작업 중간 산출물 (배포 미포함)
│  ├─ stage1/                       (rock_c 빛그림자 제거 완료)
│  └─ stage2/{material}/{color}.png
│
├─ scripts/                        ── 에셋 처리 도구
│  ├─ remove_bg.py
│  ├─ split_head_leg.py
│  ├─ split_light.py
│  ├─ split_stage2.py              (DEPRECATED — Stage 2 컨셉 변경)
│  └─ split_sprites.py
│
├─ reference/                      ── 컨셉 레퍼런스 (2장)
└─ _archive/                       ── (코드 미참조)
   ├─ sample/                       ── 18장 raw
   └─ stage2_with_legs/             ── 15장 (stage2 구 컨셉 원본)
```

### 9.1.1 마이그레이션 이력
**1차 (2026-04-28)** — stage3 prefix 추가 + 스크립트 분리
- `body/{m}/...` → `body/stage3/{m}/...` (head/leg/nobg 동일)
- 스크립트 5개 → `sprite/scripts/`

**정리 (2026-04-28)** — 옵션 2
- `leg/stage2/` 15장 + `leg/stage3/light/` 21장 + `preview/` 2장 삭제
- `sample/` 18장 → `_archive/sample/`

**2차 (2026-04-29) ★ 현재** — Stage 우선 하이브리드
- `body/stage1/` → `stage1/body/`
- `body/stage3/` → `stage3/body/`, `head/stage3/` → `stage3/head/`, `leg/stage3/` → `stage3/leg/`
- `head/stage2/` → `stage2/body/` (다리 없는 원형 컨셉으로 승격)
- `body/stage2/` → `_archive/stage2_with_legs/` (구 컨셉 원본 격리)
- 빈 `body/`, `head/`, `leg/` 최상위 폴더 제거
- `eyes/`, `fx/`, `dynamic/`은 stage 무관이라 sprite 직속 유지
- 스크립트 경로 상수 갱신

### 9.2 작업 완료
| 카테고리 | 매수 | 방식 |
|---------|------|------|
| 배경 제거 (Stage 1/2/3 전체) | 99 | gradient flood |
| 머리/다리 분리 — Stage 3 wood/doll/metal/pearl | 58 | bbox 기반 |
| 머리/다리 분리 — Stage 3 light | 21 | neck-cut (40~78%) |
| 머리/다리 분리 — Stage 3 robot | 1 | 사용자 수동 분리 |
| 머리/다리 분리 — Stage 2 전 재질 | 15 | neck-cut (50~85%) |
| **합계 분리** | **95** | |

### 9.3 미제작 에셋 (animation_system.md §1 기준 ~185장)
- **다리 프레임** (~130장): 7형태 × 4동작(서기/걷기/앉기/자기) × 4프레임 + Stage 2 oval 1세트
- **눈 프레임** (~55장): 6종 × 7표정 + 깜빡임 중간 6장 + robot 화면 패턴 7개
- **이펙트**: Stage 1 균열, 탄생/진화 연출
- **사운드** (~35~40개): 9 카테고리 + system + robot 별도 세트

---

## 10. 코드 현재 상태

### 10.1 디렉토리
```
MANEO/
├─ index.html       ── 위젯 컨테이너, 오프닝 오버레이, 보이드 UI, 디버그 패널
├─ main.js          ── Electron 메인 프로세스 (300px 투명 위젯, IPC)
├─ preload.js       ── window.maneo API
├─ style.css        ── breathe/wobble/bounce 등 CSS 키프레임
├─ package.json     ── (npm install 미실행 — node_modules 없음)
└─ src/
   ├─ Game.js                  ── 메인 루프, 초기화, 타이머, 오프닝, Stage 전환
   ├─ state/
   │  ├─ GameState.js          ── bond/mood/energy/stage/personality, crackPhase
   │  └─ SaveManager.js        ── 세이브 I/O, 새 게임 시 랜덤 생성
   ├─ engine/
   │  ├─ IntentClassifier.js   ── 11 intent 키워드 분류
   │  ├─ ReactionTable.js      ── intent × 성격/상태 → 반응
   │  └─ LocalEngine.js        ── react/reactPat/reactClick (3초 쿨다운)
   ├─ animation/
   │  └─ Animator.js           ── CSS 애니메이션 큐, idle 자동 복귀
   └─ ui/
      ├─ SpriteRenderer.js     ── stage별 스프라이트 경로 결정
      ├─ VoidUI.js             ── 보이드 채팅 UI
      └─ DebugPanel.js
```

### 10.2 IPC API (preload.js → window.maneo)
- save, getPath, window (set-bounds), isDebug, set-ignore-mouse, debug

### 10.3 코드 미반영 항목 (설계 후 일괄 작업)
- [ ] head/body 레이어 분리 — `index.html` (#meum-container 안), `SpriteRenderer.js` (head/body 각각), `Animator.js` (body만), `style.css` (정렬 + 머리 고정)
- [ ] 사운드 재생 통합 (`result.sound`)
- [ ] 눈 표정 교체 (Layer 2)
- [ ] 탄생/진화 연출 (`_advanceStage`)
- [ ] 엔딩 시퀀스 (`_playEnding`) — Meum 자신에게서 텍스트, 1회만
- [ ] 위젯 탈출 이동 모드 (IPC `window:set-bounds`는 준비됨)
- [ ] 오프닝 시퀀스 (현재 index.html에 오버레이만 있음)
- [ ] Phase 3 drift 시스템

---

## 11. 다음 세션 작업 — 설계 우선

> **사용자 명시 전까지 코딩 금지.** 다음 항목들에 대한 설계 결정/문서화부터.

### 11.1 우선순위 1 — 설계 (먼저 해야 할 것)
1. **head/body 레이어 시스템 아키텍처**
   - DOM 구조 (`<img class="head">` + `<img class="body">` vs Canvas)
   - CSS 정렬 전략 (head 절대 위치 vs flexbox)
   - Animator 타겟 분기 (body만? head 별도 idle 모션?)
   - basic.png 공용 다리 vs stage2/light 개별 다리 경로 결정 로직

2. **눈 표정 교체 시스템 (Layer 2)**
   - 눈 6종 × 7표정 = 42장 + 깜빡임 중간 6장 = 48장 명세
   - 눈 위치 config (`eye_positions.json`) — 형태별 좌표
   - 표정 전환 (즉시 교체 vs 페이드)
   - look_at 커서 추적 구현 (translateX/Y ±3px)

3. **사운드 시스템**
   - 9 카테고리 + system + robot ≈ 35~40개
   - 재질별 음색 변형 (Web Audio API playbackRate/필터)
   - 동시 재생 제한, 볼륨, 채널
   - 자체 제작 vs 무료 라이브러리 (8bit/레트로)

4. **전환 연출 시퀀스 명세**
   - 탄생 (1→2): 7단계 (hatch_shake → 균열 → 페이드 → 플래시 → 구체 → bounce → 첫 깜빡임)
   - 진화 (2→3): 6단계
   - 엔딩: 10단계 + 정확한 텍스트 ("당신이 있어서, 나올 수 있었어요" — 확정 여부)
   - 오프닝: 6단계

5. **Stage 1 처리 결정**
   - 머리/다리 분리가 필요한가? (현재 wobble만 → 단일 이미지로 충분할 수도)
   - 균열 단계 전환 연출 (rock_a → b → c)
   - capsule(robot) 특수 케이스

6. **Phase 3 drift 시스템**
   - 패턴 감지 로직 (일별 집계? 슬라이딩 윈도우?)
   - 자정 갱신 트리거 (Electron이 켜져있어야 갱신?)
   - drift 데이터 저장 형식 (save.json `drift` 필드)

### 11.2 우선순위 2 — 코딩 (설계 승인 후)
- `npm install` → `npm run dev` 동작 확인
- head/body 레이어 시스템 코드 반영
- 사운드 시스템 통합
- 눈 표정 교체
- 탄생/진화/엔딩 연출
- 위젯 탈출 모드
- Phase 3 drift
- Git 초기화 + 첫 커밋

### 11.3 우선순위 3 — 잔여 에셋
- 눈 6종 스프라이트 (~48장)
- 다리 프레임 (~130장 — 걷기/앉기/자기)
- 사운드 (~35~40개)
- 이펙트 (균열, 탄생, 진화)

---

## 12. 운영 규칙

### 12.1 새 세션 진입 절차
1. **이 파일(`PROJECT_STATUS.md`) 먼저 읽기**
2. 필요 시 `docs/` 4개 문서 (game_identity, personality_system, design_system, animation_system) 참조
3. 사용자가 "코딩 시작"을 명시할 때까지 **설계 작업만** — 코드 수정 금지
4. 설계 결과는 `docs/`에 새 문서 또는 기존 문서 업데이트로 정리

### 12.2 에셋 절대 규칙
- `sprite/body/`는 READ-ONLY — 절대 덮어쓰지 말 것 (원본)
- `sprite/nobg/`, `sprite/head/`, `sprite/leg/`만 수정 가능
- 분리 스크립트(`split_*.py`, `remove_bg.py`)는 idempotent — 재실행 가능

### 12.3 기술 스택 주의
- 회의록_01에는 "Gemini 2.0 Flash" 기록이 있지만, **확정된 v1은 완전 로컬 엔진** (LLM 호출 0회).
- LLM 도입은 v2 상용화 시 구독권 전용. 인터페이스만 v1에서 정의.
- 공모전(2026-05-06)까지 현 LocalEngine으로 제출 가능.

### 12.4 디버그 모드
- Ctrl+Shift+D → 시간 100x 가속, bond 직접 설정 (심사용 필수)

---

## 13. 부수 자원

### ComfyUI (대기 중)
- 경로: `C:\Users\windg\Desktop\ComfyUI`
- CPU 모드 (`--cpu`, AMD Radeon 880M 내장GPU 호환 이슈)
- SD 1.5 + pixel_art LoRA
- img2img 워크플로우 세팅 미완료 → 눈/다리 프레임 에셋 생성에 활용 가능

### split_sprites.py
- 경로: `sprite/split_sprites.py`
- RGB 흰색 편차 기반 스마트 그리드 감지 (3×3)
- 가장자리 2px 보더 제거 + connected component로 stray 픽셀/텍스트 inpaint
- 512×512 캔버스 중앙 정렬

### 공모전 어필 포인트 (game_identity.md §끝)
1. 컨셉 명확성: "말 못하는 존재에게 정 들이는 게임" 한 줄 요약 가능
2. 감정 설계: 엔딩이 중간에 있는 구조 + 한 줄 임팩트
3. 기술적 자립: LLM 없이 로컬 완전 동작, 오프라인 가능, 가벼움
4. 비주얼 아이덴티티: 80가지 조합 × 도트아트
5. 리플레이 가치: Phase 3 drift, 키울수록 달라지는 Meum

---

## 13.5 회의 결정 로그 (2026-04-28 미팅)

| # | 항목 | 결정 |
|---|------|------|
| 1 | 레이어 구현 매체 | **하이브리드** — img 4레이어(body/head/leg/eyes/dynamic) + Canvas 1레이어(effects). 의존성 추가 X. 동시 파티클 ≤20, 동시 애니 ≤3 가드. |
| 2 | 눈 위치 보정 | **하이브리드 C** — head 정렬 가정 + 형태별 미세 offset. 합성은 별도 `<img class="eyes">` absolute. |
| 3 | 다리 운영 | 검정 통일 (robot 제외). 동작 6종(stand/walk/**run 별도**/sit_down/**stand_up 별도**/sit). 성격 기반 속도 자동 조절. Stage 3 126장. |
| 3.5 | **Stage 2 디자인 변경** | **다리 없는 원형**. head/stage2/{material}/{color}.png를 body로 승격 + CSS scaleY 1.35 보정. 다리 프레임 0장. |
| 3.7 | sprite 폴더 정리 | leg/stage2 + leg/stage3/light + preview 삭제, sample → _archive. 약 15MB 슬림화. |
| 3.8 | Stage 우선 디렉토리 재구조 | sprite/stage{1,2,3}/ 하이브리드. body/head/leg는 stage 안, eyes/fx/dynamic은 공용. |
| 4 | timeline JSON 형식 | 8종 액션(anim/sound/fx/fade/swap/emit/text/wait) + 정적 변수 4개({material}/{color}/{shape}/{eye_type}) + 병렬/큐잉/cancel 정책. 부족 시 점진 확장. |
| 5 | **사운드 정책 — 미니멀** | 데스크탑 위젯 환경 고려. 일반 인터랙션 무음. **4개 핵심 사운드만**: opening BGM (6s) / birth chime (1s) / growth chime (1s) / ending BGM (12s). 제작 출처: Suno AI 또는 Pixabay CC0. ReactionTable.sound 필드, 의성어 풀, 재질별 음색 변형 모두 폐기. SoundPlayer ~30줄. |
| 6 | **drift 갱신 + 데이터 3분할** | (a) 세션 시작 시 일괄 누적 처리 (last_drift_update 이후 경과일수만큼 적용). (b) **3-파일 분리**: save.json(현재 상태) + memory.md(유저 사실, 마크다운) + drift_log.json(30일 패턴 통계). 자정 timer로 today 키 전환. |

---

## 14. 코드 아키텍처 청사진 (2026-04-28 신규 설계)

> 사용자 "코딩 시작" 명시 전까지 **이 청사진은 설계 문서**. 실 구현 X.
> 핵심 원칙: **데이터-로직-렌더 3분리**, **이벤트 버스 기반 느슨한 결합**, **에셋 카탈로그 단일 진입점**.

### 14.1 6대 설계 원칙

1. **데이터/로직/렌더 분리** — `GameState`는 순수 데이터, 엔진은 순수 함수, 렌더는 데이터→DOM 매핑.
2. **이벤트 버스** — 모듈 간 직접 호출 금지. `EventBus.emit('bond:changed', ...)` 패턴.
3. **에셋 카탈로그 단일 진입점** — 모든 스프라이트/사운드는 `MANIFEST.json` 키로 접근. 경로 하드코딩 금지.
4. **선언적 시퀀스** — 탄생/엔딩 같은 복잡한 연출은 timeline JSON으로 정의. 코드는 인터프리터.
5. **에셋 누락에 강건** — 미제작 에셋도 키는 존재. 누락 시 placeholder + console.warn.
6. **상태 머신** — Stage 전환, 수면/삐침 같은 상태는 명시적 FSM. if 체인 금지.

### 14.2 src/ 디렉토리 (목표 구조)

```
src/
├─ Game.js                        ── 부트스트랩 + 메인 루프
│
├─ assets/                        ── 에셋 추상화
│  ├─ SpriteCatalog.js            ── MANIFEST.json 로더 + 키 → 경로 + 프리로드
│  └─ SoundCatalog.js             ── 동일 + Web Audio 통합
│
├─ state/                         ── 순수 데이터 + I/O
│  ├─ GameState.js                ── bond/mood/energy/personality/stage (순수)
│  ├─ SaveManager.js              ── 3-파일 I/O (save.json + memory.md + drift_log.json) + autosave 30s
│  ├─ MemoryFile.js               ── memory.md 읽기/추가/요약 (50줄 cap)
│  ├─ EventBus.js                 ── publish/subscribe (의존성 0)
│  └─ events.js                   ── 이벤트 이름 상수 (typo 방지)
│
├─ engine/                        ── 반응 결정 (순수 함수)
│  ├─ IntentClassifier.js         ── 텍스트 → intent (11종 + unknown)
│  ├─ ReactionTable.js            ── intent × personality × state → reaction
│  ├─ rules/                      ── 외부 룰 데이터
│  │  ├─ intents.json             ── 11 intent 키워드/가중치
│  │  ├─ reactions.json           ── intent별 conditions + default
│  │  └─ sounds.json              ── 9 emotion 의성어 풀
│  ├─ LocalEngine.js              ── react/reactPat/reactClick (3s 쿨다운)
│  ├─ DriftTracker.js             ── Phase 3 패턴 감지 + drift_log 관리 + 누적 적용 (30일 보관)
│  └─ ReactionEngine.js           ── 인터페이스 (v2 LLMAdapter 확장 지점)
│
├─ render/                        ── DOM/CSS 렌더링 (5레이어)
│  ├─ Stage.js                    ── 5레이어 컨테이너 + Z-index 관리
│  ├─ BodyLayer.js                ── Layer 1A 바디 + transform
│  ├─ LegLayer.js                 ── Layer 1B 다리 (정적/프레임)
│  ├─ EyesLayer.js                ── Layer 2 표정 + 깜빡임 + look_at
│  ├─ DynamicLayer.js             ── Layer 3 (Phase 3 동적 장식)
│  └─ EffectsLayer.js             ── Layer 4 이펙트 파티클
│
├─ animation/                     ── 시간 기반 동작
│  ├─ Animator.js                 ── CSS 애니메이션 큐 + idle 복귀
│  ├─ IdleScheduler.js            ── 30~120s 랜덤 + 행동 풀 + 가중치
│  ├─ Transition.js               ── 시퀀스 인터프리터 (timeline 실행)
│  └─ sequences/                  ── 선언적 시퀀스 정의
│     ├─ opening.json
│     ├─ birth.json               ── Stage 1 → 2
│     ├─ growth.json              ── Stage 2 → 3
│     └─ ending.json
│
├─ audio/                         ── 사운드 재생
│  └─ SoundPlayer.js              ── 재질별 음색 변형 + 동시재생 제한
│
├─ ui/                            ── 사용자 인터페이스
│  ├─ VoidUI.js                   ── 보이드 채팅 입력
│  ├─ TextOverlay.js              ── 오프닝/엔딩 텍스트
│  ├─ DebugPanel.js               ── Ctrl+Shift+D
│  └─ WidgetMover.js              ── 위젯 위치/탈출 제어 (IPC window:set-bounds)
│
└─ util/
   ├─ math.js                     ── clamp, random, lerp, weightedPick
   ├─ time.js                     ── now, durationSince
   └─ logger.js                   ── 디버그 로그 (배포 시 비활성)
```

### 14.3 핵심 데이터 흐름

```
[유저 입력] (채팅/클릭/쓰다듬기)
      │
      ▼
[VoidUI / Mouse 핸들러]
      │   emit('input:chat', text)
      ▼
[EventBus]
      │
      ├──► [LocalEngine] ──► [ReactionTable] ──► reaction {emotion, sound, action, eyes}
      │                                                 │
      │                                                 ▼
      │                                           emit('reaction:produced', reaction)
      │
      ├──► [GameState] (effects 적용: bond/mood/energy 변동)
      │         emit('state:changed', delta)
      │
      ├──► [Animator] (action 큐잉) ──► [BodyLayer/LegLayer]
      ├──► [EyesLayer] (eyes 교체)
      ├──► [SoundPlayer] (sound 재생)
      └──► [SaveManager] (debounced 자동 저장)


[타이머 1분 tick]
      │
      ▼
[GameState] (총 런타임 +1, mood/energy decay)
      │
      ▼
[StageController] (전환 조건 체크)
      │ bond + runtime 충족
      ▼
[Transition] ──► sequences/birth.json 또는 growth.json 실행
      │
      ▼
[EventBus] emit('stage:advanced', from, to)
```

### 14.4 파일별 단일 책임 요약

| 모듈 | 역할 | 의존성 |
|------|------|--------|
| `EventBus` | publish/subscribe | 없음 |
| `GameState` | 순수 데이터 + getter (crackPhase, isAsleep) | EventBus |
| `SaveManager` | 직렬화/역직렬화/autosave | GameState, IPC |
| `SpriteCatalog` | MANIFEST 로더 + 경로 해석 + 프리로드 | 없음 |
| `SoundCatalog` | 동일 + Web Audio 디코드 캐시 | 없음 |
| `IntentClassifier` | 텍스트 → intent (rules/intents.json) | 없음 (순수) |
| `ReactionTable` | intent × ctx → reaction (rules/reactions.json) | 없음 (순수) |
| `LocalEngine` | react/reactPat/reactClick + 쿨다운 | IntentClassifier, ReactionTable, EventBus |
| `DriftTracker` | 일별 패턴 집계 + drift 갱신 | GameState (read), 자정 트리거 |
| `Stage` | 5레이어 DOM 컨테이너 setup | DOM only |
| `BodyLayer/LegLayer/EyesLayer/DynamicLayer/EffectsLayer` | 각 레이어 표시 | SpriteCatalog, GameState (read) |
| `Animator` | CSS 클래스 큐 + idle 복귀 | EventBus |
| `IdleScheduler` | 행동 풀 가중치 선택 → Animator | GameState (read), Animator |
| `Transition` | sequences/*.json 인터프리터 | Animator, SoundPlayer, EventBus |
| `SoundPlayer` | 재질 음색 + 채널 제한 | SoundCatalog, GameState (read material) |
| `VoidUI` | 채팅 입력 → emit | EventBus |
| `TextOverlay` | 오프닝/엔딩 텍스트 페이드 | EventBus |
| `DebugPanel` | 시간 가속/bond 직접 설정 | GameState, EventBus |
| `WidgetMover` | IPC bound 제어 (탈출/이동) | preload IPC |

### 14.5 외부 룰 데이터 (코드와 분리)

| 파일 | 내용 | 수정 주기 |
|------|------|----------|
| `src/engine/rules/intents.json` | 11 intent 키워드/가중치 | 자주 |
| `src/engine/rules/reactions.json` | intent × 성격 조건부 + default | 자주 |
| `src/engine/rules/sounds.json` | 9 emotion × 의성어 풀 | 가끔 |
| `src/animation/sequences/opening.json` | 오프닝 timeline | 가끔 |
| `src/animation/sequences/birth.json` | 탄생 시퀀스 | 가끔 |
| `src/animation/sequences/growth.json` | 진화 시퀀스 | 가끔 |
| `src/animation/sequences/ending.json` | 엔딩 시퀀스 | 가끔 |
| `sprite/MANIFEST.json` | 모든 에셋 카탈로그 | 에셋 추가 시 |

이 파일들은 코드 변경 없이 게임 밸런스/연출 조정 가능.

### 14.5.1 시퀀스 인터프리터 명세 (결정 #4 확정)

**액션 8종 (`do`):**
| do | 의미 | 주요 필드 |
|----|------|----------|
| `anim` | CSS 애니메이션 클래스 적용 | target, name, duration |
| `sound` | 사운드 재생 | key (SoundCatalog 참조) |
| `fx` | Canvas 이펙트 발동 (Layer 4) | key, duration |
| `fade` | opacity 트랜지션 | target, from, to, duration |
| `swap` | 스프라이트 src 교체 | target, to (key 표현식, 변수 치환 가능) |
| `emit` | EventBus 발행 | event, payload |
| `text` | 오프닝/엔딩 텍스트 | content, duration, fade_in/out |
| `wait` | 명시적 대기 (다음 step `at` 가드) | duration |

**변수 치환 (정적 4개):**
- `{material}` `{color}` `{shape}` `{eye_type}` — GameState.meum에서 조회
- 동적 값 (personality.energy 등) 미지원. 시퀀스는 고정 연출.
- 인터프리터: 단순 정규식 치환 (`/\{(\w+)\}/g`).

**실행 정책:**
- 같은 `at` 값을 가진 step들 → **병렬 디스패치** (anim + sound 동시 시작)
- 각 step은 fire-and-forget (`duration` 후 자체 종료)
- 시퀀스 재생 중 다른 시퀀스 트리거 → **큐잉** (동시 재생 X)
- `Transition.cancel()` 호출 시:
  - 진행 중 모든 anim/fx/fade/text에 onCancel (페이드아웃 정리, opacity 리셋)
  - 미실행 step 폐기
  - 큐 비움

**4개 시퀀스 길이:**
| 시퀀스 | 트리거 | 길이 |
|--------|--------|------|
| `opening.json` | 첫 실행 (opening_seen=false) | 6.5s |
| `birth.json` | bond≥15 + runtime≥1440min | 7s |
| `growth.json` | bond≥50 + runtime≥4320min | 5s |
| `ending.json` | stage 3 진입 + ending_seen=false | 12s |

**확장 정책:**
v1에서 부족하다고 판단되면 액션 추가 (예: `tint`, `move`). 변수 치환 범위 확장도 가능. 인터프리터 코어는 ~50줄이라 점진 확장 부담 적음.

### 14.6 시퀀스 timeline 형식 (예시)

```json
{
  "name": "birth",
  "duration_ms": 6500,
  "steps": [
    { "at": 0,    "do": "anim",  "target": "body", "name": "hatch_shake", "duration": 3000 },
    { "at": 0,    "do": "sound", "key": "system.crack_3" },
    { "at": 3000, "do": "fx",    "key": "fx.birth.particles", "duration": 800 },
    { "at": 3000, "do": "fade",  "target": "body", "from": 1, "to": 0, "duration": 500 },
    { "at": 3500, "do": "fx",    "key": "fx.birth.flash", "duration": 200 },
    { "at": 3700, "do": "swap",  "target": "body", "to": "stage2.{material}_{color}" },
    { "at": 3700, "do": "fade",  "target": "body", "from": 0, "to": 1, "duration": 800 },
    { "at": 4500, "do": "anim",  "target": "body", "name": "bounce", "duration": 400 },
    { "at": 4500, "do": "sound", "key": "system.birth" },
    { "at": 5500, "do": "anim",  "target": "eyes", "name": "blink" },
    { "at": 6500, "do": "emit",  "event": "stage:advanced", "payload": { "to": 2 } }
  ]
}
```

이 형식이면 새 시퀀스 추가가 코드 수정 0회.

### 14.7 IPC 인터페이스 (main ↔ renderer)

| 채널 | 방향 | 용도 |
|------|------|------|
| `save:write` | renderer → main | save.json 저장 |
| `save:read` | renderer → main | save.json 로드 |
| `window:set-bounds` | renderer → main | 위젯 위치/크기 변경 (탈출 모드) |
| `window:set-ignore-mouse` | renderer → main | 클릭 통과 토글 |
| `debug:enabled` | renderer → main | 디버그 모드 여부 |
| `path:userData` | renderer → main | userData 디렉토리 경로 |

### 14.8 GameState 스키마 (확정)

```typescript
interface GameState {
  meum: {
    material: Material;            // 'wood' | 'metal' | 'pearl' | 'light' | 'doll' | 'robot'
    color: string;                 // 재질별 색상
    shape: Shape;                  // 'bear' | 'cat_ear' | ...
    eye_type: EyeType;             // 6종 중 1
    personality: {
      base:  { courage: number; energy: number; curiosity: number };  // -1.0 ~ +1.0
      drift: { courage: number; energy: number; curiosity: number };  // -0.3 ~ +0.3
    };
  };
  state: {
    stage: 1 | 2 | 3;
    bond: number;                  // 0~100, 절대 감소 X
    mood: number;                  // -10~+10, 시간경과 0 수렴
    energy: number;                // 0~100, 분당 -0.1, 수면 +5
    total_runtime_minutes: number;
    last_active: ISO8601;
    opening_seen: boolean;
    ending_seen: boolean;
    sleeping: boolean;             // FSM 상태
    sulking: boolean;              // 삐침
  };
  window: { x: number; y: number };
  drift_log?: {                    // Phase 3 이후 활성
    daily_patterns: Record<DateISO, PatternFlags>;
    last_drift_update: ISO8601;
  };
}
```

### 14.9 사용자 결정이 필요한 설계 포인트 (다음 세션)

1. **레이어 구현 매체**: 5레이어 모두 `<img>` overlay vs Canvas 단일?
   - 추천: `<img>` overlay (CSS 호환성, 쉬운 디버깅, 픽셀아트는 GPU 가속 만으로도 충분)
2. **눈 위치 보정**: 형태별 좌표가 디자인 상수인가, 아니면 각 head 스프라이트가 미리 정렬됐다고 가정할 것인가?
   - 추천: head는 정렬됐다고 가정 + eyes만 형태별 offset 보정
3. **leg_frames 정적/프레임 운영 방식**: v1은 정적만? Stage 3 진입 시 frame으로 자동 전환?
   - 추천: v1 정적 only, "걷기"가 필요한 탈출 모드만 4프레임 사용 (점진 도입)
4. **시퀀스 인터프리터**: 위 timeline JSON 형식 OK? 더 단순/복잡?
   - 추천: 위 형식으로 시작, 부족하면 점진 확장
5. **사운드 라이브러리**: 자체 제작 vs 무료 (Freesound, BFXR, ChipTone)?
   - 추천: BFXR/ChipTone로 단시간 자체 생성 (8bit 일관성)
6. **drift 감지 시점**: 자정마다 (Electron이 안 켜져있으면 못 함) vs 매 세션 시작 시 누적 계산?
   - 추천: 세션 시작 시 마지막 갱신 이후 경과 일수만큼 일괄 처리
