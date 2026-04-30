// events.js — 이벤트 이름 상수. typo 방지 + 한 곳에서 전체 이벤트 흐름 파악.
// PROJECT_STATUS §14.3 데이터 흐름 + v0.1 scope 기준.

const EVENTS = {
  // ── 입력 ──
  INPUT_CHAT:        'input:chat',         // (text)        보이드 채팅 Enter
  INPUT_CLICK:       'input:click',        // ()            Meum 클릭
  INPUT_PAT:         'input:pat',          // ()            쓰다듬기 (v0.2)

  // ── 반응 엔진 ──
  REACTION_PRODUCED: 'reaction:produced',  // (reaction)    LocalEngine이 반응 생성

  // ── 상태 변경 ──
  STATE_CHANGED:     'state:changed',      // (delta)       bond/mood/energy 변동
  BOND_CHANGED:      'bond:changed',       // (newValue)    bond만 별도 (Stage 균열 트리거)

  // ── Stage 전환 ──
  STAGE_ADVANCED:    'stage:advanced',     // ({from, to})  Stage 1→2, 2→3

  // ── 시퀀스 ──
  OPENING_DONE:      'opening:done',       // ()            opening.json 끝
  BIRTH_DONE:        'birth:done',         // ()            birth.json 끝
  GROWTH_DONE:       'growth:done',        // ()            v0.2 deferred
  ENDING_DONE:       'ending:done',        // ()            v0.2 deferred

  // ── UI ──
  VOID_SHOW:         'void:show',
  VOID_HIDE:         'void:hide',
};
