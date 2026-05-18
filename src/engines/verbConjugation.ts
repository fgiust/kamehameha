import { ConjugationEngine } from '../types';

const ichiDanMap: Record<string, string> = {
  く: 'き', す: 'し', う: 'い', ぐ: 'ぎ',
  ぶ: 'び', つ: 'ち', む: 'み', ぬ: 'に', る: 'り',
};
const aDanMap: Record<string, string> = {
  く: 'か', す: 'さ', う: 'わ', ぐ: 'が',
  ぶ: 'ば', つ: 'た', む: 'ま', ぬ: 'な', る: 'ら',
};
const eDanMap: Record<string, string> = {
  く: 'け', す: 'せ', う: 'え', ぐ: 'げ',
  ぶ: 'べ', つ: 'て', む: 'め', ぬ: 'ね', る: 'れ',
};
const oDanMap: Record<string, string> = {
  く: 'こ', す: 'そ', う: 'お', ぐ: 'ご',
  ぶ: 'ぼ', つ: 'と', む: 'も', ぬ: 'の', る: 'ろ',
};

const irrStemMasu: Record<string, string> = {
  'する': 'し', '為る': '為し',
  'べんきょうする': 'べんきょうし', '勉強する': '勉強し',
  'くる': 'き', '来る': '来き',
  'つれてくる': 'つれてき', '連れて来る': '連れて来き',
};

function stem(w: string) { return w.slice(0, -1); }
function last(w: string) { return w.slice(-1); }

function irrNegStem(w: string) {
  if (w === 'くる') return 'こ';
  if (w === '来る') return '来こ';
  if (w === 'つれてくる') return 'つれてこ';
  if (w === '連れて来る') return '連れて来こ';
  return irrStemMasu[w] || stem(w);
}

const teExc = ['いく', 'もっていく', '行く', '持っていく'];
export const teform: ConjugationEngine = {
  opts: [{ id: 'neg', label: 'Negative' }, { id: 'polite', label: 'Polite' }],
  exceptions: teExc,
  getAnswer(w, t, f) {
    const s = stem(w), l = last(w);
    if (t === 'u') {
      if (['ある', '有る'].includes(w) && f.neg && !f.polite) return 'なくて';
      if (f.neg && f.polite) return s + ichiDanMap[l] + 'ませんで';
      if (f.neg) return [s + aDanMap[l] + 'なくて', s + aDanMap[l] + 'ないで'];
      if (f.polite) return s + ichiDanMap[l] + 'まして';
      if ('うつる'.includes(l)) return s + 'って';
      if ('むぶぬ'.includes(l)) return s + 'んで';
      if (l === 'く') return teExc.includes(w) ? s + 'って' : s + 'いて';
      if (l === 'ぐ') return s + 'いで';
      if (l === 'す') return s + 'して';
      return 'Error';
    }
    let st = t === 'irr' ? (irrStemMasu[w] || s) : s;
    if (['くる', '来る'].includes(w) && f.neg && !f.polite) st = w === 'くる' ? 'こ' : '来こ';
    if (['つれてくる', '連れて来る'].includes(w) && f.neg && !f.polite) st = w === 'つれてくる' ? 'つれてこ' : '連れて来こ';
    if (f.neg && f.polite) return st + 'ませんで';
    if (f.neg) return [st + 'なくて', st + 'ないで'];
    if (f.polite) return st + 'まして';
    return st + 'て';
  },
};

export const negativeform: ConjugationEngine = {
  baseFormHint: 'negative',
  opts: [{ id: 'polite', label: 'Polite' }],
  exceptions: ['ある', '有る'],
  getAnswer(w, t, f) {
    const s = stem(w), l = last(w);
    if (f.polite) {
      if (t === 'u') return s + ichiDanMap[l] + 'ません';
      if (t === 'ru') return s + 'ません';
      return (irrStemMasu[w] || s) + 'ません';
    }
    if (t === 'u') return ['ある', '有る'].includes(w) ? 'ない' : s + aDanMap[l] + 'ない';
    if (t === 'ru') return s + 'ない';
    return irrNegStem(w) + 'ない';
  },
};

