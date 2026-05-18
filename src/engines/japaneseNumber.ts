function combine(a: string[], b: string[]) {
  const out: string[] = [];
  for (const x of a) for (const y of b) out.push(x + y);
  return out;
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function single(items: string[]) {
  return items.length > 0 ? [items[0]] : [''];
}

export function getJapaneseNumberReadings(rawNumber: string, issen = true, multiple = true): string[] {
  let number = rawNumber;
  if (number.length > 1) number = number.replace(/^0+/, '');

  const digits: Record<string, string[]> = {
    '0': [''],
    '1': ['いち'],
    '2': ['に'],
    '3': ['さん'],
    '4': ['よん', 'し'],
    '5': ['ご'],
    '6': ['ろく'],
    '7': ['なな', 'しち'],
    '8': ['はち'],
    '9': ['きゅう', 'く'],
  };

  if (number.length === 0) return [''];

  if (number.length === 1) {
    if (multiple && number === '0') return ['れい', 'ぜろ'];
    const base = digits[number] ?? [''];
    return multiple ? base : single(base);
  }

  if (number.length === 2) {
    const tensDigit = number.slice(0, 1);
    const onesDigit = number.slice(1, 2);
    const tensPrefix = tensDigit === '1' ? [''] : single(getJapaneseNumberReadings(tensDigit, true, false));
    const ones = single(getJapaneseNumberReadings(onesDigit, true, false));
    return unique(combine(combine(tensPrefix, ['じゅう']), ones));
  }

  if (number.length === 3) {
    const hundredNums: Record<string, string> = {
      '1': 'ひゃく',
      '2': 'にひゃく',
      '3': 'さんびゃく',
      '4': 'よんひゃく',
      '5': 'ごひゃく',
      '6': 'ろっぴゃく',
      '7': 'ななひゃく',
      '8': 'はっぴゃく',
      '9': 'きゅうひゃく',
    };
    const hundreds = hundredNums[number.slice(0, 1)] ?? '';
    const suffix = single(getJapaneseNumberReadings(number.slice(1, 3), true, false));
    return suffix[0] === '' ? [hundreds] : [hundreds + suffix[0]];
  }

  if (number.length === 4) {
    const thousandNums: Record<string, string> = {
      '1': 'せん',
      '2': 'にせん',
      '3': 'さんぜん',
      '4': 'よんせん',
      '5': 'ごせん',
      '6': 'ろくせん',
      '7': 'ななせん',
      '8': 'はっせん',
      '9': 'きゅうせん',
    };
    let thousands = thousandNums[number.slice(0, 1)] ?? '';
    if (thousands === 'せん' && issen) thousands = 'いっせん';
    const suffix = single(getJapaneseNumberReadings(number.slice(1, 4), true, false));
    return suffix[0] === '' ? [thousands] : [thousands + suffix[0]];
  }

  if (number.length >= 5 && number.length <= 8) {
    const prefix = single(getJapaneseNumberReadings(number.slice(0, number.length - 4), false, false));
    const suffix = getJapaneseNumberReadings(number.slice(number.length - 4), true, true);
    const combined = suffix.map(s => prefix[0] + 'まん' + s);
    return unique(combined.map(s => s.replace(/まん$/, 'まん')));
  }

  return [''];
}
