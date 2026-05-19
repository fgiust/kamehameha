import { useState, useEffect, useRef } from 'react';
import { FeedbackDetails } from '../utils/feedback';
import { useTranslation } from 'react-i18next';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Sync state with global window object when opening or when a custom update event is fired
  const syncDetails = () => {
    const current = (window as Window & { currentQuestionDetails?: FeedbackDetails }).currentQuestionDetails;
    if (current) {
      setDetails({
        section: current.section || '',
        question: current.question || '',
        correctAnswer: current.correctAnswer || '',
        userAnswer: current.userAnswer || '',
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
      setMessage(null);
      setTimeout(() => {
        notesRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

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
        setMessage({ type: 'success', text: t('feedbackPanel.saved') });
        setNotes('');
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error || t('feedbackPanel.failed') });
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : t('feedbackPanel.networkError');
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsSubmitting(false);
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
            {message && (
              <div className={`feedback-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="feedback-form-group">
              <label>{t('feedbackPanel.section')}</label>
              <input
                type="text"
                value={details.section}
                readOnly
                placeholder={t('feedbackPanel.sectionPlaceholder')}
              />
            </div>

            <div className="feedback-form-group">
              <label>{t('feedbackPanel.question')}</label>
              <input
                type="text"
                value={details.question}
                readOnly
                placeholder={t('feedbackPanel.questionPlaceholder')}
              />
            </div>

            <div className="feedback-form-group">
              <label>{t('feedbackPanel.correctAnswer')}</label>
              <input
                type="text"
                value={details.correctAnswer}
                readOnly
                placeholder={t('feedbackPanel.correctAnswerPlaceholder')}
              />
            </div>

            <div className="feedback-form-group">
              <label>{t('feedbackPanel.yourAnswer')}</label>
              <input
                type="text"
                value={details.userAnswer}
                onChange={e => setDetails(prev => ({ ...prev, userAnswer: e.target.value }))}
                placeholder={t('feedbackPanel.yourAnswerPlaceholder')}
              />
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

            <button
              type="submit"
              className="feedback-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('feedbackPanel.saving') : t('feedbackPanel.save')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
