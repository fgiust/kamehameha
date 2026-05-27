export type RubyUnit =
  | { kind: 'plain'; surface: string; reading: string }
  | { kind: 'ruby'; surface: string; reading: string };

export type DiffUnitOp =
  | { kind: 'extra'; text: string }
  | { kind: 'unit'; unit: RubyUnit; status: 'correct_kanji' | 'correct_kana' | 'missing' };
