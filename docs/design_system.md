# MANEO 시스템 설계서
> 최종 수정: 2026-04-17
> 상태: v0.2 — 로컬 엔진 메인 + LLM 어댑터 확장 구조 확정

---

## 1. 개발 로드맵 (마감: 5/6 18:00)

| 주차 | 기간 | 마일스톤 | 핵심 산출물 |
|------|------|----------|-------------|
| W1 | 4/17~4/23 | **코어 루프 프로토타입** | Electron 투명 창 + 스프라이트 렌더 + 채팅 → 로컬 엔진 → 반응 표시 |
| W2 | 4/24~4/30 | **성장 + 상태 시스템** | Stage 전환, 눈/표정 교체, bond/mood/energy 반영, memory.md 연동 |
| W3 | 5/1~5/4 | **폴리싱** | 탄생 연출, 파티클, idle 애니메이션, 사운드, 엣지케이스 |
| -- | 5/5~5/6 | **빌드 & 제출** | .exe 패키징, 스크린샷, 소개 문서 |

---

## 2. 인터랙션 모델

### 2.1 입력 채널

| 채널 | 처리 방식 | 설명 |
|------|-----------|------|
| **채팅 (메인)** | 로컬 반응 엔진 | 유저 텍스트 → intent 분류 → 행동 결정 |
| **쓰다듬기** | 로컬 처리 | 마우스 드래그(머리 위) → 즉시 반응. 성격별 반응 차등 |
| **클릭** | 로컬 처리 | 클릭 → 놀라거나 기뻐하거나(성격/mood에 따라) |

### 2.2 채팅 UI — "보이드(void)"

유저의 말을 Meum에게 전달하는 입력 장치.
말풍선이 아니라 **경계가 흐릿한 검정 원** — "속삭이는 구멍".

```
              ┌─────────┐
              │  Meum   │
              │  (위젯) │
              └─────────┘
                          ╭───────────╮
                         (  " 안녕 "   )  ← 보이드: 경계 흐릿한 검정 원
                          ╰───────────╯     유저가 타이핑하면 "" 사이에 채워짐
```

**인터랙션 흐름:**

```
1. Meum 클릭
   → 위젯 근처에 보이드 등장 (페이드인, 0.3초)
   → 보이드 안에 ""만 표시. 커서 깜빡임.

2. 유저 타이핑
   → "" 사이에 글자가 채워짐: "안녕"
   → 보이드 크기는 텍스트 길이에 맞게 부드럽게 조정
   → 최소/최대 크기 제한으로 가독성 유지

3. Enter
   → 텍스트를 반응 엔진에 전달
   → 텍스트 페이드아웃 → 다시 "" 상태로 복귀
   → Meum이 반응 (표정 변화 + 도트 사운드 + 동작)
   → 보이드는 남아있음 → 연속 대화 가능

4. 보이드 닫기
   → 보이드 바깥 아무 곳 클릭 또는 ESC
   → 보이드 페이드아웃 (0.3초)
```

**보이드 디자인:**
- 형태: 원형~타원형 (텍스트가 길면 타원으로 늘어남)
- 배경: 검정, opacity 0.85
- 경계: box-shadow로 blur 처리 (경계가 흐릿하게 번짐)
- 텍스트: 흰색, 픽셀 폰트 (DungGeunMo 등)
- 따옴표 "": 항상 표시, 텍스트 양 옆에 고정
- 위치: Meum 옆, 약간 아래 (위젯 영역 밖)

**서사적 의미:**
이 검정 원은 유저의 목소리가 Meum의 세계에 "개입"하는 통로.
도트아트 Meum과 이질적인 비주얼이 의도적 — 유저는 이 세계 밖의 존재.
Meum은 이 구멍에서 들리는 소리를 듣고 반응하는 것.

