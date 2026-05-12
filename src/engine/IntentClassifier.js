// IntentClassifier.js — 키워드 기반 intent 분류

// 키워드 설계 원칙:
// - 단독 단음절 한국어 ('자','놀','일' 등) 금지 — 청유형 어미/조사 등과 충돌
// - 가급적 2글자 이상 + 명확한 의미 단위로
// - 같은 단어가 여러 intent에 매치되지 않도록 분리
const INTENTS = {
  sleep:    { keywords: ['잘자','자자','자야','자고싶','자고 싶','졸려','졸음','굿나잇','재워','잠와','잠 와','자장'], weight: 1.0 },
  play:     { keywords: ['놀자','놀아','놀까','놀러','놀고','심심','재미','장난','게임','같이 놀'],           weight: 1.0 },
  comfort:  { keywords: ['힘들','슬퍼','슬프','울','괜찮','위로','안아','토닥','외로'],                       weight: 1.0 },
  praise:   { keywords: ['잘했','예쁘','귀여','좋아','최고','착해','똑똑','대단'],                            weight: 0.9 },
  scold:    { keywords: ['나빠','싫어','하지마','안돼','짜증','미워','미운','꺼져'],                          weight: 0.9 },
  greet:    { keywords: ['안녕','하이','왔어','나야','돌아왔','다녀','반가'],                                 weight: 0.8 },
  goodbye:  { keywords: ['바이','갈게','나중에','잘 있어','잘있어','종료','이만'],                            weight: 0.8 },
  name:     { keywords: ['이름','불러','내 이름','너 이름','네 이름'],                                        weight: 1.2 },
  weather:  { keywords: ['날씨','비 와','비온','눈 와','눈온','더워','추워','맑','흐려'],                     weight: 0.7 },
  story:    { keywords: ['오늘','학교','회사','시험','수업','출근','퇴근'],                                    weight: 0.5 },
  question: { keywords: ['뭐해','뭐야','누구','어디','어때','왜 그래','왜그래'],                              weight: 0.6 },
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
