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
      // dev 캐시 회피용 query (production에선 query 무시되어도 동작 동일)
      this.img.src = `${src}?v=${Date.now()}`;
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

    // stage1/body, stage2/body는 흰 배경 원본 (READ-ONLY).
    // 렌더링은 sprite/nobg/에 있는 배경 제거본을 참조한다.
    // (정식 빌드 폴더 분리는 v0.2 마이그레이션에서 정리.)
    if (stage === 1) {
      // 돌 단계: rock_a → rock_b → rock_c (균열 진행)
      if (material === 'robot') {
        return 'sprite/nobg/stage1/capsule.png';
      }
      const phase = gameState.crackPhase; // 'a', 'b', 'c'
      return `sprite/nobg/stage1/rock_${phase}.png`;
    }

    if (stage === 2) {
      // 구체 단계: material/color.png
      if (material === 'robot') {
        // robot은 stage2 전용 에셋 없음 — capsule 유지 (stage1과 동일 외형, 눈만 추가)
        return 'sprite/nobg/stage1/capsule.png';
      }
      return `sprite/nobg/stage2/${material}/${color}.png`;
    }

    // Stage 3: 풀 스프라이트.
    // 디자인 의도는 head + leg 별도 layer 합성이지만 v0.1은 정적 합성 PNG를 단일 img로 표시.
    // sprite/nobg/stage3/는 composite_stage3.py로 stage3/head + stage3/leg/basic.png 미리 합성한 것.
    // LegLayer 별도 애니메이션은 v0.2 (걷기/앉기 등).
    if (material === 'robot') {
      return 'sprite/nobg/stage3/robot/default.png';
    }
    return `sprite/nobg/stage3/${material}/${color}/${shape}.png`;
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