**Meum의 반응 표현:**
- 텍스트 일절 없음 (오프닝/엔딩 제외)
- 의성어 = 도트 사운드로만 출력
- 표정 변화 + 동작으로 감정 전달
- "말 못하는 존재"의 정체성 강화

### 2.3 로컬 반응 테이블 (쓰다듬기/클릭)

쓰다듬기와 클릭은 로컬에서 즉시 처리한다.
반응은 현재 mood + 성격 파라미터 기반으로 결정.
**의성어는 텍스트가 아닌 도트 사운드로 출력.**

```
쓰다듬기:
  mood > 0  → eyes: half_moon, sfx: "purr_01", action: "purr"
  mood ≤ 0  → eyes: dot,       sfx: "neutral_01", action: "slow_blink"
  courage < -0.5 → 50% 확률로 sfx: "scared_01", action: "flinch"

클릭:
  courage > 0   → eyes: big_circle, sfx: "surprise_01", action: "bounce"
  courage ≤ 0   → eyes: empty_circle, sfx: "scared_02", action: "shrink"
  energy < 20   → 모든 반응 무시, action: "sleep" 유지
```

### 2.3 돌봄 행위

| 행위 | 트리거 | 효과 |
|------|--------|------|
| 놀아주기 | 채팅 ("놀자", "심심해?" 등) | mood +3, bond +2 |
| 재우기 | 채팅 ("잘자", "자") 또는 energy=0 자동 | energy 회복 시작 (분당 +5) |
| 쓰다듬기 | 마우스 드래그 | mood +1, bond +1 |
| 클릭 | 마우스 클릭 | bond +0.5 (스팸 방지: 3초 쿨다운) |

---

## 3. 상태 시스템

### 3.1 핵심 수치 (3개)

| 수치 | 범위 | 변동 | 역할 |
|------|------|------|------|
| **bond** (친밀도) | 0~100 | 상호작용 시 +1~3 / 감소 없음 | 성장 트리거, 누적 관계 지표 |
| **mood** (기분) | -10~+10 | 상호작용 질에 따라 ±1~3 / 시간 경과 시 0으로 수렴 | 반응 엔진 입력, 표정 결정 |
| **energy** (에너지) | 0~100 | 시간 경과 -1/10분 / 수면으로 회복 | 활동 가능 여부, 졸림 연출 |

### 3.2 상태 전이

```
[정상]  energy > 30, mood > -5
   ↓  energy ≤ 30
[졸림]  눈이 반만 감김, 동작 느려짐, 하품
   ↓  energy ≤ 0 OR 유저가 "자" 명령
[수면]  눈 감김, 가끔 뒤척임. energy +5/분. energy=100이면 기상
   ↓  mood < -5 AND energy > 30
[삐침]  유저 무시 or 장시간 방치 시. 등 돌림. 말 걸면 서서히 회복
```

### 3.3 방치 처리

데스크탑 펫의 핵심: 방치가 **처벌이 아니라 연출**이어야 한다.

- 30분 방치 → 간헐적으로 관심 끄는 행동 (화면 가장자리 기웃, 점프)
- 2시간 방치 → 졸림 → 자연스럽게 수면 진입
- 다음날 복귀 → "기지개" 연출 + mood 0에서 시작 (패널티 아님)
- bond는 **절대 감소하지 않음** — 힐링 게임에서 관계 감소는 스트레스

---

## 4. 게임 플로우 & 성장 시스템

### 4.0 오프닝 시퀀스

최초 실행 시 1회만 재생. save.json에 `opening_seen: true` 기록.

```
1. 검은 화면 (1.5초)
2. 텍스트 페이드인: "Meum — 나의 것" (2초 유지)
3. 텍스트 페이드아웃 (1초)
4. 돌(rock_a) 페이드인 → 게임 시작
```

### 4.1 Stage 전환 조건

