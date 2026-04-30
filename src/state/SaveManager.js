// SaveManager.js — 세이브 로드/저장, 첫 실행 시 캐릭터 생성

const MATERIAL_WEIGHTS = {
  wood:  { courage:  0.0, energy: -0.2, curiosity: -0.1 },
  metal: { courage:  0.1, energy:  0.0, curiosity: -0.2 },
  pearl: { courage: -0.2, energy: -0.1, curiosity:  0.1 },
  light: { courage: -0.1, energy:  0.2, curiosity:  0.3 },
  doll:  { courage: -0.1, energy:  0.0, curiosity:  0.1 },
  robot: { courage:  0.3, energy:  0.3, curiosity:  0.4 },
};

const EYE_WEIGHTS = {
  dot:           { courage:  0.0, energy: -0.3, curiosity: -0.2 },
  half_moon:     { courage:  0.1, energy: -0.4, curiosity:  0.0 },
  big_circle:    { courage:  0.0, energy:  0.2, curiosity:  0.4 },
  asymmetric:    { courage:  0.4, energy:  0.0, curiosity:  0.2 },
  empty_circle:  { courage: -0.4, energy:  0.0, curiosity: -0.2 },
  vertical_oval: { courage:  0.2, energy:  0.3, curiosity:  0.0 },
};

// 재질별 허용 색상·형태 (에셋 기준)
const MATERIAL_OPTIONS = {
  wood:  { colors: ['brown_light','brown_medium','gray'], shapes: ['bear','cat_ear','dog','notch','rectangle','teardrop'] },
  metal: { colors: ['gold','gold_warm','platinum'],       shapes: ['bear','cat_ear','dog','notch','rectangle','teardrop'] },
  pearl: { colors: ['pink','white'],                      shapes: ['bear','cat_ear','dog','notch','teardrop'] },
  light: { colors: ['blue_neon','cream','white'],         shapes: ['bear','cat_ear','dog','lantern','notch','rectangle','teardrop'] },
  doll:  { colors: ['beige','brown','navy','pink'],       shapes: ['bear','cat_ear','dog'] },
  robot: { colors: ['default'],                           shapes: ['default'] },
};

const EYE_TYPES = ['dot', 'half_moon', 'big_circle', 'asymmetric', 'empty_circle', 'vertical_oval'];

// v0.1: robot은 랜덤 풀 제외 (Stage 3 미도달 + 다리/눈 별도 디자인 필요).
// MATERIAL_OPTIONS / MATERIAL_WEIGHTS의 robot 항목은 v0.2 부활 위해 보존.
const V01_RANDOM_MATERIALS = ['wood', 'metal', 'pearl', 'light', 'doll'];

class SaveManager {
  /** 세이브 로드. 없으면 null 반환 */
  static async load() {
    const data = await window.maneo.save.load();
    if (data && data.meum && data.meum.material) {
      return new GameState(data);
    }
    return null;
  }

  /** 새 게임 생성 — 랜덤 캐릭터 */
  static createNew() {
    const material = pickRandom(V01_RANDOM_MATERIALS);
    const opts = MATERIAL_OPTIONS[material];
    const color = pickRandom(opts.colors);
    const shape = pickRandom(opts.shapes);
    const eyeType = pickRandom(EYE_TYPES);

    const personality = generatePersonality(material, eyeType);

    const state = new GameState({
      meum: {
        material,
        color,
        shape,
        eye_type: eyeType,
        personality,
      },
      state: {
        stage: 1,
        bond: 0,
        mood: 0,
        energy: 100,
        total_runtime_minutes: 0,
        last_active: new Date().toISOString(),
        opening_seen: false,
        ending_seen: false,
      },
    });
    state._createdAt = new Date().toISOString();
    return state;
  }

  /** 게임 상태를 디스크에 저장 */
  static async save(gameState) {
    await window.maneo.save.write(gameState.toSaveData());
  }
}

// ── 헬퍼 ──

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function generatePersonality(material, eyeType) {
  const axes = ['courage', 'energy', 'curiosity'];
  const base = {};
  for (const axis of axes) {
    const random = (Math.random() * 0.6) - 0.3;
    const matBias = MATERIAL_WEIGHTS[material][axis];
    const eyeBias = EYE_WEIGHTS[eyeType][axis];
    base[axis] = clamp(random + matBias + eyeBias, -1.0, 1.0);
  }
  return {
    base,
    drift: { courage: 0, energy: 0, curiosity: 0 },
  };
}
