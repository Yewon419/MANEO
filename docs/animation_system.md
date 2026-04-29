# MANEO 애니메이션 시스템 설계
> 최종 수정: 2026-04-17
> 참조: design_system.md, personality_system.md

---

## 1. 구현 원칙

**하이브리드 애니메이션: 바디는 CSS transform, 다리·눈은 프레임 애니메이션.**

바디 스프라이트(80종)는 기존 정적 이미지를 그대로 사용.
다리와 눈만 분리해서 프레임 애니메이션으로 제작 (Grok AI로 생성).

```
레이어 구조 (위에서 아래):
┌─────────────────────────────┐
│ Layer 4: 이펙트/파티클       │  Canvas or CSS animation
│ Layer 3: 동적 장식 (Phase 3) │  CSS positioned elements
│ Layer 2: 눈/표정             │  프레임 교체 (6종 × 표정/깜빡임)
│ Layer 1-B: 다리              │  프레임 교체 (형태별 걷기/앉기/자기)
│ Layer 1-A: 바디              │  정적 <img> + CSS transform
└─────────────────────────────┘

바디(1-A)의 CSS transform이 전체 동작(bounce, wobble 등)을 담당.
다리(1-B)는 바디 아래에 붙어서 독립적으로 프레임 재생.
눈(2)은 바디 위에 오버레이, 독립적으로 프레임 교체 + 시선 추적.
```

### 에셋 분리 작업

기존 바디 스프라이트에서 다리를 분리해야 함:
- 바디: 다리 부분을 투명으로 잘라낸 이미지
- 다리: 검정 실루엣이므로 재질 무관, 형태별 1세트만 제작

```
총 프레임 에셋:
  다리: 형태 7종 × 동작 4개(서기/걷기/앉기/자기) × 4프레임 = 112장
        + Stage 2(구체)용 1세트 (4동작 × 4프레임) = 16장
        ≈ 130장

  눈:   6종 × 표정 7개(기본/행복/슬픔/놀람/졸림/감음/화남) = 42장
        + 깜빡임 중간 프레임 (반감김) = 6장
        + robot 화면 패턴 7개 = 7장
        ≈ 55장

  총: ~185장 (Grok AI로 생성)
```

---

## 2. Stage별 애니메이션 목록

### Stage 1 (돌 / 캡슐)

돌은 생명이 없으므로 동작이 극도로 제한적.
"미세한 반응"만으로 "안에 뭔가 있다"는 느낌을 줌.

| 이름 | 트리거 | CSS 구현 | 지속 |
|------|--------|----------|------|
| **idle** | 기본 상태 | 없음. 완전 정지. | - |
| **wobble** | 채팅 입력 시 | rotate: 0° → 2° → -2° → 0° | 0.4초 |
| **crack_glow** | 균열 진행 시 (bond 5, 10) | box-shadow 펄스 (미세한 빛 번짐) | 1초 |
| **hatch_shake** | 탄생 직전 (bond ≥ 15 + 시간) | rotate 진폭 점점 커짐: ±2° → ±5° → ±10° | 3초 |

- 클릭 → wobble (같은 반응)
- 쓰다듬기 → 무반응 (돌이니까)
- 눈 레이어 없음
- 사운드: wobble 시 둔탁한 stone 사운드

### Stage 2 (구체 + 눈)

눈이 생김. 표정 변화 가능. 동작은 아직 단순.
"살아있다"는 첫 느낌.

| 이름 | 트리거 | CSS 구현 | 지속 |
|------|--------|----------|------|
| **idle** | 기본 상태 | translateY: 0 → -3px → 0 (미세 호흡) | 3초 loop |
| **bounce** | 긍정 반응, 클릭(대담) | translateY: 0 → -15px → 0 (ease-out) | 0.4초 |
| **wobble** | 중립 반응, 혼란 | rotate: 0° → 5° → -5° → 0° | 0.5초 |
| **shrink** | 놀람, 클릭(겁쟁이) | scale: 1 → 0.85 → 1 | 0.3초 |
| **slow_blink** | 졸림, 낮은 mood | 눈 레이어 opacity: 1 → 0 → 1 (느리게) | 1.5초 |
| **sleep** | 수면 상태 | 눈 감김(눈 레이어 교체) + translateY 미세 오르내림 | 4초 loop |
| **purr** | 쓰다듬기 (긍정) | scale: 1 → 1.03 → 1 반복 (부풀기) | 0.6초 × 3 |
| **flinch** | 쓰다듬기 (겁쟁이) | translateX: 0 → -8px → 0 (뒤로 빠짐) | 0.2초 |

