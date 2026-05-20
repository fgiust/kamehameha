export interface VerbPair {
  t: { verb: string; meaning: string };
  i: { verb: string; meaning: string };
}

export const transitiveData: VerbPair[] = [
  { t: { verb: '開[あ]ける', meaning: 'to open' }, i: { verb: '開[あ]く', meaning: 'to open' } },
  { t: { verb: '閉[し]める', meaning: 'to close' }, i: { verb: '閉[し]まる', meaning: 'to close' } },
  { t: { verb: '入[い]れる', meaning: 'to put in' }, i: { verb: '入[はい]る', meaning: 'to enter' } },
  { t: { verb: '出[だ]す', meaning: 'to take out' }, i: { verb: '出[で]る', meaning: 'to go out' } },
  { t: { verb: 'つける', meaning: 'to turn on' }, i: { verb: 'つく', meaning: 'to be on' } },
  { t: { verb: '消[け]す', meaning: 'to turn off' }, i: { verb: '消[き]える', meaning: 'to go off' } },
  { t: { verb: '壊[こわ]す', meaning: 'to break' }, i: { verb: '壊[こわ]れる', meaning: 'to be broken' } },
  { t: { verb: '汚[よご]す', meaning: 'to make dirty' }, i: { verb: '汚[よご]れる', meaning: 'to become dirty' } },
  { t: { verb: '落[お]とす', meaning: 'to drop' }, i: { verb: '落[お]ちる', meaning: 'to fall' } },
  { t: { verb: '沸[わ]かす', meaning: 'to boil' }, i: { verb: '沸[わ]く', meaning: 'to boil' } },
  { t: { verb: '始[はじ]める', meaning: 'to begin' }, i: { verb: '始[はじ]まる', meaning: 'to begin' } },
  { t: { verb: '終[お]える', meaning: 'to end' }, i: { verb: '終[お]わる', meaning: 'to end' } },
  { t: { verb: '変[か]える', meaning: 'to change' }, i: { verb: '変[か]わる', meaning: 'to change' } },
  { t: { verb: '乗[の]せる', meaning: 'to give a ride' }, i: { verb: '乗[の]る', meaning: 'to ride' } },
  { t: { verb: '降[お]ろす', meaning: 'to take down' }, i: { verb: '降[お]りる', meaning: 'to step down' } },
  { t: { verb: '止[と]める', meaning: 'to stop' }, i: { verb: '止[と]まる', meaning: 'to stop' } },
  { t: { verb: '起[お]こす', meaning: 'to wake someone up' }, i: { verb: '起[お]きる', meaning: 'to wake up' } },
  { t: { verb: '見[み]つける', meaning: 'to find' }, i: { verb: '見[み]つかる', meaning: 'to be found' } },
  { t: { verb: '集[あつ]める', meaning: 'to collect' }, i: { verb: '集[あつ]まる', meaning: 'to gather' } },
  { t: { verb: '直[なお]す', meaning: 'to fix' }, i: { verb: '直[なお]る', meaning: 'to be fixed' } }
];
