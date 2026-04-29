// SpriteRenderer.js — 스프라이트 이미지 교체 관리

class SpriteRenderer {
  constructor(imgEl) {
    /** @type {HTMLImageElement} */
    this.img = imgEl;
    this._currentSrc = '';
  }

  /**
   * Stage에 맞는 스프라이트 경로 결정 및 표시
   * @param {GameState} gameState
   */
  render(gameState) {
    const src = this._resolvePath(gameState);
    if (src !== this._currentSrc) {
      this.img.src = src;
      this._currentSrc = src;
      console.log(`[sprite] → ${src}`);
    }
  }

  /**
   * @param {GameState} gameState
   * @returns {string} — 스프라이트 파일 경로
   */
  _resolvePath(gameState) {
    const { stage, material, color, shape } = gameState;

    if (stage === 1) {
      // 돌 단계: rock_a → rock_b → rock_c (균열 진행)
      if (material === 'robot') {
        return 'sprite/body/stage1/capsule.png';
      }
      const phase = gameState.crackPhase; // 'a', 'b', 'c'
      return `sprite/body/stage1/rock_${phase}.png`;
    }

    if (stage === 2) {
      // 구체 단계: material/color.png
      if (material === 'robot') {
        // robot은 stage2 전용 에셋 없음 — capsule 유지 (stage1과 동일 외형, 눈만 추가)
        return 'sprite/body/stage1/capsule.png';
      }
      return `sprite/body/stage2/${material}/${color}.png`;
    }

    // Stage 3: 풀 스프라이트
    if (material === 'robot') {
      return 'sprite/body/robot/default.png';
    }
    return `sprite/body/${material}/${color}/${shape}.png`;
  }

  /** 이미지 페이드인 효과 */
  fadeIn() {
    this.img.classList.remove('fade-out');
    this.img.classList.add('fade-in');
  }

  /** 이미지 페이드아웃 효과 */
  fadeOut() {
    this.img.classList.remove('fade-in');
    this.img.classList.add('fade-out');
  }

  /** 표시 */
  show() {
    this.img.style.display = 'block';
  }

  /** 숨김 */
  hide() {
    this.img.style.display = 'none';
  }
}