| 전환 | 조건 | 예상 소요 | 비고 |
|------|------|-----------|------|
| Stage 1 → 2 | bond ≥ 15 AND 앱 누적 실행 ≥ 24h | 1~3일 | 돌 균열 3단계 → 탄생 |
| Stage 2 → 3 | bond ≥ 50 AND 앱 누적 실행 ≥ 72h | 3~7일 | 구체 → 풀 스프라이트 |

- 앱 누적 실행 시간: 앱이 포커스/백그라운드 무관하게 떠 있는 시간 합산
- 디버그 모드: Ctrl+Shift+D → 시간 100x 가속, bond 직접 설정 (심사용 필수)

### 4.1.1 위젯 영역 & 이벤트 탈출

**기본 원칙: Meum은 항상 같은 자리에 있다. 유저가 찾아다니지 않는다.**

```
평소: 위젯 영역(고정 위치) 내에서만 활동
탈출: 이벤트성으로 위젯 밖에 잠깐 나갔다가 스스로 돌아옴
```

위젯 영역:
- 고정 크기 (예: 200×200px), 유저가 드래그로 위치 지정 가능
- 위치는 save.json에 저장, 다음 실행 시 복원

이벤트 탈출 규칙:
- 위젯 주변 반경(~100px) 이내에서만 이동
- 5~10초 후 자동 귀환 (또는 위젯 영역 클릭 시 즉시 귀환)
- 탈출 중 위젯 원래 자리에 흔적 표시 (빈 자리 + 발자국 등)
- Stage 1(돌)에서는 탈출 없음
- Stage 2에서는 위젯 가장자리에서 삐꼼 (반만 나감)
- Stage 3에서만 본격 탈출 가능

탈출 트리거 (idle 상태에서 확률적 발동):
- mood > 5 AND energy > 50: 신나서 뛰쳐나감 → 위젯 위로 점프 후 복귀
- curiosity > 0.5: 화면 가장자리 탐색 → 돌아와서 big_circle 눈
- bond > 70: 유저 커서 방향으로 삐꼼 나와서 쳐다봄

구현: 방식 1 (윈도우 위치 이동). BrowserWindow.setBounds()로 처리.
화면 상단 삐꼼 = y를 음수에서 시작, 좌우 = x 오프셋.
alwaysOnTop 레벨: 'floating' (풀스크린 앱 위에는 안 뜸).

### 4.2 Stage별 행동 범위

| Stage | 표시 | 인터랙션 | 비고 |
|-------|------|----------|------|
| **1 (돌)** | 균열돌 rock_a→b→c (robot은 capsule) | 클릭 → 균열 진행 연출, 채팅 → 돌이 미세하게 흔들림 | 쓰다듬기는 무반응 (돌이니까) |
| **2 (구체)** | 재질×색상 구체 + 눈 | 채팅·쓰다듬기·클릭 모두 가능. 표정만 변화 | 동작은 bounce/wobble 정도 |
| **3 (풀)** | 재질×색상×형태 + 눈 + 동적 레이어 | 풀 인터랙션. 걷기/앉기/자기 포즈 | Layer 3 동적 변형 활성화 |

### 4.3 Stage 1 균열 진행

```
rock_a (초기) → bond ≥ 5에서 rock_b → bond ≥ 10에서 rock_c → bond ≥ 15 + 시간 조건 → 탄생
robot: capsule (단일) → bond ≥ 15 + 시간 조건 → 탄생
```

### 4.4 엔딩 (Stage 3 도달 시)

> 서사 상세: docs/game_identity.md 참조

Stage 3 도달 직후, 엔딩 시퀀스가 한 번 재생된다.
- Meum이 게임 내에서 **처음이자 유일하게** 텍스트를 보여주는 순간
- 이전까지 의성어만 보여줬던 Meum이 한 줄의 글자를 띄움
- 이후 다시는 텍스트를 보여주지 않음
- 이 장면은 스킵 불가, 1회만 재생

### 4.5 엔드 컨텐츠 (엔딩 이후 = 진짜 본편)

