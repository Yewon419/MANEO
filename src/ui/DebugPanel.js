// DebugPanel.js — 디버그 모드 UI (--dev 전용, Ctrl+Shift+D 토글)

class DebugPanel {
  /**
   * @param {Object} opts
   * @param {HTMLElement} opts.panel — #debug-panel
   * @param {GameState} opts.gameState
   * @param {(action: string) => void} opts.onAction — 'hatch', 'evolve'
   */
  constructor({ panel, gameState, onAction }) {
    this.panel = panel;
    this.state = gameState;
    this.onAction = onAction;
    this._enabled = false;

    this._bindElements();
    this._setupEvents();
  }

  _bindElements() {
    this.bondSlider = document.getElementById('dbg-bond');
    this.bondVal = document.getElementById('dbg-bond-val');
    this.moodSlider = document.getElementById('dbg-mood');
    this.moodVal = document.getElementById('dbg-mood-val');
    this.energySlider = document.getElementById('dbg-energy');
    this.energyVal = document.getElementById('dbg-energy-val');
    this.stageSelect = document.getElementById('dbg-stage');
    this.hatchBtn = document.getElementById('dbg-hatch');
    this.evolveBtn = document.getElementById('dbg-evolve');
  }

  _setupEvents() {
    // Ctrl+Shift+D 토글
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        this.toggle();
      }
    });

    // 슬라이더 변경
    this.bondSlider.addEventListener('input', () => {
      const v = parseInt(this.bondSlider.value, 10);
      this.state.bond = v;
      this.bondVal.textContent = v;
    });
    this.moodSlider.addEventListener('input', () => {
      const v = parseInt(this.moodSlider.value, 10);
      this.state.mood = v;
      this.moodVal.textContent = v;
    });
    this.energySlider.addEventListener('input', () => {
      const v = parseInt(this.energySlider.value, 10);
      this.state.energy = v;
      this.energyVal.textContent = v;
    });

    // Stage 변경
    this.stageSelect.addEventListener('change', () => {
      this.state.stage = parseInt(this.stageSelect.value, 10);
      this.onAction('stage-change');
    });

    // 강제 탄생/진화
    this.hatchBtn.addEventListener('click', () => this.onAction('hatch'));
    this.evolveBtn.addEventListener('click', () => this.onAction('evolve'));
  }

  toggle() {
    this._enabled = !this._enabled;
    this.panel.classList.toggle('hidden', !this._enabled);
    if (this._enabled) {
      this.sync();
    }
  }

  /** 현재 상태를 UI에 반영 */
  sync() {
    this.bondSlider.value = this.state.bond;
    this.bondVal.textContent = this.state.bond;
    this.moodSlider.value = this.state.mood;
    this.moodVal.textContent = this.state.mood;
    this.energySlider.value = this.state.energy;
    this.energyVal.textContent = this.state.energy;
    this.stageSelect.value = this.state.stage;
  }
}
