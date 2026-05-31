import { useState } from 'react';
import type { DiffUnitOp } from 'tenshindiff';
import { buildFulltestCaseText } from '../utils/fulltestCase';

export default function CopyAsTestcaseLink({
  template,
  user,
  ops,
  isCorrect,
}: {
  template: string;
  user: string;
  ops: DiffUnitOp[];
  isCorrect: boolean;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const copyAsTestcase = async () => {
    const testCaseText = buildFulltestCaseText(template, user, ops, isCorrect);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(testCaseText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = testCaseText;
        ta.setAttribute('readonly', 'true');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  return (
    <div className="copy-as-testcase-row">
      <button
        type="button"
        onClick={copyAsTestcase}
        className="diff-test-link"
        title="Copy current diff as fulltests testcase"
      >
        copy as testcase
      </button>
      {copyState !== 'idle' && (
        <span
          className={`copy-as-testcase-feedback is-${copyState}`}
          aria-live="polite"
        >
          {copyState === 'copied' ? 'copied' : 'copy failed'}
        </span>
      )}
    </div>
  );
}