엔딩 이후부터 다음이 해금된다:

**유저 플레이 반영 시스템:**
- 대화 패턴 추적 → Meum 습관에 반영
  - 밤에 자주 말 걸기 → Meum 야행성화
  - 위로 많이 해주기 → Meum이 유저 부재 시 걱정 행동
  - 장난 많이 치기 → Meum이 먼저 장난 걸기
- 반영은 점진적이고, 유저에게 명시적으로 알리지 않음
- "왜인지 모르겠는데 나를 닮아간다"는 느낌이 목표

**동적 스프라이트 변화:**
- bond 75+: Layer 3 악세사리 추가 (싹, 리본, 반짝이 등)
- bond 90+: 유저 관심사 반영 요소 (로컬 메모리 기반)
- 변화는 알림 없이 자연스럽게 나타남

---

## 5. 캐릭터 생성 (탄생 시 랜덤)

### 5.1 재질 × 색상 × 형태 매트릭스

실제 에셋 기준 매핑:

| 재질 | 색상 | 허용 형태 |
|------|------|-----------|
| wood | brown_light, brown_medium, gray | bear, cat_ear, dog, notch, rectangle, teardrop |
| metal | gold, gold_warm, platinum | bear, cat_ear, dog, notch, rectangle, teardrop |
| pearl | pink, white | bear, cat_ear, dog, notch, teardrop |
| light | blue_neon, cream, white | bear, cat_ear, dog, lantern, notch, rectangle, teardrop |
| doll | beige, brown, navy, pink | bear, cat_ear, dog |
| robot | default | (단일 형태) |

> 총 조합: wood(18) + metal(18) + pearl(10) + light(21) + doll(12) + robot(1) = **80가지**

### 5.2 눈 타입 (6종)

| ID | 스타일 | 성격 가중치 |
|----|--------|-------------|
| dot | 점 두 개 | energy -0.3, curiosity -0.2 |
| half_moon | 반달 | energy -0.4, courage +0.1 |
| big_circle | 큰 동그라미 | curiosity +0.4, energy +0.2 |
| asymmetric | 비대칭 | courage +0.4, curiosity +0.2 |
| empty_circle | 속 빈 원 | courage -0.4, curiosity -0.2 |
| vertical_oval | 세로 타원 | courage +0.2, energy +0.3 |

### 5.3 재질별 성격 가중치

| 재질 | courage | energy | curiosity |
|------|---------|--------|-----------|
| wood | 0.0 | -0.2 | -0.1 |
| metal | +0.1 | 0.0 | -0.2 |
| pearl | -0.2 | -0.1 | +0.1 |
| light | -0.1 | +0.2 | +0.3 |
| doll | -0.1 | 0.0 | +0.1 |
| robot | +0.3 | +0.3 | +0.4 |

### 5.4 성격 최종 계산

```
base = random(-0.3, +0.3)  // 3축 각각
final = clamp(base + eye_weight + material_weight, -1.0, +1.0)
```

> 성격 축별 행동 매핑 상세: docs/personality_system.md 참조

---

## 6. 반응 엔진 (하이브리드 아키텍처)

### 6.0 설계 원칙

```
v1 (공모전): 로컬 엔진만으로 완전 동작. LLM 없이 배포.
v2 (상용화): LLM 어댑터 연결 → 구독권 유저만 활성화.
```

코드 구조에서 로컬 엔진과 LLM 어댑터는 동일한 인터페이스를 구현한다.
어떤 엔진이든 입력을 받고 ReactionResult를 반환하는 구조.

```
                     ┌─────────────────┐
  유저 채팅 입력 ──→ │  ReactionEngine  │ (인터페이스)
                     │  .react(input)   │
                     └────┬────────┬────┘
                          │        │
               ┌──────────┘        └──────────┐
               ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │  LocalEngine     │             │  LLMAdapter      │
    │  (v1 기본)       │             │  (v2 구독)       │
    │  키워드 매칭     │             │  Claude/Gemini   │
    │  + 성격 반응표   │             │  API 호출        │
    └─────────────────┘             └─────────────────┘
```

