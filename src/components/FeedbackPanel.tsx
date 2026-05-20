import { useState, useEffect, useRef } from 'react';
import { FeedbackDetails } from '../utils/feedback';
import { useTranslation } from 'react-i18next';
import SubmitButton, { SubmitState } from './SubmitButton';
import DiffTestModal from './DiffTestModal';

export default function FeedbackPanel() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<FeedbackDetails>({
    section: '',
    question: '',
    correctAnswer: '',
    userAnswer: '',
  });
  const [notes, setNotes] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const notesRef = useRef<HTMLTextAreaElement>(null);

  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  // Sync state with global window object when opening or when a custom update event is fired
  const syncDetails = () => {
    const current = (window as Window & { currentQuestionDetails?: FeedbackDetails }).currentQuestionDetails;
    const urlParts = window.location.pathname.split('/').filter(Boolean);
    const exerciseId = urlParts.length > 0 ? urlParts[urlParts.length - 1] : 'home';

    if (current) {
      setDetails({
        section: current.section || '',
        question: current.question || '',
        correctAnswer: current.correctAnswer || '',
        userAnswer: current.userAnswer || '',
        exerciseId: current.exerciseId || exerciseId,
      });
    }
  };

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<FeedbackDetails>;
      if (customEvent.detail) {
        setDetails(customEvent.detail);
      }
    };

    window.addEventListener('nihongo-feedback-update', handleUpdate);
    return () => {
      window.removeEventListener('nihongo-feedback-update', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      syncDetails();
      setSubmitState('idle');
      setTimeout(() => {
        notesRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState === 'sending' || submitState === 'success') return;
    setSubmitState('sending');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...details,
          notes,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSubmitState('success');
        setNotes('');
        setTimeout(() => {
          setIsOpen(false);
          setSubmitState('idle');
        }, 3000);
      } else {
        setSubmitState('error');
        setTimeout(() => setSubmitState('idle'), 3000);
      }
    } catch {
      setSubmitState('error');
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  return (
    <>
      {/* Sticky Tab */}
      <button
        className={`feedback-tab ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={t('feedbackPanel.tabTitle')}
        aria-label={t('common.feedback')}
      >
        <span>🐞 {t('common.feedback')}</span>
      </button>

      {/* Floating Panel Panel Container */}
      <div className={`feedback-panel-backdrop ${isOpen ? 'is-open' : ''}`} onClick={() => setIsOpen(false)}>
        <div
          className="feedback-panel"
          onClick={e => e.stopPropagation()}
        >
          <div className="feedback-panel-header">
            <h3>{t('feedbackPanel.heading')}</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <form onSubmit={handleSubmit} className="feedback-panel-form">
            <div className="feedback-text-group">
              <div className="feedback-section-title">{details.section}</div>
            </div>

            <div className="feedback-text-group">
              <label>{t('feedbackPanel.question')}</label>
              <div className="feedback-readonly-text">{details.question}</div>
            </div>

            <div className="feedback-text-group">
              <label>{t('feedbackPanel.correctAnswer')}</label>
              <div className="feedback-readonly-text">{details.correctAnswer}</div>
            </div>

            <div className="feedback-form-group">
              <label>{t('feedbackPanel.yourAnswer')}</label>
              <input
                type="text"
                value={details.userAnswer}
                onChange={e => setDetails(prev => ({ ...prev, userAnswer: e.target.value }))}
                placeholder={t('feedbackPanel.yourAnswerPlaceholder')}
              />
              <button
                type="button"
                className="diff-test-link"
                onClick={() => setIsDiffModalOpen(true)}
              >
                TenshinDiff test
              </button>
            </div>

            <div className="feedback-form-group">
              <label>{t('feedbackPanel.notes')}</label>
              <textarea
                ref={notesRef}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('feedbackPanel.notesPlaceholder')}
                required
                rows={4}
              />
            </div>

            <SubmitButton
              state={submitState}
              labels={{
                idle: t('feedbackPanel.save'),
                sending: t('feedbackPanel.saving'),
                success: t('feedbackPanel.saved'),
                error: t('feedbackPanel.failed')
              }}
              disabled={submitState === 'sending' || submitState === 'success'}
            />
          </form>
        </div>
      </div>

      <DiffTestModal 
        isOpen={isDiffModalOpen} 
        onClose={() => setIsDiffModalOpen(false)} 
        initialCorrect={details.correctAnswer}
        initialUser={details.userAnswer || ''}
      />
    </>
  );
}
