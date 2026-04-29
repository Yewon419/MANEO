# MANEO 스프라이트 명명 규칙

> 작성일: 2026-04-28
> 목적: 모든 스프라이트의 경로/이름 단일 규칙 → 코드와 에셋 사이 모호성 제거
> 단일 진리원: `sprite/MANIFEST.json` (코드는 항상 키로 접근)

---

## 1. 핵심 원칙

1. **snake_case**. 대소문자 혼용 금지.
2. **계층 구조** = `{layer}/{stage}/{variant_path}` — 디렉토리가 시각적 카테고리.
3. **Stage prefix 의무화** — `stage1/`, `stage2/`, `stage3/` 일관 적용.
4. **프레임 번호** = zero-padded 2자리, 언더스코어 prefix: `_01`, `_02`, ..., `_99`.
5. **변형(variant)은 언더스코어 분리**: `gold_warm`, `brown_light`, `blue_neon`.
6. **확장자**: 비주얼 PNG, 사운드 WAV.
7. **코드는 경로를 직접 알지 못한다** — `MANIFEST.json` 키로만 접근.

---

## 2. 디렉토리 구조 (Stage 우선 하이브리드)

```
sprite/
├─ NAMING.md                       ── 이 문서
├─ MANIFEST.json                   ── 단일 진리원 (코드용)
│
├─ stage1/
│  └─ body/{rock_a|rock_b|rock_c|capsule}.png      (4)
│
├─ stage2/
│  └─ body/{material}/{color}.png                   (15, 다리 없는 원형, render scaleY 1.35)
│
├─ stage3/                         ── 풀 스프라이트 + 레이어 분화
│  ├─ body/{material}/{color}/{shape}.png           (80, 원본)
│  ├─ head/{material}/{color}/{shape}.png           (80, 분리본)
│  ├─ leg/                                           (정적 v1 fallback)
│  │  ├─ basic.png                                   (wood/doll/metal/pearl/light 공용)
│  │  └─ robot/default.png                           (robot 전용)
│  └─ leg_frames/{shape}/{action}_{nn}.png          (미제작 126: 7형태 × 18프레임)
│     ├─ action ∈ {stand, walk, run, sit_down, stand_up, sit}
│     ├─ shape ∈ {bear, cat_ear, dog, notch, rectangle, teardrop, lantern}
│     └─ robot은 정적만 (v2 deferred)
│
├─ eyes/                           ── 공용 (stage 무관, 미제작 ~55장)
│  ├─ {eye_type}/{expression}.png                   (6 × 8 = 48)
│  │  ├─ eye_type ∈ {dot, half_moon, big_circle, asymmetric, empty_circle, vertical_oval}
│  │  └─ expression ∈ {default, happy, sad, surprised, sleepy, closed, angry, half_closed}
│  └─ robot/{expression}.png                        (7, robot 화면 패턴)
│
├─ fx/                             ── 공용 (Layer 4 이펙트, 미제작)
│  ├─ crack/{nn}.png                                (균열 진행 6프레임)
│  ├─ birth/flash.png + particle_{nn}.png           (탄생 1+4)
│  ├─ growth/glow.png + explode_{nn}.png            (진화 1+6)
│  ├─ ending/vignette.png                           (엔딩 비네트)
│  └─ sparkle/{nn}.png                              (일반 반짝이 4)
│
├─ dynamic/                        ── 공용 (Layer 3 Phase 3, 미제작)
│  ├─ sprout/{nn}.png
│  ├─ ribbon/{color}.png
│  ├─ sparkle/{nn}.png
│  └─ {topic}/{variant}.png                         (관심사 반영, 예: cat_ear_ribbon.png)
│
├─ nobg/                           ── (작업용, 배포 미포함) 배경 제거 중간 산출물
│  ├─ stage1/{...}.png
│  ├─ stage2/{material}/{color}.png
│  └─ stage3/{material}/{color}/{shape}.png         (현재 비어있음)
│
├─ scripts/                        ── 에셋 처리 도구 (Python)
│  ├─ remove_bg.py
│  ├─ split_head_leg.py
│  ├─ split_light.py
│  ├─ split_stage2.py              (DEPRECATED — Stage 2 컨셉 변경으로 무용)
│  └─ split_sprites.py
│
├─ reference/                      ── 컨셉 레퍼런스 이미지
│
└─ _archive/                       ── (코드/스크립트 참조 X) 보관 자료
   ├─ sample/                       ── 사용자 제공 raw 자료 (IMG_*.PNG 18장)
   └─ stage2_with_legs/             ── stage2 구컨셉 원본 (다리 포함 oval, 15장)
```

```
sound/                             ── (별도 루트, 미제작 ~35~40개)
├─ sfx/{category}/{nn}.wav
│  └─ category ∈ {happy, excited, sad, confused, scared, sleepy, purr, neutral, angry}
├─ sfx/robot/{category}_{nn}.wav   ── robot 별도 세트
└─ system/{event}.wav
   └─ event ∈ {birth, crack_1, crack_2, crack_3, growth, ending, opening}
```

---

## 3. 카테고리 정의

### 3.1 재질 (material)
`wood, metal, pearl, light, doll, robot`

### 3.2 색상 (color, 재질별)
| 재질 | 색상 |
|------|------|
| wood | brown_light, brown_medium, gray |
| metal | gold, gold_warm, platinum |
| pearl | pink, white |
| light | blue_neon, cream, white |
| doll | beige, brown, navy, pink |
| robot | default |

