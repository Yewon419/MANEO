// SoundPlayer.js — HTMLAudioElement 단순 래퍼.
// v0.1 정책 (결정 #5): 미니멀 사운드, 일반 인터랙션 무음, 4개 핵심만 + 재질 음색 변형 폐기.
// → SoundPlayer는 ~30줄. Web Audio API 미사용, 동시 재생 정책도 단순 1채널.

class SoundPlayer {
  /**
   * @param {SoundCatalog} catalog
   */
  constructor(catalog) {
    this._catalog = catalog;
    /** @type {HTMLAudioElement|null} — 현재 재생 중 1채널 */
    this._current = null;
    this._volume = 0.7;
  }

  /**
   * 사운드 재생. 진행 중이면 stop 후 새로 재생 (1채널 정책).
   * 미존재 시 사일런트 (예외 X). 사용자가 사운드 다운 안 한 상태도 게임은 동작.
   * @param {string} key
   */
  play(key) {
    const path = this._catalog.resolveFlexible(key);
    if (!path) return;

    this.stop();
    const audio = new Audio(path);
    audio.volume = this._volume;
    audio.addEventListener('error', () => {
      // 파일이 없으면 무음 — 게임 진행은 안 끊김
      console.warn(`[sound] not found: ${key} (${path})`);
    });
    audio.play().catch((e) => {
      // 사용자 제스처 없이 자동 재생 정책 위반 등
      console.warn(`[sound] play blocked: ${key}`, e.message);
    });
    this._current = audio;
  }

  stop() {
    if (this._current) {
      this._current.pause();
      this._current.currentTime = 0;
      this._current = null;
    }
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._current) this._current.volume = this._volume;
  }
}
