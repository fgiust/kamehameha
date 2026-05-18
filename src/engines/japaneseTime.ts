export type AmPm = 0 | 1 | 2;

export function getJapaneseTimeReadings(hour: number, minute: number, ampm: AmPm = 0) {
  const hours = [
    'れい',
    'いち',
    'に',
    'さん',
    'よ',
    'ご',
    'ろく',
    'しち',
    'はち',
    'く',
    'じゅう',
    'じゅういち',
    'じゅうに',
    'じゅうさん',
    'じゅうよ',
    'じゅうご',
    'じゅうろく',
    'じゅうしち',
    'じゅうはち',
    'じゅうく',
    'にじゅう',
    'にじゅういち',
    'にじゅうに',
    'にじゅうさん',
  ];
  const minutes = ['', 'いっ', 'に', 'さん', 'よん', 'ご', 'ろっ', 'しち', 'はっ', 'きゅう'];
  const tens = ['', '', 'に', 'さん', 'よん', 'ご'];
  const ampms = ['', 'ごぜん', 'ごご'];

  const answers: string[] = [];

  let minkana = '';
  if (minute === 0) minkana = '';
  else if (minute < 10) minkana = minutes[minute];
  else if (minute % 10 === 0) minkana = tens[Math.floor(minute / 10)] + 'じゅっ';
  else minkana = tens[Math.floor(minute / 10)] + 'じゅう' + minutes[minute % 10];

  let mincounter = '';
  if (minkana === '') mincounter = '';
  else if (minkana.slice(-1) === 'っ' || minute % 10 === 3) mincounter = 'ぷん';
  else mincounter = 'ふん';

  answers.push(ampms[ampm] + hours[hour] + 'じ' + minkana + mincounter);
  if (minute % 10 === 3) answers.push(ampms[ampm] + hours[hour] + 'じ' + minkana + 'ふん');
  else if (minute % 10 === 4) answers.push(ampms[ampm] + hours[hour] + 'じ' + minkana + 'ぷん');
  else if (minute % 10 === 7) answers.push(ampms[ampm] + hours[hour] + 'じ' + minkana.replace('しち', 'なな') + mincounter);
  else if (minute % 10 === 8) answers.push(ampms[ampm] + hours[hour] + 'じ' + minkana.replace('はっ', 'はち') + 'ふん');

  if (minute === 30) answers.push(ampms[ampm] + hours[hour] + 'じはん');

  return Array.from(new Set(answers.filter(Boolean)));
}