- walk 없음 (다리가 너무 짧아서, 구체가 굴러가는 건 어색)
- 대신 bounce로 이동 표현 (통통 튀면서 위치 이동)

### Stage 3 (풀 스프라이트 + 눈 + 동적 레이어)

완전한 형태. 모든 동작 가능.

| 이름 | 트리거 | CSS 구현 | 지속 |
|------|--------|----------|------|
| **idle** | 기본 상태 | translateY: 0 → -3px → 0 (호흡) | 3초 loop |
| **bounce** | 긍정, 흥분 | translateY: 0 → -20px → 0 | 0.4초 |
| **bounce_move** | 이동 (탈출, 탐색) | translateX + translateY 조합. 통통 튀면서 이동 | 반복 |
| **wobble** | 혼란, 중립 | rotate: 0° → 8° → -8° → 0° | 0.5초 |
| **head_tilt** | 호기심, unknown intent | rotate: 0° → 12° (기울어진 채 유지 1초 후 복귀) | 1.5초 |
| **shrink** | 놀람, 겁 | scale: 1 → 0.8 → 1 | 0.3초 |
| **flinch** | 겁쟁이 첫 터치 | translateX: 0 → -12px + scale: 0.9 | 0.2초 |
| **purr** | 쓰다듬기 긍정 | scale: 1 → 1.05 → 1 반복 + 미세 rotate | 0.6초 × 3 |
| **sit** | idle 오래 지속 시 | translateY: +5px + scale Y: 0.9 (살짝 찌그러짐) | 0.5초 전환 |
| **sleep** | 수면 | rotate: 15° (기울어짐) + 눈 감김 + 느린 호흡 | 4초 loop |
| **tremble** | 겁쟁이 + 커서 급접근 | translateX: ±2px 고속 반복 (떨림) | 0.5초 |
| **peek** | 탈출 이벤트 (삐꼼) | 컨테이너 위치 이동 + 바디 절반만 노출 | 2~5초 |
| **yawn** | energy 낮을 때 idle | scale: 1 → 1.08 → 1 (기지개) + 눈 변형 | 1.5초 |
| **look_at** | curiosity 높을 때 | 눈 레이어만 커서 방향으로 offset | 실시간 |

---

## 3. 눈 애니메이션

### 3.1 눈 레이어 구조

눈은 바디 위에 오버레이되는 별도 프레임 이미지.
6종 눈 타입 × 표정 변형 + 깜빡임 중간 프레임.

```
sprite/eyes/{eye_type}/{expression}.png

expressions (7종):
  default    — 기본 상태
  happy      — 행복 (half_moon 계열로 변형)
  sad        — 슬픔 (아래로 처짐)
  surprised  — 놀람 (커짐)
  sleepy     — 졸림 (반만 감김)
  closed     — 감음 (수면, 깜빡임 끝)
  angry      — 화남 (찌푸림)

깜빡임 전용:
  half_closed — 반만 감긴 중간 프레임 (깜빡임 트랜지션용)

다리 경로:
sprite/legs/{shape}/stand_{01~04}.png
sprite/legs/{shape}/walk_{01~04}.png
sprite/legs/{shape}/sit_{01~04}.png
sprite/legs/{shape}/sleep_{01~04}.png
sprite/legs/oval/stand_{01~04}.png       ← Stage 2용

robot 화면 패턴:
sprite/eyes/robot/{expression}.png       ← 화면 표시 패턴
```

### 3.2 눈 위치 (바디별)

각 형태마다 눈이 그려질 위치가 다름. config로 관리.

```javascript
// eye_positions.json
{
  "cat_ear":   { "x": 0.50, "y": 0.40 },  // 바디 중심 기준 비율
  "bear":      { "x": 0.50, "y": 0.42 },
  "dog":       { "x": 0.50, "y": 0.45 },
  "teardrop":  { "x": 0.50, "y": 0.35 },
  "notch":     { "x": 0.50, "y": 0.40 },
  "rectangle": { "x": 0.50, "y": 0.40 },
  "lantern":   { "x": 0.50, "y": 0.42 },
  "oval":      { "x": 0.50, "y": 0.45 },  // Stage 2 구체
  "robot":     null                         // robot은 화면이 얼굴, 별도 처리
}
```