### 3.3 형태 (shape, Stage 3 전용)
> Stage 2는 형태 분화 없음 — 다리 없는 단일 원형. 형태는 Stage 3 진입 시 결정/표시.
| 재질 | 형태 |
|------|------|
| wood | bear, cat_ear, dog, notch, rectangle, teardrop |
| metal | bear, cat_ear, dog, notch, rectangle, teardrop |
| pearl | bear, cat_ear, dog, notch, teardrop |
| light | bear, cat_ear, dog, lantern, notch, rectangle, teardrop |
| doll | bear, cat_ear, dog |
| robot | default |

### 3.4 눈 타입 (eye_type)
`dot, half_moon, big_circle, asymmetric, empty_circle, vertical_oval`

### 3.5 표정 (expression)
`default, happy, sad, surprised, sleepy, closed, angry, half_closed`

### 3.6 동작 (action, 다리 프레임용)
`stand, walk, run, sit_down, stand_up, sit`
- **sleep는 별도 다리 프레임 없음**: sit + body rotate(15°) + eyes closed로 표현

| action | 프레임 | 루프 | Stage 2 oval | Stage 3 |
|--------|--------|------|--------------|---------|
| stand | 2 | loop (호흡) | ✓ | ✓ |
| walk | 4 | loop | ✗ (bounce 갈음) | ✓ |
| run | 4 | loop | ✗ | ✓ (walk와 모션 다름) |
| sit_down | 3 | once | ✓ | ✓ |
| stand_up | 3 | once (역재생 X, 별도) | ✓ | ✓ |
| sit | 2 | loop (앉은 호흡) | ✓ | ✓ |

**다리는 검정 실루엣 통일** — robot 제외, 재질/색상 무관. 형태별 1세트로 모든 재질 커버.

### 3.6.1 성격 기반 애니메이션 속도
모든 다리 액션 + 바디 transform은 `effectiveMultiplier`로 속도 자동 조절. 상세는 `MANIFEST.json` `animation_speed` 참조.
- 기본 프레임 간격 100ms × multiplier
- personality.energy / state.energy / state.mood 조합
- IdleScheduler가 walk vs run 선택 시도 동일 축 사용

### 3.7 사운드 카테고리 (category)
`happy, excited, sad, confused, scared, sleepy, purr, neutral, angry`

### 3.8 시스템 이벤트 (event, 사운드)
`birth, crack_1, crack_2, crack_3, growth, ending, opening`

---

## 4. 마이그레이션 이력

### 4.1 1차 (2026-04-28) — Layer 우선 + stage prefix 통일
- `body/{material}/...` → `body/stage3/{material}/...`
- `head/{material}/...` → `head/stage3/{material}/...`
- `leg/{basic.png, light/, robot/}` → `leg/stage3/...`
- `nobg/{material}/...` → `nobg/stage3/{material}/...`
- 분리 스크립트 5개 → `scripts/`로 이동

### 4.2 정리 (2026-04-28 옵션 2)
- `leg/stage2/` 15장 삭제 (Stage 2 다리 없음)
- `leg/stage3/light/` 21장 삭제 (검정 통일)
- `preview/` 2장 삭제
- `sample/` 18장 → `_archive/sample/`

### 4.3 2차 (2026-04-29) — Stage 우선 하이브리드 ★ 현재
- `body/stage1/` → `stage1/body/`
- `body/stage3/` → `stage3/body/`
- `head/stage3/` → `stage3/head/`
- `leg/stage3/` → `stage3/leg/`
- `head/stage2/` → `stage2/body/` (다리 없는 원형 = head를 body로 승격)
- `body/stage2/` → `_archive/stage2_with_legs/` (구 컨셉 원본 보존)
- 빈 `body/`, `head/`, `leg/` 최상위 폴더 제거
- 스크립트 경로 상수 갱신: `parent.parent / "stage3" / "body"` 패턴
- `eyes/`, `fx/`, `dynamic/`은 stage 무관이라 sprite 직속 유지

---

## 5. 코드 접근 패턴 (참고)

```javascript
// 잘못된 예 (경로 하드코딩)
img.src = `sprite/body/stage3/wood/brown_light/bear.png`;

// 권장 (MANIFEST 키로 접근)
img.src = SpriteCatalog.get('body.stage3.wood.brown_light.bear');
// 또는 빌더 패턴
img.src = SpriteCatalog.body.stage3({ material: 'wood', color: 'brown_light', shape: 'bear' });
```

이유:
- 누락 에셋에 대해 fallback / placeholder 적용 가능
- 경로 변경 시 한 곳만 수정
- 에셋 프리로드/캐시 단일 진입점

---

## 6. 미제작 에셋 카운트

| 카테고리 | 개수 | 우선순위 |
|---------|------|----------|
| 눈 (눈 6종 × 8표정 + robot 7) | 55 | 1 (Stage 2부터 필수) |
| 이펙트 (균열/탄생/진화/엔딩/sparkle) | ~22 | 2 |
| 다리 프레임 (Stage 3) | 126 | 2 (검정 통일, 7형태 × 18프레임) |
| 다리 프레임 (Stage 2) | 0 | — (다리 없는 원형 컨셉) |
| 사운드 sfx (9 카테고리) | ~25 | 1 |
| 사운드 robot 별도 | ~10 | 2 |
| 사운드 시스템 이벤트 | 7 | 1 |
| 동적 장식 (Phase 3) | 가변 | 4 (엔드 컨텐츠) |

**총 ~250장 + ~42 사운드 미제작.**
