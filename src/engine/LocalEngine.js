// LocalEngine.js — ReactionEngine 인터페이스 구현 (v1 로컬)

class LocalEngine {
  constructor() {
    this.classifier = new IntentClassifier();
    this.table = new ReactionTable();
  }

  /**
   * 유저 입력 → ReactionResult
   * @param {string} input — 유저가 보이드에 입력한 텍스트
   * @param {GameState} gameState
   * @returns {ReactionResult}
   */
  react(input, gameState) {
    // Stage 1 (돌) — 채팅에 대해 미세 흔들림만
    if (gameState.stage === 1) {
      return {
        emotion: 'neutral',
        sound: null,         // 돌은 소리 안 남
        action: 'wobble',
        eyes: null,          // 돌은 눈 없음
        bondDelta: 1,
        moodDelta: 0,
        energyDelta: 0,
        trigger: null,
      };
    }

    const { intent, confidence } = this.classifier.classify(input);
    console.log(`[engine] intent: ${intent} (confidence: ${confidence.toFixed(2)})`);

    const personality = gameState.currentPersonality;
    const state = {
      energy: gameState.energy,
      mood: gameState.mood,
      bond: gameState.bond,
    };

    return this.table.resolve(intent, personality, state);
  }

  /**
   * 쓰다듬기 반응 (로컬 즉시 처리)
   * @param {GameState} gameState
   * @returns {ReactionResult}
   */
  reactPat(gameState) {
    if (gameState.stage === 1) {
      return { emotion: 'neutral', sound: null, action: null, eyes: null,
               bondDelta: 0, moodDelta: 0, energyDelta: 0, trigger: null };
    }

    const p = gameState.currentPersonality;
    if (p.courage < -0.5 && Math.random() < 0.5) {
      return {
        emotion: 'scared', sound: '빅!', action: 'flinch', eyes: 'empty_circle',
        bondDelta: 0.5, moodDelta: -1, energyDelta: 0, trigger: null,
      };
    }
    if (gameState.mood > 0) {
      return {
        emotion: 'happy', sound: '킁킁~', action: 'purr', eyes: 'half_moon',
        bondDelta: 1, moodDelta: 1, energyDelta: 0, trigger: null,
      };
    }
    return {
      emotion: 'neutral', sound: '음', action: 'wobble', eyes: 'dot',
      bondDelta: 1, moodDelta: 1, energyDelta: 0, trigger: null,
    };
  }

  /**
   * 클릭 반응 (로컬 즉시 처리, 3초 쿨다운)
   * @param {GameState} gameState
   * @returns {ReactionResult | null} — 쿨다운이면 null
   */
  reactClick(gameState) {
    const now = Date.now();
    if (now - gameState._clickCooldown < 3000) {
      return null; // 스팸 방지
    }
    gameState._clickCooldown = now;

    if (gameState.stage === 1) {
      // 돌 클릭 → 균열 진행 연출용 wobble
      return {
        emotion: 'neutral', sound: null, action: 'crack-glow', eyes: null,
        bondDelta: 0.5, moodDelta: 0, energyDelta: 0, trigger: null,
      };
    }

    if (gameState.energy < 20) {
      return {
        emotion: 'sleepy', sound: '하암', action: 'wobble', eyes: 'half_moon',
        bondDelta: 0.5, moodDelta: 0, energyDelta: 0, trigger: null,
      };
    }

    const p = gameState.currentPersonality;
    if (p.courage > 0) {
      return {
        emotion: 'excited', sound: '우와!', action: 'bounce', eyes: 'big_circle',
        bondDelta: 0.5, moodDelta: 1, energyDelta: 0, trigger: null,
      };
    }
    return {
      emotion: 'scared', sound: '빅!', action: 'shrink', eyes: 'empty_circle',
      bondDelta: 0.5, moodDelta: -1, energyDelta: 0, trigger: null,
    };
  }
}
