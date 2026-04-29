// Animator.js — CSS 애니메이션 큐 관리

class Animator {
  constructor(spriteEl) {
    /** @type {HTMLElement} */
    this.el = spriteEl;
    this._queue = [];
    this._playing = false;
    this._idleTimer = null;
    this._idleEnabled = false;
  }

  /**
   * 단발 애니메이션 재생. 이전 애니메이션 위에 큐잉.
   * @param {string} name — 'wobble', 'bounce', 'shrink', 'purr', 'flinch', 'crack-glow'
   * @param {number} [durationMs] — 기본값은 CSS에서 결정
   */
  play(name, durationMs) {
    this._queue.push({ name, durationMs });
    if (!this._playing) {
      this._processQueue();
    }
  }

  /** 기본 idle 애니메이션 시작 (breathe) */
  startIdle() {
    this._idleEnabled = true;
    this.el.classList.add('anim-breathe');
  }

  /** idle 멈춤 */
  stopIdle() {
    this._idleEnabled = false;
    this.el.classList.remove('anim-breathe');
  }

  _processQueue() {
    if (this._queue.length === 0) {
      this._playing = false;
      // idle 복귀
      if (this._idleEnabled) {
        this.el.classList.add('anim-breathe');
      }
      return;
    }

    this._playing = true;
    const { name, durationMs } = this._queue.shift();
    const className = `anim-${name}`;

    // idle 잠시 멈춤
    this.el.classList.remove('anim-breathe');

    // 애니메이션 클래스 부착
    this.el.classList.add(className);

    // 애니메이션 끝나면 제거하고 다음 처리
    const onEnd = () => {
      this.el.classList.remove(className);
      this.el.removeEventListener('animationend', onEnd);
      this._processQueue();
    };

    this.el.addEventListener('animationend', onEnd);

    // fallback: animationend가 안 오면 타임아웃으로 해제
    const timeout = durationMs || 2000;
    setTimeout(() => {
      if (this.el.classList.contains(className)) {
        this.el.classList.remove(className);
        this.el.removeEventListener('animationend', onEnd);
        this._processQueue();
      }
    }, timeout + 100);
  }

  /** 모든 애니메이션 즉시 정지 */
  clearAll() {
    this._queue = [];
    this._playing = false;
    const classes = [...this.el.classList].filter(c => c.startsWith('anim-'));
    classes.forEach(c => this.el.classList.remove(c));
  }
}
