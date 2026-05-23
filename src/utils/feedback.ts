export interface FeedbackDetails {
  section: string;
  question: string;
  /** Other UI language prompt (EN/IT), when available (sentence exercises). */
  questionAlt?: string;
  correctAnswer: string;
  userAnswer?: string;
  exerciseId?: string;
  rawCorrectAnswer?: string;
}

function cleanRubyText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<rt[^>]*>([\s\S]*?)<\/rt>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function updateFeedbackDetails(details: Partial<FeedbackDetails>) {
  const w = window as Window & { currentQuestionDetails?: FeedbackDetails };
  const current: FeedbackDetails = w.currentQuestionDetails ?? {
    section: '',
    question: '',
    questionAlt: '',
    correctAnswer: '',
    userAnswer: '',
    rawCorrectAnswer: '',
  };
  const updated = {
    section: details.section ?? current.section ?? '',
    question: cleanRubyText(details.question ?? current.question ?? ''),
    questionAlt: cleanRubyText(details.questionAlt ?? current.questionAlt ?? ''),
    correctAnswer: cleanRubyText(details.correctAnswer ?? current.correctAnswer ?? ''),
    userAnswer: cleanRubyText(details.userAnswer ?? current.userAnswer ?? ''),
    exerciseId: details.exerciseId ?? current.exerciseId ?? '',
    rawCorrectAnswer: details.rawCorrectAnswer ?? current.rawCorrectAnswer ?? '',
  };
  w.currentQuestionDetails = updated;
  window.dispatchEvent(new CustomEvent('nihongo-feedback-update', { detail: updated }));
}