const pastExc = ['いく', 'もっていく', '行く', '持っていく'];
export const pastform: ConjugationEngine = {
  opts: [{ id: 'neg', label: 'Negative' }, { id: 'polite', label: 'Polite' }],
  exceptions: pastExc,
  getAnswer(w, t, f) {
    const s = stem(w), l = last(w);
    if (t === 'u') {
      if (f.polite && f.neg) return s + ichiDanMap[l] + 'ませんでした';
      if (f.polite) return s + ichiDanMap[l] + 'ました';
      if (f.neg) return ['ある', '有る'].includes(w) ? 'なかった' : s + aDanMap[l] + 'なかった';
      if ('うつる'.includes(l)) return s + 'った';
      if ('むぶぬ'.includes(l)) return s + 'んだ';
      if (l === 'く') return pastExc.includes(w) ? s + 'った' : s + 'いた';
      if (l === 'ぐ') return s + 'いだ';
      if (l === 'す') return s + 'した';
      return 'Error';
    }
    let st = t === 'irr' ? (irrStemMasu[w] || s) : s;
    if (t === 'irr' && !f.polite && f.neg) st = irrNegStem(w);
    if (f.polite && f.neg) return st + 'ませんでした';
    if (f.polite) return st + 'ました';
    if (f.neg) return st + 'なかった';
    return st + 'た';
  },
};

export const politeform: ConjugationEngine = {
  baseFormHint: 'polite',
  opts: [{ id: 'neg', label: 'Negative' }],
  getAnswer(w, t, f) {
    const s = stem(w), sfx = f.neg ? 'ません' : 'ます';
    if (t === 'u') return s + ichiDanMap[last(w)] + sfx;
    if (t === 'ru') return s + sfx;
    return (irrStemMasu[w] || s) + sfx;
  },
};

export const potentialform: ConjugationEngine = {
  opts: [{ id: 'neg', label: 'Negative' }, { id: 'polite', label: 'Polite' }],
  getAnswer(w, t, f) {
    let sfx = 'る';
    if (f.polite && f.neg) sfx = 'ません';
    else if (f.polite) sfx = 'ます';
    else if (f.neg) sfx = 'ない';
    const s = stem(w);
    if (t === 'u') return s + eDanMap[last(w)] + sfx;
    if (t === 'ru') return [s + 'られ' + sfx, s + 'れ' + sfx];
    const m: Record<string, string> = {
      'する': 'でき', '為る': 'でき',
      'べんきょうする': 'べんきょうでき', '勉強する': '勉強でき',
      'くる': 'こられ', '来る': '来こられ',
      'つれてくる': 'つれてこられ', '連れて来る': '連れて来こられ'
    };
    return (m[w] || s) + sfx;
  },
};

export const volitionalform: ConjugationEngine = {
  opts: [{ id: 'polite', label: 'Polite' }],
  getAnswer(w, t, f) {
    const s = stem(w);
    if (f.polite) {
      if (t === 'u') return s + ichiDanMap[last(w)] + 'ましょう';
      if (t === 'ru') return s + 'ましょう';
      return (irrStemMasu[w] || s) + 'ましょう';
    }
    if (t === 'u') return s + oDanMap[last(w)] + 'う';
    if (t === 'ru') return s + 'よう';
    let st = irrStemMasu[w] || s;
    if (w === 'くる') st = 'こ';
    if (w === '来る') st = '来こ';
    if (w === 'つれてくる') st = 'つれてこ';
    if (w === '連れて来る') st = '連れて来こ';
    return st + 'よう';
  },
};

