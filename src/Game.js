// Game.js — 메인 게임 루프. 모든 모듈을 연결한다.

class Game {
  constructor() {
    /** @type {GameState} */
    this.state = null;
    /** @type {LocalEngine} */
    this.engine = new LocalEngine();
    /** @type {Animator} */
    this.animator = null;
    /** @type {SpriteRenderer} */
    this.renderer = null;
    /** @type {VoidUI} */
    this.voidUI = null;
    /** @type {DebugPanel} */
    this.debugPanel = null;

    // 인프라 (D-6 도입, 점진 활용)
    /** @type {EventBus} */
    this.bus = new EventBus();
    /** @type {SpriteCatalog} */
    this.spriteCatalog = new SpriteCatalog();
    /** @type {SoundCatalog} */
    this.soundCatalog = null;
    /** @type {SoundPlayer} */
    this.soundPlayer = null;

    // 타이머
    this._tickInterval = null;
    this._saveInterval = null;
    this._runtimeCounter = null;
  }

  async init() {
    // 0) 카탈로그 로드 (MANIFEST.json)
    await this.spriteCatalog.load();
    this.soundCatalog = new SoundCatalog(this.spriteCatalog);
    this.soundPlayer = new SoundPlayer(this.soundCatalog);

    // 1) 세이브 로드 or 새 게임
    this.state = await SaveManager.load();
    const isNewGame = !this.state;
    if (isNewGame) {
      this.state = SaveManager.createNew();
      console.log('[game] 새 게임 생성:', this.state.material, this.state.color, this.state.shape);
    } else {
      console.log('[game] 세이브 로드. stage:', this.state.stage, 'bond:', this.state.bond);
    }

    // 2) UI 바인딩
    const bodySprite = document.getElementById('body-sprite');
    const meumContainer = document.getElementById('meum-container');

    this.renderer = new SpriteRenderer(bodySprite);
    this.animator = new Animator(meumContainer);

    this.voidUI = new VoidUI({
      container: document.getElementById('void-ui'),
      input: document.getElementById('void-input'),
      onSubmit: (text) => this._handleChat(text),
    });
    // init guard: 의도치 않게 visible 클래스가 박혀있을 가능성 차단
    this.voidUI.container.classList.add('hidden');
    this.voidUI.container.classList.remove('visible');
    this.voidUI._visible = false;

    this.debugPanel = new DebugPanel({
      panel: document.getElementById('debug-panel'),
      gameState: this.state,
      onAction: (action) => this._handleDebugAction(action),
    });

    // 3) Meum 클릭 → 보이드 토글 + 클릭 반응
    meumContainer.addEventListener('click', (e) => {
      if (this.voidUI.isVisible) {
        // 보이드 열려있으면 — 닫기 (Meum 클릭이 토글 역할)
        this.voidUI.hide();
      } else {
        // 보이드 닫혀있으면 — 보이드 열기 + 클릭 반응
        this.voidUI.show();
        this._handleClick();
      }
    });

    // 4) 오프닝 or 바로 시작
    if (isNewGame && !this.state.openingSeen) {
      await this._playOpening();
    } else {
      this._startGame();
    }

    // 5) 주기적 타이머 시작
    this._startTimers();

    // 6) 디버그 모드 자동 열기
    const isDebug = await window.maneo.isDebug();
    if (isDebug) {
      this.debugPanel.toggle();
    }

    console.log('[game] 초기화 완료');
  }

  // ── 오프닝 시퀀스 ──

  async _playOpening() {
    const overlay = document.getElementById('opening-overlay');
    const text = document.getElementById('opening-text');

    overlay.classList.remove('hidden');
    this.renderer.hide();

    // 1.5초 대기
    await wait(1500);

    // 텍스트 페이드인
    text.classList.add('visible');
    await wait(2000);

    // 텍스트 페이드아웃
    text.classList.remove('visible');
    await wait(1000);

    // 오버레이 페이드아웃
    overlay.style.opacity = '0';
    await wait(1000);

    overlay.classList.add('hidden');
    overlay.style.opacity = '';

    this.state.openingSeen = true;
    await SaveManager.save(this.state);

    this._startGame();
  }

