// GameState.js — 게임 상태 관리 (bond, mood, energy, stage, personality)

class GameState {
  constructor(saveData) {
    const d = saveData || {};
    const meum = d.meum || {};
    const state = d.state || {};

    // Meum 정체성 (탄생 시 고정)
    this.material = meum.material || null;
    this.color = meum.color || null;
    this.shape = meum.shape || null;
    this.eyeType = meum.eye_type || null;
    this.personality = meum.personality || {
      base: { courage: 0, energy: 0, curiosity: 0 },
      drift: { courage: 0, energy: 0, curiosity: 0 },
    };

    // 가변 상태
    this.stage = state.stage || 1;
    this.bond = state.bond || 0;
    this.mood = state.mood || 0;
    this.energy = state.energy ?? 100;
    this.totalRuntimeMinutes = state.total_runtime_minutes || 0;
    this.lastActive = state.last_active || new Date().toISOString();
    this.openingSeen = state.opening_seen || false;
    this.endingSeen = state.ending_seen || false;

    // 생성 시각 보존
    this._createdAt = d.created_at || new Date().toISOString();

    // 윈도우 위치
    this.windowPos = d.window || null;

    // 런타임 전용 (저장 안 함)
    this._lastInteraction = Date.now();
    this._clickCooldown = 0;
  }

  /** 현재 성격 = base + drift, clamped to [-1, 1] */
  get currentPersonality() {
    const b = this.personality.base;
    const d = this.personality.drift;
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    return {
      courage: clamp(b.courage + d.courage),
      energy: clamp(b.energy + d.energy),
      curiosity: clamp(b.curiosity + d.curiosity),
    };
  }

  /** bond 증가 (감소 없음) */
  addBond(delta) {
    if (delta <= 0) return;
    this.bond = Math.min(100, this.bond + delta);
  }

  /** mood 변경 [-10, +10] */
  addMood(delta) {
    this.mood = Math.max(-10, Math.min(10, this.mood + delta));
  }

  /** energy 변경 [0, 100] */
  addEnergy(delta) {
    this.energy = Math.max(0, Math.min(100, this.energy + delta));
  }

  /** Stage 전환 조건 체크.
   *  v0.1: 시연 시간 제약상 totalRuntimeMinutes 조건 제거 (bond만으로 전환).
   *        Stage 2→3은 v0.1 scope 외라 비활성. 24h/72h 조건은 v0.2 부활. */
  canAdvanceStage() {
    if (this.stage === 1) {
      return this.bond >= 15;
    }
    return false;
  }

  /** Stage 1 균열 단계 (rock_a → rock_b → rock_c) */
  get crackPhase() {
    if (this.stage !== 1) return null;
    if (this.bond >= 10) return 'c';
    if (this.bond >= 5) return 'b';
    return 'a';
  }

  /** mood의 시간 경과 0 수렴 (-1/5분) */
  tickMoodDecay() {
    if (this.mood > 0) {
      this.mood = Math.max(0, this.mood - 1);
    } else if (this.mood < 0) {
      this.mood = Math.min(0, this.mood + 1);
    }
  }

  /** energy 시간 감소 (-1/10분) */
  tickEnergyDrain() {
    if (this.energy > 0) {
      this.energy = Math.max(0, this.energy - 1);
    }
  }

  /** 수면 중 energy 회복 (+5/분) */
  tickSleepRecover() {
    this.energy = Math.min(100, this.energy + 5);
  }

  /** 직렬화 → save.json 형식 */
  toSaveData() {
    return {
      version: 1,
      created_at: this._createdAt || new Date().toISOString(),
      meum: {
        material: this.material,
        color: this.color,
        shape: this.shape,
        eye_type: this.eyeType,
        personality: this.personality,
      },
      state: {
        stage: this.stage,
        bond: this.bond,
        mood: this.mood,
        energy: this.energy,
        total_runtime_minutes: this.totalRuntimeMinutes,
        last_active: new Date().toISOString(),
        opening_seen: this.openingSeen,
        ending_seen: this.endingSeen,
      },
      window: this.windowPos,
    };
  }
}