### 6.1 로컬 반응 엔진 (v1 — 공모전 버전)

#### Intent 분류

키워드 포함 여부로 intent를 분류한다. 매칭 실패 시 "unknown" intent.

```javascript
// 분류 우선순위: weight가 높은 intent부터 평가
const INTENTS = {
  sleep:   { keywords: ["자","잘자","굿나잇","졸","재워"],              weight: 1.0 },
  play:    { keywords: ["놀","심심","재미","장난","게임"],              weight: 1.0 },
  comfort: { keywords: ["힘들","슬퍼","울","괜찮","위로","안아","토닥"], weight: 1.0 },
  praise:  { keywords: ["잘했","예쁘","귀여","좋아","최고","착해"],     weight: 0.9 },
  scold:   { keywords: ["나빠","싫","하지마","안돼","짜증","미워"],     weight: 0.9 },
  greet:   { keywords: ["안녕","하이","왔어","나야","돌아왔","다녀"],   weight: 0.8 },
  goodbye: { keywords: ["잘자","바이","갈게","나중에","끄","종료"],     weight: 0.8 },
  name:    { keywords: ["이름","불러","나는","내 이름"],               weight: 1.2 },
  weather: { keywords: ["날씨","비","눈","더워","추워","맑"],          weight: 0.7 },
  story:   { keywords: ["오늘","학교","회사","시험","일"],             weight: 0.5 },
  question:{ keywords: ["뭐해","뭐야","누구","어디","왜","어때"],     weight: 0.6 },
};
// "story"와 "question"은 weight가 낮아서 다른 intent와 겹치면 밀림
// 매칭 실패 → intent: "unknown"
```

#### 반응 테이블 (intent × 성격)

각 intent에 대해 성격 파라미터 구간별 반응을 정의한다.
mood와 energy도 반응 선택에 영향.

```javascript
// response_table.json 구조 (예: play intent)
{
  "play": {
    "conditions": [
      {
        "if": "personality.energy > 0.3",
        "reaction": {
          "emotion": "excited",
          "sound": "야호!",
          "action": "bounce",
          "eyes": "big_circle"
        }
      },
      {
        "if": "personality.energy < -0.3",
        "reaction": {
          "emotion": "neutral",
          "sound": "음..",
          "action": "slow_blink",
          "eyes": "half_moon"
        }
      },
      {
        "if": "state.energy < 20",
        "reaction": {
          "emotion": "sleepy",
          "sound": "하암..",
          "action": "wobble",
          "eyes": "half_moon"
        }
      }
    ],
    "default": {
      "emotion": "happy",
      "sound": "에헤",
      "action": "bounce",
      "eyes": "half_moon"
    },
    "effects": { "mood_delta": 3, "bond_delta": 2 }
  },
  "unknown": {
    "reactions": [
      { "emotion": "confused", "sound": "끼릿?", "action": "head_tilt", "eyes": "asymmetric" },
      { "emotion": "curious",  "sound": "??",     "action": "head_tilt", "eyes": "big_circle" },
      { "emotion": "neutral",  "sound": "음?",    "action": "wobble",    "eyes": "dot" }
    ],
    "effects": { "bond_delta": 0.5 }
  }
}
```

#### 의성어 변형

같은 emotion이라도 매번 같은 sound면 지루해진다.
emotion별 의성어 풀에서 랜덤 선택 + 성격 가중치.

```javascript
const SOUNDS = {
  happy:    ["뿌잉", "히힛", "에헤", "룰루", "킁킁"],
  excited:  ["냠냠!", "우와!", "야호", "키킥"],
  sad:      ["흑..", "으응..", "슈룹", "..."],
  confused: ["끼릿?", "??", "음?", "에?"],
  scared:   ["빅!", "히잉", "으악", "떨떨"],
  sleepy:   ["하암", "음..", "쿨쿨", "스으"],
  angry:    ["흥!", "으르", "칫", "뿌"],
  neutral:  ["킁", "음", "...", "후"]
};
```