### 3.3 눈 애니메이션

| 이름 | 트리거 | 구현 | 지속 |
|------|--------|------|------|
| **blink** | 3~7초 랜덤 간격 | default → closed → default | 0.15초 |
| **expression_change** | 반응 시 | 현재 눈 → 새 표정 눈 (즉시 교체) | - |
| **look_at** | curiosity > 0.3 | 눈 레이어 translateX/Y로 커서 방향 오프셋 (±3px) | 실시간 |
| **squint** | 강한 빛, 놀람 후 | scale: 1 → 0.7 (눈 찡그림) | 0.3초 |

**깜빡임 주기:**
- energy축 < -0.3: 5~10초 간격 (느긋하게)
- energy축 > +0.3: 2~4초 간격 (자주)
- 졸릴 때 (state.energy < 30): 1~2초 간격 + slow_blink

### 3.4 robot 눈 처리

robot은 얼굴이 화면(스크린)이므로 눈 오버레이 대신 **화면 표시 변경**으로 처리.

```
robot 표정 = 화면에 표시되는 패턴
  default:   ─/\─  (심전도 파형)
  happy:     ^  ^  (위로 꺾인 선)
  sad:       v  v  (아래로 꺾인 선)
  surprised: O  O  (원형 파형)
  sleepy:    ─ ─  (약한 직선)
  closed:    (빈 화면, 미세한 글로우만)
  angry:     /\ /\ (날카로운 파형)
```

이건 Canvas로 직접 그리거나, 각 패턴별 작은 이미지로 교체.

---

## 4. 전환 애니메이션 (특수)

### 4.1 탄생 (Stage 1 → 2)

```
1. hatch_shake (3초, 진폭 점점 증가)
2. 균열 이펙트 (파티클 또는 CSS box-shadow 폭발)
3. 돌 스프라이트 → 페이드아웃 (0.5초)
4. 화면 잠깐 하얗게 플래시 (0.2초)
5. 구체 스프라이트 + 눈 → 페이드인 (0.8초)
6. 첫 bounce (0.4초) + 탄생 사운드
7. 눈이 처음으로 깜빡임 — "살아있다"의 첫 신호
```

### 4.2 진화 (Stage 2 → 3)

```
1. 구체가 빛남 (box-shadow glow 증가, 2초)
2. scale: 1 → 1.2 → 0 (빛에 싸여 사라짐, 1초)
3. 짧은 암전 (0.3초)
4. 풀 스프라이트 페이드인 (1초) — 처음으로 형태가 보임
5. idle 호흡 시작
6. 성장 사운드
```

### 4.3 엔딩 (Stage 3 도달 직후, 1회)

```
1. 모든 동작 정지. idle도 멈춤.
2. 화면 서서히 어두워짐 (주변부부터, 2초)
3. Meum만 남음. 유저를 바라봄 (정면 응시, 눈 expression: default)
4. 3초 정적.
5. Meum 위치에서 텍스트 페이드인 (보이드가 아닌 Meum 자신에게서)
   — 이것이 보이드 UI와의 대비. Meum이 처음으로 "자기 목소리"를 냄.
6. 텍스트 3초 유지.
7. 텍스트 페이드아웃 (1초)
8. 화면 밝기 서서히 복원 (1초)
9. Meum idle 재개. 다시는 텍스트를 보여주지 않음.
10. Phase 3 (엔드 컨텐츠) 시작.
```

### 4.4 오프닝 (최초 실행, 1회)

```
1. 검은 화면 (1.5초)
2. 텍스트 "Meum — 나의 것" 페이드인 (1초)
3. 텍스트 유지 (2초)
4. 텍스트 페이드아웃 (1초)
5. 돌(rock_a) 페이드인 (0.8초)
6. 게임 시작
```

---

## 5. idle 스케줄러

입력이 없을 때 자발적 행동을 발생시키는 시스템.

### 5.1 발동 간격

기본: 30초~120초 랜덤 간격
- energy축 > +0.3: 간격 × 0.6 (더 자주)
- energy축 < -0.3: 간격 × 1.5 (덜 자주)
- state.energy < 30: idle 비활성화, 졸림/수면 행동만

