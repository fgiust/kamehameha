import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..', 'src', 'data');

const SPLIT_BRACE_RE =
  /\{([一二三四五六七八九十])\[([^\]]*)\]([^\[\}|]+)\[([^\]]*)\]\|([^}]+)\}/g;

const DIGIT = {
  一: '1',
  二: '2',
  三: '3',
  四: '4',
  五: '5',
  六: '6',
  七: '7',
  八: '8',
  九: '9',
  十: '10',
};

const READING_FIX = {
  ろくかい: 'ろっかい',
};

/** [from, to] — order matters (longer patterns first) */
const EXPLICIT = [
  ['{三[さん]回[かい]|さんかい}', '{3回[さんかい]|三回[さんかい]}'],
  ['{二[に]回[かい]|にかい}', '{2回[にかい]|二回[にかい]}'],
  ['{一[いっ]回[かい]|いっかい}', '{1回[いっかい]|一回[いっかい]}'],
  ['{四[よん]回[かい]|よんかい}', '{4回[よんかい]|四回[よんかい]}'],
  ['{五[ご]回[かい]|ごかい}', '{5回[ごかい]|五回[ごかい]}'],
  ['{六[ろく]回[かい]|ろくかい}', '{6回[ろっかい]|六回[ろっかい]}'],
  ['{四[よん]時[じ]間[かん]|よんじかん}', '{4時間[よんじかん]|四時間[よんじかん]}'],
  ['四[よん]台[だい]', '{4台[よんだい]|四台[よんだい]}'],
  ['二[に]つ', '{2つ[ふたつ]|二つ[ふたつ]}'],
  ['三[さん]杯[はい]', '{3杯[さんばい]|三杯[さんばい]}'],
  ['一[いち]番[ばん]', '{1番[いちばん]|一番[いちばん]}'],
  ['三[さん]年[ねん]間[かん]', '{3年間[さんねんかん]|三年間[さんねんかん]}'],
  ['四[し]月[がつ]', '{4月[しがつ]|四月[しがつ]}'],
  ['三[さん]階[かい]', '{3階[さんがい]|三階[さんがい]}'],
  ['三[さん]時[じ]', '{3時[さんじ]|三時[さんじ]}'],
  ['八[はち]時[じ]', '{8時[はちじ]|八時[はちじ]}'],
  ['五[ご]時[じ]', '{5時[ごじ]|五時[ごじ]}'],
  ['三[さん]つ', '{3つ[みっつ]|三つ[みっつ]}'],
  ['三十人[さんじゅうにん]', '{30人[さんじゅうにん]|三十人[さんじゅうにん]}'],
  ['十冊[じゅっさつ]', '{10冊[じゅっさつ]|十冊[じゅっさつ]}'],
  ['二台[にだい]', '{2台[にだい]|二台[にだい]}'],
  ['一冊[いっさつ]', '{1冊[いっさつ]|一冊[いっさつ]}'],
  ['十分[じゅっぷん]', '{10分[じゅっぷん]|十分[じゅっぷん]}'],
  ['一枚[いちまい]', '{1枚[いちまい]|一枚[いちまい]}'],
  ['二十[にじゅう]人[にん]', '{20人[にじゅうにん]|二十人[にじゅうにん]}'],
];

function fixSplitBraces(text) {
  return text.replace(SPLIT_BRACE_RE, (_m, numKanji, _r1, counterPart, _r2, kanaReading) => {
    let reading = kanaReading.trim();
    if (READING_FIX[reading]) reading = READING_FIX[reading];
    const digit = DIGIT[numKanji] ?? numKanji;
    const kanjiCounter = `${numKanji}${counterPart}`;
    const digitCounter = `${digit}${counterPart}`;
    return `{${digitCounter}[${reading}]|${kanjiCounter}[${reading}]}`;
  });
}

function applyExplicit(text) {
  let out = text;
  for (const [from, to] of EXPLICIT) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out;
}

let changedFiles = 0;
for (const file of readdirSync(ROOT).filter(f => f.startsWith('genki-') && f.endsWith('.txt')).sort()) {
  const fp = path.join(ROOT, file);
  const original = readFileSync(fp, 'utf8');
  let text = fixSplitBraces(applyExplicit(original));
  if (text !== original) {
    writeFileSync(fp, text, 'utf8');
    changedFiles++;
    console.log('updated', file);
  }
}

console.log(`Done. ${changedFiles} file(s) changed.`);
