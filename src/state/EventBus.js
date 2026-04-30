// EventBus.js — publish/subscribe. 의존성 0.
// 모듈 간 직접 호출 금지 원칙 (PROJECT_STATUS §14.1 #2)을 위한 매개체.

class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._handlers = new Map();
  }

  /** 핸들러 등록. unsubscribe 함수를 반환 */
  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /** 1회만 호출 후 자동 해제 */
  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  /** 핸들러 해제 */
  off(event, handler) {
    const set = this._handlers.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this._handlers.delete(event);
      }
    }
  }

  /** 이벤트 발행. 모든 핸들러를 동기 호출. 핸들러 예외는 다른 핸들러를 막지 않음 */
  emit(event, ...args) {
    const set = this._handlers.get(event);
    if (!set) return;
    // 호출 중 추가/삭제 안전성 위해 스냅샷
    for (const handler of [...set]) {
      try {
        handler(...args);
      } catch (e) {
        console.error(`[event:${event}] handler error:`, e);
      }
    }
  }

  /** 디버그용 — 등록된 이벤트 목록 */
  _debug() {
    const out = {};
    for (const [k, v] of this._handlers) out[k] = v.size;
    return out;
  }
}