const condExc = ['いく', 'もっていく', '行く', '持っていく'];
export const conditionalform: ConjugationEngine = {
  opts: [{ id: 'neg', label: 'Negative' }, { id: 'polite', label: 'Polite' }],
  exceptions: condExc,
  getAnswer(w, t, f) {
    const s = stem(w), l = last(w);
    if (t === 'u') {
      if (f.polite && f.neg) return s + ichiDanMap[l] + 'ませんでしたら';
      if (f.neg) return s + aDanMap[l] + 'なかったら';
      if (f.polite) return s + ichiDanMap[l] + 'ましたら';
      if ('うつる'.includes(l)) return s + 'ったら';
      if ('むぶぬ'.includes(l)) return s + 'んだら';
      if (l === 'く') return condExc.includes(w) ? s + 'ったら' : s + 'いたら';
      if (l === 'ぐ') return s + 'いだら';
      if (l === 'す') return s + 'したら';
      return 'Error';
    }
    if (t === 'ru') {
      if (f.polite && f.neg) return s + 'ませんでしたら';
      if (f.neg) return s + 'なかったら';
      if (f.polite) return s + 'ましたら';
      return s + 'たら';
    }
    const ms = irrStemMasu[w] || s;
    if (f.polite && f.neg) return ms + 'ませんでしたら';
    if (f.polite) return ms + 'ましたら';
    if (f.neg) return irrNegStem(w) + 'なかったら';
    return ms + 'たら';
  },
};

export const imperativeform: ConjugationEngine = {
  opts: [{ id: 'neg', label: 'Negative' }, { id: 'polite', label: 'Polite' }],
  exceptions: ['くれる'],
  getAnswer(w, t, f) {
    if (f.neg && !f.polite) return w + 'な';
    const s = stem(w), l = last(w);
    if (t === 'u') {
      if (f.polite) return s + ichiDanMap[l] + (f.neg ? 'なさるな' : 'なさい');
      return s + eDanMap[l];
    }
    if (t === 'ru') {
      if (w === 'くれる') {
        if (f.polite) return s + 'なさるな';
        return [s, s + 'ろ'];
      }
      return s + (f.polite && f.neg ? 'なさるな' : f.polite ? 'なさい' : 'ろ');
    }
    const m: Record<string, string> = {
      'する': 'し', '為る': '為し',
      'べんきょうする': 'べんきょうし', '勉強する': '勉強し',
      'くる': 'き', '来る': '来き',
      'つれてくる': 'つれてき', '連れて来る': '連れて来き'
    };
    const ms = m[w] || s;
    if (!f.polite && w === 'くる') return 'こい';
    if (!f.polite && w === '来る') return '来こい';
    if (!f.polite && w === 'つれてくる') return 'つれてこい';
    if (!f.polite && w === '連れて来る') return '連れて来こい';
    return ms + (f.polite && f.neg ? 'なさるな' : f.polite ? 'なさい' : 'ろ');
  },
};

export const passiveform: ConjugationEngine = {
  opts: [{ id: 'neg', label: 'Negative' }, { id: 'polite', label: 'Polite' }],
  getAnswer(w, t, f) {
    let sfx = 'る';
    if (f.polite && f.neg) sfx = 'ません';
    else if (f.polite) sfx = 'ます';
    else if (f.neg) sfx = 'ない';
    const s = stem(w);
    if (t === 'u') return s + aDanMap[last(w)] + 'れ' + sfx;
    if (t === 'ru') return s + 'られ' + sfx;
    const m: Record<string, string> = {
      'する': 'さ', '為る': '為さ',
      'べんきょうする': 'べんきょうさ', '勉強する': '勉強さ',
      'くる': 'こら', '来る': '来こら',
      'つれてくる': 'つれてこら', '連れて来る': '連れて来こら'
    };
    return (m[w] || s) + 'れ' + sfx;
  },
};

