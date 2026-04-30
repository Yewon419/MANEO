// SoundCatalog.js — MANIFEST.json의 sound 섹션 로더 + 키 → 경로 매핑.
// v0.1 정책: 미니멀 사운드 4개 (opening / birth / growth / ending). 일반 인터랙션 무음.
// v0.1 실제 사용은 opening + birth만 (growth/ending은 deferred).

class SoundCatalog {
  /**
   * @param {SpriteCatalog} spriteCatalog — 같은 manifest를 공유 (sound 섹션 사용)
   */
  constructor(spriteCatalog) {
    this._catalog = spriteCatalog;
  }

  /**
   * 키로 사운드 경로 반환.
   * @param {string} key — 예: 'opening' / 'birth' (manifest sound.system.<key>)
   * @returns {string|null} — 경로. 미존재 시 null (placeholder 없음 — 무음 처리).
   */
  get(key) {
    if (!this._catalog._loaded) {
      console.warn('[SoundCatalog] get() before SpriteCatalog.load()');
      return null;
    }
    const node = this._catalog._resolve(`sound.system.${key}`);
    if (!node || typeof node !== 'object') {
      console.warn(`[SoundCatalog] unknown sound key: ${key}`);
      return null;
    }
    if (node.exists === false) {
      // v0.1: opening/birth만 존재, 나머지는 false. 사일런트 폴백.
      return null;
    }
    return node.path || null;
  }

  /** 사용 가능 여부 */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * v0.1: 다운로드된 .mp3는 sound/system/이 아니라 assets/sounds/에 둘 가능성.
   * MANIFEST는 sound/system/<key>.wav 가리키지만 실제 파일은 assets/sounds/<key>.mp3.
   * v0.2 빌드 정리에서 MANIFEST의 path를 실제 위치로 갱신하면 이 fallback 제거.
   * @param {string} key
   * @returns {string|null} — 실제 존재하는 첫 번째 후보 (fetch 검증은 Audio.error로)
   */
  resolveFlexible(key) {
    // 1순위: MANIFEST에 등록된 path
    const declared = this.get(key);
    if (declared) return declared;
    // 2순위: assets/sounds/<key>.mp3 (사용자 다운로드 위치)
    return `assets/sounds/${key}.mp3`;
  }
}
