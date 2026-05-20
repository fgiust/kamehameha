import type { TFunction } from 'i18next';
import type { LocalizedText } from '../types';

export function resolveText(t: TFunction, value: LocalizedText) {
  if (typeof value === 'string') return value;
  return t(value.key, value.values);
}
