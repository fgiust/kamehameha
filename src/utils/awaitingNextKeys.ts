/**
 * Shared keyboard handling while an answer is revealed (`awaitingNext`).
 * Backspace/Delete undoes a wrong answer; Enter / typing advances.
 */
export function handleAwaitingNextKey(
  e: { key: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean; preventDefault: () => void },
  opts: {
    canUndo: boolean;
    onUndo: () => void;
    onAdvance: () => void;
  },
): boolean {
  if (e.key === 'Enter') {
    e.preventDefault();
    opts.onAdvance();
    return true;
  }

  // Character-delete keys (Backspace on Mac/IT keyboards; Delete/Canc on others).
  if ((e.key === 'Backspace' || e.key === 'Delete') && opts.canUndo) {
    e.preventDefault();
    opts.onUndo();
    return true;
  }

  if (!e.altKey && !e.ctrlKey && !e.metaKey && e.key.length === 1) {
    e.preventDefault();
    opts.onAdvance();
    return true;
  }

  return false;
}