#### 로컬 메모리 시스템

LLM 없이 키워드 기반으로 유저 정보를 추출·저장한다.

```javascript
const MEMORY_PATTERNS = [
  { pattern: /내 이름은?\s*(.+)/,     field: "userName" },
  { pattern: /나\s*(\d+)살/,          field: "userAge" },
  { pattern: /(고양이|강아지|개)\s*(키워|있어|좋아)/, field: "likes", append: true },
  // 반복 키워드 → 자동 "관심사" 등록 (3회 이상 언급 시)
];
```

### 6.2 LLM 어댑터 (v2 — 상용화 시 구독권 전용)

> v1에서는 구현하지 않는다. 인터페이스만 정의해두고 넘어간다.

#### 인터페이스 (v1에서 미리 정의)

```typescript
interface ReactionResult {
  emotion: Emotion;
  sound: string;
  action: Action;
  eyes: EyeType;
  dynamic?: DynamicLayer[];
  effects: {
    bond_delta: number;
    mood_delta: number;
    energy_delta: number;
  };
  memory_update?: string | null;
}

interface ReactionEngine {
  react(input: string, context: MeumContext): Promise<ReactionResult>;
}

// LocalEngine implements ReactionEngine  ← v1
// LLMAdapter implements ReactionEngine   ← v2
```

#### v2 LLM 호출 정책 (참고용, 구현은 상용화 시)

- LocalEngine이 "unknown" intent를 반환했을 때만 LLM fallback
- 연속 입력 debounce: 1초
- 타임아웃: 5초 → 기본 반응 fallback
- 에러 시: 3회 재시도 (exponential backoff) → LocalEngine fallback
- 수치 변동은 LLM 출력을 그대로 쓰지 않고, 허용 범위 내인지 검증 후 적용
- 월간 토큰 캡: 구독 등급별 상한 설정

---

## 7. 데이터 저장

### 7.1 save.json 구조

```json
{
  "version": 1,
  "created_at": "2026-04-17T12:00:00Z",
  "meum": {
    "material": "wood",
    "color": "brown_light",
    "shape": "cat_ear",
    "eye_type": "big_circle",
    "personality": {
      "base":  { "courage": 0.15, "energy": -0.42, "curiosity": 0.71 },
      "drift": { "courage": 0.0,  "energy": 0.0,   "curiosity": 0.0  }
    }
  },
  "state": {
    "stage": 2,
    "bond": 34,
    "mood": 3,
    "energy": 78,
    "total_runtime_minutes": 1840,
    "last_active": "2026-04-17T11:50:00Z",
    "opening_seen": true,
    "ending_seen": false
  }
}
```

### 7.2 memory.md

로컬 메모리 엔진이 키워드 기반으로 유저 정보를 추출·저장.
반응 엔진이 memory_update를 반환하면 자동 추가.
최대 50줄 유지 (오래된 것부터 요약 또는 삭제).

---

## 8. 스프라이트 에셋 매핑

### 8.1 파일 경로 규칙

```
sprite/body/stage1/{rock_a|rock_b|rock_c|capsule}.png
sprite/body/stage2/{material}/{color}.png
sprite/body/{material}/{color}/{shape}.png        ← Stage 3
sprite/body/robot/default.png                      ← robot Stage 3
```

### 8.2 현재 에셋 현황

- Stage 1: 4장 (rock_a, rock_b, rock_c, capsule) ✅
- Stage 2: 15장 (모든 재질×색상) ✅
- Stage 3: 79장 (모든 재질×색상×형태 조합) ✅
- robot: 1장 ✅
- **총 99장**

### 8.3 미제작 에셋

