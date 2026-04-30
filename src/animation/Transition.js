// Transition.js — 시퀀스 timeline JSON 인터프리터.
// PROJECT_STATUS §14.5.1 / 결정 #4: 8 액션 (anim/sound/fx/fade/swap/emit/text/wait)
// + 변수치환 + 같은 at 병렬 디스패치 + 시퀀스 큐잉 + cancel().

// target 명칭 → DOM selector
const TARGETS = {
  body:    '#body-sprite',
  overlay: '#opening-overlay',
  text:    '#opening-text',
  eyes:    '#eyes-sprite',  // v0.2 EyesLayer 도입 시 활성
};

class Transition {
  /**
   * @param {Object} deps
   * @param {SpriteCatalog} deps.catalog
   * @param {SoundPlayer}   deps.soundPlayer
   * @param {EventBus}      deps.bus
   * @param {Animator}      [deps.animator] — anim 액션용
   * @param {() => Object}  [deps.varsProvider] — swap 시 변수치환 기본값 (보통 GameState.meum)
   */
  constructor({ catalog, soundPlayer, bus, animator, varsProvider }) {
    this.catalog = catalog;
    this.sound = soundPlayer;
    this.bus = bus;
    this.animator = animator;
    this.varsProvider = varsProvider || (() => ({}));

    /** @type {Array<{seq: Object, resolve: Function}>} */
    this._queue = [];
    this._currentSeq = null;
    /** @type {Set<number>} */
    this._activeTimers = new Set();
    /** @type {Set<HTMLElement>} */
    this._fadingEls = new Set();
  }

  /** 시퀀스 이름으로 fetch 후 재생. Promise는 시퀀스 종료 시 resolve. */
  async play(name) {
    const res = await fetch(`src/animation/sequences/${name}.json`);
    if (!res.ok) throw new Error(`[transition] sequence ${name} load fail: ${res.status}`);
    const seq = await res.json();
    return this._enqueue(seq);
  }

  _enqueue(seq) {
    return new Promise((resolve) => {
      this._queue.push({ seq, resolve });
      if (!this._currentSeq) this._processNext();
    });
  }

  _processNext() {
    const item = this._queue.shift();
    if (!item) {
      this._currentSeq = null;
      return;
    }
    this._currentSeq = item.seq;

    for (const step of item.seq.steps) {
      const id = setTimeout(() => {
        this._activeTimers.delete(id);
        this._executeStep(step);
      }, step.at);
      this._activeTimers.add(id);
    }

    const endId = setTimeout(() => {
      this._activeTimers.delete(endId);
      item.resolve();
      this._processNext();
    }, item.seq.duration_ms);
    this._activeTimers.add(endId);
  }

  _executeStep(step) {
    switch (step.do) {
      case 'anim':  this._anim(step); break;
      case 'sound': this.sound && this.sound.play(step.key); break;
      case 'fx':    /* Canvas Layer 4 — v0.1 deferred */ break;
      case 'fade':  this._fade(step); break;
      case 'swap':  this._swap(step); break;
      case 'emit':  this.bus && this.bus.emit(step.event, step.payload); break;
      case 'text':  this._text(step); break;
      case 'wait':  /* no-op — 다음 step.at이 가드 */ break;
      default:
        console.warn(`[transition] unknown action: ${step.do}`);
    }
  }

  _resolveEl(target) {
    const sel = TARGETS[target] || target;
    return document.querySelector(sel);
  }

  _anim(step) {
    if (!this.animator) return;
    this.animator.play(step.name, step.duration);
  }

  _fade(step) {
    const el = this._resolveEl(step.target);
    if (!el) return;
    el.style.transition = `opacity ${step.duration}ms ease`;
    el.style.opacity = String(step.from);
    this._fadingEls.add(el);
    requestAnimationFrame(() => {
      el.style.opacity = String(step.to);
    });
    const endId = setTimeout(() => {
      this._activeTimers.delete(endId);
      this._fadingEls.delete(el);
    }, step.duration);
    this._activeTimers.add(endId);
  }

  _swap(step) {
    const el = this._resolveEl(step.target);
    if (!el) return;
    const vars = step.vars || this.varsProvider();
    const path = this.catalog.get(step.to, vars);
    // dev cache buster (SpriteRenderer와 동일 정책)
    el.src = `${path}?v=${Date.now()}`;
  }

  _text(step) {
    const el = this._resolveEl('text');
    if (!el) return;
    el.textContent = step.content;
    const fadeIn = step.fade_in || 500;
    const fadeOut = step.fade_out || 500;
    el.style.transition = `opacity ${fadeIn}ms ease`;
    el.style.opacity = '0';
    requestAnimationFrame(() => { el.style.opacity = '1'; });

    const fadeOutAt = step.duration - fadeOut;
    if (fadeOutAt > 0) {
      const id = setTimeout(() => {
        this._activeTimers.delete(id);
        el.style.transition = `opacity ${fadeOut}ms ease`;
        el.style.opacity = '0';
      }, fadeOutAt);
      this._activeTimers.add(id);
    }
  }

  /** 진행 중인 모든 step + 큐 비움 + 페이드/opacity 정리 */
  cancel() {
    for (const id of this._activeTimers) clearTimeout(id);
    this._activeTimers.clear();
    for (const el of this._fadingEls) {
      el.style.transition = '';
    }
    this._fadingEls.clear();
    this._queue = [];
    this._currentSeq = null;
  }

  get isPlaying() {
    return this._currentSeq !== null;
  }
}