  // ── 게임 시작 ──

  _startGame() {
    this.renderer.show();
    this.renderer.render(this.state);
    this.renderer.fadeIn();
    // Stage 1 돌은 정지 (animation_system.md §7.2). Stage 2부터 breathe.
    if (this.state.stage >= 2) {
      this.animator.startIdle();
    }
  }

  // ── 채팅 처리 ──

  _handleChat(text) {
    console.log(`[chat] "${text}"`);

    const result = this.engine.react(text, this.state);
    this._applyReaction(result);
  }

  // ── 클릭 처리 ──

  _handleClick() {
    const result = this.engine.reactClick(this.state);
    if (result) {
      this._applyReaction(result);
    }
  }

  // ── 반응 적용 ──

  _applyReaction(result) {
    console.log('[reaction]', result.emotion, result.action, result.sound);

    // 상태 업데이트
    this.state.addBond(result.bondDelta);
    this.state.addMood(result.moodDelta);
    this.state.addEnergy(result.energyDelta);

    // 애니메이션
    if (result.action) {
      this.animator.play(result.action);
    }

    // 스프라이트 갱신 (균열 진행 등)
    this.renderer.render(this.state);

    // Stage 전환 체크
    this._checkStageAdvance();

    // 디버그 패널 동기화
    this.debugPanel.sync();

    // TODO: 사운드 재생 (result.sound)
    // TODO: 눈 표정 변경 (result.eyes)
  }

  // ── Stage 전환 ──

  _checkStageAdvance() {
    if (this.state.canAdvanceStage()) {
      this._advanceStage();
    }
  }

  _advanceStage() {
    const prev = this.state.stage;
    this.state.stage++;
    console.log(`[stage] ${prev} → ${this.state.stage}`);

    // TODO: 탄생/진화 연출

    this.renderer.render(this.state);

    // Stage 1 → 2 진입 시 breathe 시작
    if (prev === 1 && this.state.stage === 2) {
      this.animator.startIdle();
    }

    // Stage 3 도달 → 엔딩
    if (this.state.stage === 3 && !this.state.endingSeen) {
      this._playEnding();
    }
  }

  async _playEnding() {
    // TODO: 엔딩 연출 구현
    console.log('[ending] 엔딩 시퀀스 재생');
    this.state.endingSeen = true;
    await SaveManager.save(this.state);
  }

  // ── 디버그 액션 ──

  _handleDebugAction(action) {
    switch (action) {
      case 'hatch':
        if (this.state.stage === 1) {
          this.state.stage = 2;
          this.renderer.render(this.state);
          this.animator.startIdle();
          this.debugPanel.sync();
        }
        break;
      case 'evolve':
        if (this.state.stage === 2) {
          this.state.stage = 3;
          this.renderer.render(this.state);
          this.debugPanel.sync();
        }
        break;
      case 'stage-change':
        this.renderer.render(this.state);
        break;
    }
  }

  // ── 주기적 타이머 ──

  _startTimers() {
    // mood 수렴: 5분마다
    this._tickInterval = setInterval(() => {
      this.state.tickMoodDecay();
      this.debugPanel.sync();
    }, 5 * 60 * 1000);

    // energy 감소: 10분마다
    setInterval(() => {
      this.state.tickEnergyDrain();
      this.debugPanel.sync();
    }, 10 * 60 * 1000);

    // runtime 카운터: 1분마다
    this._runtimeCounter = setInterval(() => {
      this.state.totalRuntimeMinutes++;
      this._checkStageAdvance();
    }, 60 * 1000);

    // 자동 저장: 30초마다
    this._saveInterval = setInterval(async () => {
      await SaveManager.save(this.state);
    }, 30 * 1000);
  }
}

// ── 유틸 ──

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── 부트스트랩 ──

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init().catch(err => {
    console.error('[game] 초기화 실패:', err);
  });
});
