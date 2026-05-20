import { ConjugationEngine } from '../types';

function stemI(w: string): string {
  if (w === 'いい') return 'よ';
  return w.slice(0, -1);
}

export const adjNegativeform: ConjugationEngine = {
  baseFormHint: 'negative',
  opts: [{ id: 'polite', label: 'Polite' }],
  getAnswer(w, t, f) {
    if (t === 'i') {
      const s = stemI(w);
      return f.polite ? s + 'くありません' : s + 'くない';
    }
    if (f.polite) return [w + 'ではありません', w + 'じゃありません', w + 'じゃないです'];
    return [w + 'ではない', w + 'じゃない'];
  },
};

export const adjPastform: ConjugationEngine = {
  opts: [{ id: 'neg', label: 'Negative' }, { id: 'polite', label: 'Polite' }],
  getAnswer(w, t, f) {
    const pol = f.polite ? 'polite' : 'plain';
    const neg = f.neg ? 'neg' : 'pos';
    if (t === 'i') {
      const s = stemI(w);
      const m: Record<string, Record<string, string[]>> = {
        plain: { pos: ['かった'], neg: ['くなかった'] },
        polite: { pos: ['かったです'], neg: ['くなかったです', 'くありませんでした'] },
      };
      return m[pol][neg].map(x => s + x);
    }
    const m: Record<string, Record<string, string[]>> = {
      plain: { pos: ['だった'], neg: ['ではなかった', 'じゃなかった'] },
      polite: { pos: ['でした'], neg: ['ではありませんでした', 'じゃなかったです'] },
    };
    return m[pol][neg].map(x => w + x);
  },
};

export const adjNaruform: ConjugationEngine = {
  opts: [{ id: 'neg', label: 'Negative' }, { id: 'polite', label: 'Polite' }],
  getAnswer(w, t, f) {
    let naru = 'なる';
    if (f.polite && f.neg) naru = 'なりません';
    else if (f.polite) naru = 'なります';
    else if (f.neg) naru = 'ならない';
    if (t === 'i') return stemI(w) + 'く' + naru;
    return w + 'に' + naru;
  },
};

export const adjConditionalform: ConjugationEngine = {
  opts: [{ id: 'neg', label: 'Negative' }],
  getAnswer(w, t, f) {
    const neg = f.neg ? 'neg' : 'pos';
    if (t === 'i') {
      const s = stemI(w);
      const m: Record<string, string[]> = { pos: ['ければ'], neg: ['くなければ'] };
      return m[neg].map(x => s + x);
    }
    const m: Record<string, string[]> = {
      pos: ['ならば', 'であれば'],
      neg: ['ではなかったら', 'じゃなかったら', 'ではなければ'],
    };
    return m[neg].map(x => w + x);
  },
};

export const adjVolitionalform: ConjugationEngine = {
  opts: [{ id: 'polite', label: 'Polite' }],
  getAnswer(w, t, f) {
    if (t === 'i') return stemI(w) + 'かろう';
    return w + (f.polite ? 'でしょう' : 'だろう');
  },
};

export const adjEngines: Record<string, ConjugationEngine> = {
  'adj-negativeform': adjNegativeform,
  'adj-pastform': adjPastform,
  'adj-naruform': adjNaruform,
  'adj-conditionalform': adjConditionalform,
  'adj-volitionalform': adjVolitionalform,
};

export const adjFormLabels: Record<string, string> = {
  'adj-negativeform': 'forms.negative',
  'adj-pastform': 'forms.past',
  'adj-naruform': 'forms.naru',
  'adj-conditionalform': 'forms.conditional',
  'adj-volitionalform': 'forms.volitional',
};
