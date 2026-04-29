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

    this._setupEvents();
  }

  _setupEvents() {
    // Enter → 전송
    this.input.addEventListener('keydown', (e) => {
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
  }

  /** 보이드 숨김 */
  hide() {
    this.container.classList.remove('visible');
    setTimeout(() => {
      this.container.classList.add('hidden');
      this._clearInput();
    }, 300); // fade-out 대기
    this._visible = false;
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
    const len = this.input.value.length;
    // 글자 수에 따라 input 너비 조절
    this.input.style.width = Math.max(2, Math.min(160, len * 10 + 2)) + 'px';
    // 길면 타원형으로
    if (len > 4) {
      this.container.classList.add('expanded');
    } else {
      this.container.classList.remove('expanded');
    }
  }
}
