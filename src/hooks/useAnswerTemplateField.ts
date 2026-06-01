import { useEffect, useRef, type ChangeEvent, type CompositionEvent, type RefObject } from 'react';
import { applyAnswerTemplateSyntaxInputChange } from '../utils/answerTemplateSyntax';

type FieldElement = HTMLInputElement | HTMLTextAreaElement;

export function useAnswerTemplateField(
  value: string,
  setValue: (next: string) => void,
  inputRef: RefObject<FieldElement | null>,
) {
  const isComposingRef = useRef(false);
  const pendingCaretRef = useRef<number | null>(null);

  useEffect(() => {
    const pos = pendingCaretRef.current;
    if (pos === null) return;
    const el = inputRef.current;
    if (!el || document.activeElement !== el) {
      pendingCaretRef.current = null;
      return;
    }
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      return;
    }
    pendingCaretRef.current = null;
  }, [value, inputRef]);

  const onChange = (e: ChangeEvent<FieldElement>) => {
    const raw = e.target.value;
    const composing =
      isComposingRef.current || (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing;
    if (composing) {
      setValue(raw);
      return;
    }

    const caret = e.target.selectionStart;
    const { value: next, caret: nextCaret } = applyAnswerTemplateSyntaxInputChange(raw, caret);
    if (nextCaret !== null) pendingCaretRef.current = nextCaret;
    setValue(next);
  };

  const onCompositionStart = () => {
    isComposingRef.current = true;
  };

  const onCompositionEnd = (e: CompositionEvent<FieldElement>) => {
    isComposingRef.current = false;
    const raw = e.currentTarget.value;
    const caret = e.currentTarget.selectionStart;
    const { value: next, caret: nextCaret } = applyAnswerTemplateSyntaxInputChange(raw, caret);
    if (nextCaret !== null) pendingCaretRef.current = nextCaret;
    setValue(next);
  };

  return { onChange, onCompositionStart, onCompositionEnd };
}
