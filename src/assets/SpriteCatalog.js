// SpriteCatalog.js — MANIFEST.json 단일 진입점.
// 코드는 항상 키 (예: 'stage1.body.rock_a')로 접근. 경로 하드코딩 금지 (§14.1 #3).
// 미제작 에셋 (exists=false, $status=unimplemented)은 placeholder + console.warn (§14.1 #5).

class SpriteCatalog {
  constructor() {
    this._manifest = null;
    this._loaded = false;
    /** @type {Map<string, HTMLImageElement>} */
    this._imageCache = new Map();
  }

  /** MANIFEST.json fetch. 비동기. */
  async load() {
    const res = await fetch('sprite/MANIFEST.json');
    if (!res.ok) {
      throw new Error(`MANIFEST.json load failed: ${res.status}`);
    }
    this._manifest = await res.json();
    this._loaded = true;
    console.log('[SpriteCatalog] manifest loaded');
  }

  /**
   * 키로 경로 반환. 변수 치환 지원.
   * @param {string} key — dot-separated. 예: 'stage1.body.rock_a' / 'stage2.body' (pattern)
   * @param {Object} [vars] — { material, color, shape, eye_type, phase, ... }
   * @returns {string} — file:// 또는 data: URL. 미존재 시 placeholder (1x1 투명).
   */
  get(key, vars = {}) {
    if (!this._loaded) {
      console.warn('[SpriteCatalog] get() before load()');
      return this._placeholder();
    }
    const node = this._resolve(key);
    if (node === undefined || node === null) {
      console.warn(`[SpriteCatalog] unknown key: ${key}`);
      return this._placeholder();
    }
    if (typeof node !== 'object') {
      console.warn(`[SpriteCatalog] leaf is not an object: ${key} (got ${typeof node})`);
      return this._placeholder();
    }

    // 단일 path 노드
    if (node.path) {
      if (node.exists === false) {
        console.warn(`[SpriteCatalog] not yet implemented: ${key}`);
        return this._placeholder();
      }
      return this._renderPath(node.path, vars);
    }

    // pattern 노드 (변수 치환)
    if (node.pattern) {
      return this._renderPath(node.pattern, vars);
    }

    console.warn(`[SpriteCatalog] no path/pattern for key: ${key}`);
    return this._placeholder();
  }

  /** 사용 가능한지 (path 있고 exists !== false) */
  has(key) {
    if (!this._loaded) return false;
    const node = this._resolve(key);
    if (!node || typeof node !== 'object') return false;
    if (node.path) return node.exists !== false;
    if (node.pattern) return true;
    return false;
  }

  /**
   * 키 목록을 미리 Image()로 로드해 브라우저 캐시에 박는다.
   * @param {Array<[string, Object?]>} entries — [[key, vars?], ...]
   * @returns {Promise<Map<string, 'ok'|'fail'>>}
   */
  async preload(entries) {
    if (!this._loaded) await this.load();
    const results = new Map();
    await Promise.all(entries.map(([key, vars]) => {
      return new Promise((resolve) => {
        const path = this.get(key, vars);
        const img = new Image();
        img.onload = () => {
          results.set(key, 'ok');
          this._imageCache.set(`${key}|${JSON.stringify(vars || {})}`, img);
          resolve();
        };
        img.onerror = () => {
          results.set(key, 'fail');
          console.warn(`[SpriteCatalog] preload fail: ${key} → ${path}`);
          resolve();
        };
        img.src = path;
      });
    }));
    return results;
  }

  /** dot-path로 manifest 트리 탐색 */
  _resolve(key) {
    if (!this._manifest) return null;
    return key.split('.').reduce((acc, k) => {
      if (acc && typeof acc === 'object' && k in acc) return acc[k];
      return null;
    }, this._manifest);
  }

  /**
   * v0.1 임시 라우팅: stage1/2 body 경로를 sprite/nobg/로 swap.
   * 원본 sprite/stage1/body/는 흰배경 READ-ONLY, sprite/nobg/가 alpha 처리됨.
   * v0.2 빌드 정리에서 nobg → 정식 폴더 복사하면 이 라우팅 제거.
   */
  _renderPath(template, vars) {
    let path = template.replace(/\{(\w+)\}/g, (_, k) => {
      if (k in vars) return vars[k];
      return `{${k}}`;
    });
    if (path.startsWith('sprite/stage1/body/')) {
      path = path.replace('sprite/stage1/body/', 'sprite/nobg/stage1/');
    } else if (path.startsWith('sprite/stage2/body/')) {
      path = path.replace('sprite/stage2/body/', 'sprite/nobg/stage2/');
    } else if (path.startsWith('sprite/stage3/body/')) {
      // v0.1 정적 합성본 (head + leg). v0.2 LegLayer 도입 시 분리.
      path = path.replace('sprite/stage3/body/', 'sprite/nobg/stage3/');
    }
    return path;
  }

  /** 1x1 투명 PNG (data URL) */
  _placeholder() {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=';
  }
}