### 5.2 행동 풀 (Stage 3 기준)

| 행동 | 가중치 조건 | 설명 |
|------|------------|------|
| **bounce_random** | energy > 0 | 제자리에서 한번 통통 |
| **look_around** | curiosity > 0 | head_tilt + 눈 좌우 이동 |
| **yawn** | state.energy < 50 | 기지개 + 하품 사운드 |
| **sit_down** | energy < 0 | idle에서 sit으로 전환 |
| **peek_out** | courage > 0 AND curiosity > 0.3 | 위젯 탈출 삐꼼 |
| **tremble_look** | courage < -0.3 AND curiosity > 0.3 | 가장자리까지 가다가 떨면서 돌아옴 |
| **nod_off** | state.energy < 30 | 서있다가 고개 떨굼 (졸음) |
| **stare_cursor** | curiosity > 0.5 AND bond > 30 | 유저 커서를 한동안 응시 |
| **approach_cursor** | curiosity > 0.5 AND bond > 70 | 커서 방향으로 살짝 이동 |

### 5.3 Stage 2 idle 풀

Stage 2에서는 동작이 제한적:
- bounce_random, wobble, slow_blink, yawn, nod_off만 가능
- 탈출, sit, look_around 없음

### 5.4 Stage 1 idle 풀

- 없음. 돌은 유저 입력 없이는 절대 움직이지 않음.
- 이 정적함 자체가 "아직 살아있지 않다"를 표현.

---

## 6. CSS 애니메이션 구현 노트

### 6.1 기본 구조

```css
#meum {
  position: absolute;
  transition: transform 0.3s ease-out;
}

#meum .body { /* Layer 1 */ }
#meum .eyes { /* Layer 2 - absolute positioned */ }
#meum .dynamic { /* Layer 3 */ }

/* 애니메이션 클래스 — JS에서 추가/제거 */
.anim-bounce {
  animation: bounce 0.4s ease-out;
}
.anim-wobble {
  animation: wobble 0.5s ease-in-out;
}
.anim-idle-breathe {
  animation: breathe 3s ease-in-out infinite;
}

@keyframes bounce {
  0%   { transform: translateY(0); }
  40%  { transform: translateY(-20px); }
  100% { transform: translateY(0); }
}

@keyframes wobble {
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(8deg); }
  75%  { transform: rotate(-8deg); }
  100% { transform: rotate(0deg); }
}

@keyframes breathe {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}
```

### 6.2 동작 큐 시스템

동시에 여러 동작이 요청될 수 있으므로 큐로 관리:

```javascript
class AnimationQueue {
  queue = [];
  playing = false;

  add(animation) {
    this.queue.push(animation);
    if (!this.playing) this.playNext();
  }

  async playNext() {
    if (this.queue.length === 0) {
      this.playing = false;
      this.setIdle(); // 큐가 비면 idle로 복귀
      return;
    }
    this.playing = true;
    const anim = this.queue.shift();
    await this.play(anim);
    this.playNext();
  }

  play(anim) {
    return new Promise(resolve => {
      element.classList.add(`anim-${anim.name}`);
      setTimeout(() => {
        element.classList.remove(`anim-${anim.name}`);
        resolve();
      }, anim.duration);
    });
  }
}
```

### 6.3 성능 고려

- transform과 opacity만 사용 (GPU 가속, 리플로우 없음)
- will-change: transform 설정
- 스프라이트 이미지는 앱 시작 시 전부 프리로드
- requestAnimationFrame 기반 look_at (커서 추적)

---

## 7. 구현 우선순위 (Week 1 기준)

**반드시 W1:**
1. idle (호흡) — 기본 생존 확인
2. bounce — 가장 범용적인 반응
3. wobble — 두 번째로 자주 쓰임
4. 눈 표정 교체 (default/happy/sleepy 3종만)
5. 깜빡임

**W2:**
6. shrink, flinch, purr — 성격별 반응
7. head_tilt, sit, sleep — idle 행동
8. 탄생/진화 전환 애니메이션
9. look_at (커서 추적)

**W3 (폴리싱):**
10. peek (탈출), tremble, approach_cursor
11. 오프닝/엔딩 시퀀스
12. 파티클 이펙트 (Layer 4)
