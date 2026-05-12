// VoidUI.js — 보이드(채팅 입력) UI 컨트롤

class VoidUI {
  /**
   * @param {Object} opts
   * @param {HTMLElement} opts.container — #void-ui
   * @param {HTMLInputElement} opts.input — #void-input
   * @param {(text: string) => void} opts.onSubmit — Enter 시 호출
   */
  constructor({ container, input, onSubmit }) {
    this.container = container;
    this.input = input;
    this.onSubmit = onSubmit;
    this._visible = false;
    this._autoHideTimer = null;
    this._autoHideMs = 5000; // 5초 비활성 시 자동 닫힘

    this._setupEvents();
  }

  _setupEvents() {
    // Enter → 전송
    this.input.addEventListener('keydown', (e) => {
      this._scheduleAutoHide();
      if (e.key === 'Enter') {
        e.preventDefault();
        const text = this.input.value.trim();
        if (text.length > 0) {
          this.onSubmit(text);
          this._clearInput();
        }
      }
      if (e.key === 'Escape') {
        this.hide();
      }
    });

    // 입력 길이에 따라 보이드 형태 조정
    this.input.addEventListener('input', () => {
      this._adjustSize();
      this._scheduleAutoHide();
    });

    // 보이드 바깥 클릭 → 닫기
    document.addEventListener('mousedown', (e) => {
      if (this._visible && !this.container.contains(e.target)) {
        // Meum 클릭은 토글이므로 제외 (Game.js에서 처리)
        if (!e.target.closest('#meum-container')) {
          this.hide();
        }
      }
    });
  }

  /** 보이드 표시 */
  show() {
    this.container.classList.remove('hidden');
    // 다음 프레임에서 visible 적용 (transition 발동)
    requestAnimationFrame(() => {
      this.container.classList.add('visible');
      this.input.focus();
    });
    this._visible = true;
    this._scheduleAutoHide();
  }

  /** 보이드 숨김 */
  hide() {
    this._clearAutoHide();
    this.container.classList.remove('visible');
    setTimeout(() => {
      this.container.classList.add('hidden');
      this._clearInput();
    }, 300); // fade-out 대기
    this._visible = false;
  }

  /** 비활성 타이머 (재)예약 — 입력/show 시 호출. ms 후 자동 닫힘 */
  _scheduleAutoHide() {
    this._clearAutoHide();
    this._autoHideTimer = setTimeout(() => {
      if (this._visible) this.hide();
    }, this._autoHideMs);
  }

  _clearAutoHide() {
    if (this._autoHideTimer) {
      clearTimeout(this._autoHideTimer);
      this._autoHideTimer = null;
    }
  }

  /** 토글 */
  toggle() {
    if (this._visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  get isVisible() {
    return this._visible;
  }

  _clearInput() {
    this.input.value = '';
    this._adjustSize();
  }

  _adjustSize() {
    const text = this.input.value;
    const len = text.length;
    // 한글/영문 혼합 너비 추정 — 한글 ~16px, 영문/숫자 ~9px (DungGeunMo 기준)
    let estPx = 0;
    for (const ch of text) {
      // CJK 문자 범위 단순 검사 (한글 가나다 / 한자 / 일본어)
      const code = ch.charCodeAt(0);
      if (code >= 0x3000 && code <= 0x9fff || code >= 0xac00 && code <= 0xd7af) {
        estPx += 16;
      } else {
        estPx += 9;
      }
    }
    // 여유 8px 추가 (text-align: center 시 첫/끝 글자 잘림 방지)
    this.input.style.width = Math.max(2, Math.min(200, estPx + 8)) + 'px';
    if (len > 4) {
      this.container.classList.add('expanded');
    } else {
      this.container.classList.remove('expanded');
    }
  }
}
