// ReactionTable.js — intent × 성격/상태 → ReactionResult

const SOUND_POOL = {
  happy:    ['뿌잉', '히힛', '에헤', '룰루', '킁킁'],
  excited:  ['냠냠!', '우와!', '야호', '키킥'],
  sad:      ['흑..', '으응..', '슈룹', '...'],
  confused: ['끼릿?', '??', '음?', '에?'],
  scared:   ['빅!', '히잉', '으악', '떨떨'],
  sleepy:   ['하암', '음..', '쿨쿨', '스으'],
  angry:    ['흥!', '으르', '칫', '뿌'],
  neutral:  ['킁', '음', '...', '후'],
  love:     ['뿌잉♥', '에헷', '킁킁~', '히힛~'],
};

/**
 * @typedef {Object} ReactionResult
 * @property {string} emotion
 * @property {string} sound
 * @property {string} action  — CSS 애니메이션 이름
 * @property {string} eyes    — 눈 표정 (추후 프레임)
 * @property {number} bondDelta
 * @property {number} moodDelta
 * @property {number} energyDelta
 */

const REACTION_TABLE = {
  greet: {
    conditions: [
      { if: (p, s) => p.energy > 0.3,   reaction: { emotion: 'excited', action: 'bounce', eyes: 'big_circle' } },
      { if: (p, s) => p.courage < -0.3,  reaction: { emotion: 'scared',  action: 'flinch', eyes: 'empty_circle' } },
    ],
    default: { emotion: 'happy', action: 'wobble', eyes: 'half_moon' },
    effects: { bondDelta: 1, moodDelta: 2, energyDelta: 0 },
  },

  play: {
    conditions: [
      { if: (p, s) => s.energy < 20,     reaction: { emotion: 'sleepy', action: 'wobble', eyes: 'half_moon' } },
      { if: (p, s) => p.energy > 0.3,    reaction: { emotion: 'excited', action: 'bounce', eyes: 'big_circle' } },
      { if: (p, s) => p.energy < -0.3,   reaction: { emotion: 'neutral', action: 'wobble', eyes: 'half_moon' } },
    ],
    default: { emotion: 'happy', action: 'bounce', eyes: 'half_moon' },
    effects: { bondDelta: 2, moodDelta: 3, energyDelta: -5 },
  },

  comfort: {
    conditions: [
      { if: (p, s) => p.courage > 0.3,  reaction: { emotion: 'love', action: 'purr', eyes: 'half_moon' } },
      { if: (p, s) => p.courage < -0.3, reaction: { emotion: 'sad', action: 'shrink', eyes: 'empty_circle' } },
    ],
    default: { emotion: 'love', action: 'purr', eyes: 'half_moon' },
    effects: { bondDelta: 3, moodDelta: 2, energyDelta: 0 },
  },

  praise: {
    conditions: [
      { if: (p, s) => p.courage < -0.3, reaction: { emotion: 'scared', action: 'shrink', eyes: 'empty_circle' } },
    ],
    default: { emotion: 'happy', action: 'bounce', eyes: 'big_circle' },
    effects: { bondDelta: 2, moodDelta: 3, energyDelta: 0 },
  },

  scold: {
    conditions: [
      { if: (p, s) => p.courage > 0.3,  reaction: { emotion: 'angry', action: 'wobble', eyes: 'asymmetric' } },
    ],
    default: { emotion: 'sad', action: 'shrink', eyes: 'empty_circle' },
    effects: { bondDelta: 0, moodDelta: -3, energyDelta: 0 },
  },

  sleep: {
    conditions: [],
    default: { emotion: 'sleepy', action: 'wobble', eyes: 'half_moon' },
    effects: { bondDelta: 1, moodDelta: 0, energyDelta: 0 },
    // 특수: 수면 모드 진입 트리거
    trigger: 'sleep',
  },

  goodbye: {
    conditions: [],
    default: { emotion: 'sad', action: 'wobble', eyes: 'half_moon' },
    effects: { bondDelta: 1, moodDelta: -1, energyDelta: 0 },
  },

  name: {
    conditions: [],
    default: { emotion: 'excited', action: 'bounce', eyes: 'big_circle' },
    effects: { bondDelta: 2, moodDelta: 2, energyDelta: 0 },
  },

  weather: {
    conditions: [],
    default: { emotion: 'confused', action: 'wobble', eyes: 'big_circle' },
    effects: { bondDelta: 0.5, moodDelta: 0, energyDelta: 0 },
  },

  story: {
    conditions: [
      { if: (p, s) => p.curiosity > 0.3, reaction: { emotion: 'excited', action: 'bounce', eyes: 'big_circle' } },
    ],
    default: { emotion: 'neutral', action: 'wobble', eyes: 'dot' },
    effects: { bondDelta: 1, moodDelta: 1, energyDelta: 0 },
  },

  question: {
    conditions: [
      { if: (p, s) => p.curiosity > 0.3, reaction: { emotion: 'confused', action: 'bounce', eyes: 'big_circle' } },
    ],
    default: { emotion: 'confused', action: 'wobble', eyes: 'asymmetric' },
    effects: { bondDelta: 0.5, moodDelta: 0, energyDelta: 0 },
  },

  unknown: {
    conditions: [],
    default: { emotion: 'confused', action: 'wobble', eyes: 'asymmetric' },
    effects: { bondDelta: 0.5, moodDelta: 0, energyDelta: 0 },
  },
};

class ReactionTable {
  /**
   * intent + 성격/상태 → ReactionResult
   * @param {string} intent
   * @param {{ courage: number, energy: number, curiosity: number }} personality
   * @param {{ energy: number, mood: number, bond: number }} state
   * @returns {ReactionResult}
   */
  resolve(intent, personality, state) {
    const entry = REACTION_TABLE[intent] || REACTION_TABLE.unknown;

    // 조건부 반응 탐색
    let reaction = null;
    for (const cond of entry.conditions) {
      if (cond.if(personality, state)) {
        reaction = cond.reaction;
        break;
      }
    }
    if (!reaction) {
      reaction = entry.default;
    }

    // 의성어 풀에서 랜덤
    const soundPool = SOUND_POOL[reaction.emotion] || SOUND_POOL.neutral;
    const sound = soundPool[Math.floor(Math.random() * soundPool.length)];

    return {
      emotion: reaction.emotion,
      sound,
      action: reaction.action,
      eyes: reaction.eyes,
      bondDelta: entry.effects.bondDelta,
      moodDelta: entry.effects.moodDelta,
      energyDelta: entry.effects.energyDelta,
      trigger: entry.trigger || null,
    };
  }
}