Grok AI로 생성 예정. 상세: docs/animation_system.md §1

**다리 프레임 (~130장):**
- [ ] 형태 7종(cat_ear, bear, dog, notch, rectangle, teardrop, lantern) × 동작 4개(서기/걷기/앉기/자기) × 4프레임
- [ ] Stage 2 구체(oval)용 1세트

**눈 프레임 (~55장):**
- [ ] 눈 6종 × 표정 7개(default/happy/sad/surprised/sleepy/closed/angry)
- [ ] 눈 6종 × 깜빡임 중간(half_closed) 1장씩
- [ ] robot 화면 패턴 7개

**바디 분리 작업:**
- [ ] 기존 바디 99장에서 다리 부분 제거 (투명화)

**이펙트:**
- [ ] Stage 1 균열 이펙트 (파티클 또는 오버레이)
- [ ] 탄생/진화 연출 이펙트

---

## 9. 사운드 시스템

### 9.1 설계 원칙

Meum은 텍스트를 보여주지 않는다. 의성어는 **도트 사운드(8bit/레트로 효과음)**로만 전달.
이것이 "말 못하는 존재"의 정체성을 지키면서도 감정 전달을 가능하게 함.

### 9.2 사운드 카테고리

| 카테고리 | 트리거 | 느낌 | 예상 파일 수 |
|----------|--------|------|-------------|
| **happy** | 긍정 반응 (칭찬, 놀아주기) | 높은 음, 짧고 경쾌한 | 3~4개 |
| **excited** | 강한 긍정 (성장, 탈출) | 더 높은 음, 연속음 | 2~3개 |
| **sad** | 부정 반응 (꾸중, 방치) | 낮은 음, 느리고 하강하는 | 2~3개 |
| **confused** | unknown intent | 올라가다 내려가는 음 (?) | 2~3개 |
| **scared** | 겁쟁이 flinch, 놀람 | 짧고 높은 단음 | 2~3개 |
| **sleepy** | 졸림, 수면 진입 | 느리고 부드러운, 하강 | 2개 |
| **purr** | 쓰다듬기 반응 | 낮은 진동음, 반복 | 2개 |
| **neutral** | 일반 반응 | 중간 톤 단음 | 3~4개 |
| **system** | 탄생, 균열, 성장 | 특수 효과음 | 3~4개 |

**총 예상: 25~30개 효과음 파일**

### 9.3 재질별 음색 변형

같은 카테고리라도 재질에 따라 음색을 달리 한다:

| 재질 | 음색 특성 | 구현 방식 |
|------|-----------|-----------|
| wood | 따뜻하고 통통한, 마림바 느낌 | 기본 사운드 + 약간 낮은 피치 |
| metal | 맑고 차가운, 글로켄슈필 느낌 | 기본 사운드 + 리버브 |
| pearl | 부드럽고 영롱한, 오르골 느낌 | 기본 사운드 + 높은 피치 + 에코 |
| light | 가볍고 반짝이는, 벨 느낌 | 기본 사운드 + 높은 피치 |
| doll | 뭉뚝하고 귀여운, 토이피아노 느낌 | 기본 사운드 + 약간 먹먹한 필터 |
| robot | 전자음, 비프음 느낌 | 별도 사운드 세트 (8bit 신스) |

구현: 기본 사운드 1세트를 만들고, Web Audio API의 playbackRate/필터로 재질별 변형.
robot만 별도 사운드 세트. 이러면 기본 25~30개 + robot 10개 ≈ **35~40개**면 충분.

### 9.4 파일 경로 규칙

```
sound/sfx/{category}/{category}_{nn}.wav    ← 기본 사운드
sound/sfx/robot/{category}_{nn}.wav          ← robot 전용
sound/system/birth.wav                        ← 탄생 연출
sound/system/crack_{1|2|3}.wav               ← 균열 진행
sound/system/growth.wav                       ← Stage 전환
```
