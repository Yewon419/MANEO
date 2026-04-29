// IntentClassifier.js — 키워드 기반 intent 분류

const INTENTS = {
  sleep:    { keywords: ['자','잘자','굿나잇','졸','재워'],                weight: 1.0 },
  play:     { keywords: ['놀','심심','재미','장난','게임'],                weight: 1.0 },
  comfort:  { keywords: ['힘들','슬퍼','울','괜찮','위로','안아','토닥'],   weight: 1.0 },
  praise:   { keywords: ['잘했','예쁘','귀여','좋아','최고','착해'],       weight: 0.9 },
  scold:    { keywords: ['나빠','싫','하지마','안돼','짜증','미워'],       weight: 0.9 },
  greet:    { keywords: ['안녕','하이','왔어','나야','돌아왔','다녀'],     weight: 0.8 },
  goodbye:  { keywords: ['바이','갈게','나중에','끄','종료'],             weight: 0.8 },
  name:     { keywords: ['이름','불러','나는','내 이름'],                 weight: 1.2 },
  weather:  { keywords: ['날씨','비','눈','더워','추워','맑'],            weight: 0.7 },
  story:    { keywords: ['오늘','학교','회사','시험','일'],               weight: 0.5 },
  question: { keywords: ['뭐해','뭐야','누구','어디','왜','어때'],       weight: 0.6 },
};

class IntentClassifier {
  /**
   * 텍스트를 분석하여 intent를 반환한다.
   * @param {string} text
   * @returns {{ intent: string, confidence: number }}
   */
  classify(text) {
    if (!text || text.trim().length === 0) {
      return { intent: 'unknown', confidence: 0 };
    }

    const input = text.trim().toLowerCase();
    let bestIntent = 'unknown';
    let bestScore = 0;

    for (const [intent, { keywords, weight }] of Object.entries(INTENTS)) {
      let matchCount = 0;
      for (const kw of keywords) {
        if (input.includes(kw)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        const score = matchCount * weight;
        if (score > bestScore) {
          bestScore = score;
          bestIntent = intent;
        }
      }
    }

    // "잘자"는 sleep과 goodbye 둘 다 매칭 — sleep이 weight 높으므로 우선
    // 단, "잘자"만 있고 다른 goodbye 키워드 없으면 sleep으로 처리
    // → 자연스럽게 weight 기반으로 해결됨

    return {
      intent: bestIntent,
      confidence: bestScore > 0 ? Math.min(1, bestScore / 2) : 0,
    };
  }
}