export const causativeform: ConjugationEngine = {
  opts: [{ id: 'short', label: 'Short' }, { id: 'neg', label: 'Negative' }, { id: 'polite', label: 'Polite' }, { id: 'passive', label: 'Passive' }],
  getAnswer(w, t, f): string {
    const s = stem(w), l = last(w);
    if (t === 'u') {
      let cs = f.short ? 'し' : 'せ';
      if (f.passive) cs = 'せられ';
      if (f.passive && f.short) { cs = 'され'; if (l === 'す') return ''; }
      if (f.short && f.polite && f.neg) return s + aDanMap[l] + cs + 'ません';
      if (f.short && f.polite) return s + aDanMap[l] + cs + 'ます';
      if (f.polite && f.neg) return s + aDanMap[l] + cs + 'ません';
      if (f.short && f.neg) return s + aDanMap[l] + (f.passive ? 'されない' : 'さない');
      if (f.short) return s + aDanMap[l] + (f.passive ? 'される' : 'す');
      if (f.polite) return s + aDanMap[l] + cs + 'ます';
      if (f.neg) return s + aDanMap[l] + cs + 'ない';
      return s + aDanMap[l] + cs + 'る';
    }
    if (t === 'ru') {
      if (f.passive && f.short) return '';
      const rs = s + 'さ';
      if (f.passive) {
        if (f.polite && f.neg) return rs + 'せられません';
        if (f.polite) return rs + 'せられます';
        if (f.neg) return rs + 'せられない';
        return rs + 'せられる';
      }
      if (f.short && f.polite && f.neg) return rs + 'しません';
      if (f.short && f.polite) return rs + 'します';
      if (f.polite && f.neg) return rs + 'せません';
      if (f.short && f.neg) return rs + 'さない';
      if (f.short) return rs + 'す';
      if (f.polite) return rs + 'せます';
      if (f.neg) return rs + 'せない';
      return rs + 'せる';
    }
    if (f.passive && f.short) return '';
    const m: Record<string, string> = {
      'する': 'さ', '為る': '為さ',
      'べんきょうする': 'べんきょうさ', '勉強する': '勉強さ',
      'くる': 'こさ', '来る': '来こさ',
      'つれてくる': 'つれてこさ', '連れて来る': '連れて来こさ'
    };
    const ms = m[w] || s;
    let c = 'せる';
    if (f.passive) { if (f.polite && f.neg) c = 'せられません'; else if (f.polite) c = 'せられます'; else if (f.neg) c = 'せられない'; else c = 'せられる'; }
    else if (f.short && f.polite && f.neg) c = 'しません';
    else if (f.short && f.polite) c = 'します';
    else if (f.polite && f.neg) c = 'せません';
    else if (f.short && f.neg) c = 'さない';
    else if (f.short) c = 'す';
    else if (f.polite) c = 'せます';
    else if (f.neg) c = 'せない';
    return ms + c;
  },
};

export const provisionalform: ConjugationEngine = {
  opts: [{ id: 'neg', label: 'Negative' }, { id: 'polite', label: 'Polite' }],
  getAnswer(w, t, f) {
    const s = stem(w), l = last(w);
    if (f.polite && f.neg) {
      if (t === 'u') return s + ichiDanMap[l] + 'ませんなら';
      if (t === 'ru') return s + 'ませんなら';
      return (irrStemMasu[w] || s) + 'ませんなら';
    }
    if (f.polite) {
      if (t === 'u') return s + ichiDanMap[l] + 'ますなら';
      if (t === 'ru') return s + 'ますなら';
      return (irrStemMasu[w] || s) + 'ますなら';
    }
    if (f.neg) {
      if (t === 'u') return s + aDanMap[l] + 'なければ';
      if (t === 'ru') return s + 'なければ';
      if (w === 'くる') return 'こなければ';
      if (w === '来る') return '来こなければ';
      if (w === 'つれてくる') return 'つれてこなければ';
      if (w === '連れて来る') return '連れて来こなければ';
      return (irrStemMasu[w] || s) + 'なければ';
    }
    if (t === 'u') return s + eDanMap[l] + 'ば';
    if (t === 'ru') return s + 'れば';
    return s + 'れば';
  },
};

export const verbEngines: Record<string, ConjugationEngine> = {
  teform, negativeform, pastform, politeform, potentialform,
  volitionalform, conditionalform, imperativeform, passiveform,
  causativeform, provisionalform,
};

export const verbFormLabels: Record<string, string> = {
  teform: 'て-Form', causativeform: 'Causative Form', conditionalform: 'Conditional Form',
  imperativeform: 'Imperative Form', negativeform: 'Negative Form', passiveform: 'Passive Form',
  pastform: 'Past Form', politeform: 'Polite Form', potentialform: 'Potential Form',
  provisionalform: 'Provisional Form', volitionalform: 'Volitional Form',
};
