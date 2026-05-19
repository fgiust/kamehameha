import { useState, useEffect, useRef } from 'react';
import { FeedbackDetails } from '../utils/feedback';

export default function FeedbackPanel() {
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
        setMessage({ type: 'success', text: 'Feedback saved successfully!' });
        setNotes('');
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save feedback.' });
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Error communicating with dev server.';
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
        title="Send Exercise Feedback"
        aria-label="Feedback"
      >
        <span>🐞 Feedback</span>
      </button>

      {/* Floating Panel Panel Container */}
      <div className={`feedback-panel-backdrop ${isOpen ? 'is-open' : ''}`} onClick={() => setIsOpen(false)}>
        <div
          className="feedback-panel"
          onClick={e => e.stopPropagation()}
        >
          <div className="feedback-panel-header">
            <h3>Exercise Feedback</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <form onSubmit={handleSubmit} className="feedback-panel-form">
            {message && (
              <div className={`feedback-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="feedback-form-group">
              <label>Section / Exercise</label>
              <input
                type="text"
                value={details.section}
                readOnly
                placeholder="e.g. Days of the Month"
              />
            </div>

            <div className="feedback-form-group">
              <label>Question / Prompt</label>
              <input
                type="text"
                value={details.question}
                readOnly
                placeholder="The active prompt/kanji"
              />
            </div>

            <div className="feedback-form-group">
              <label>Correct Answer(s)</label>
              <input
                type="text"
                value={details.correctAnswer}
                readOnly
                placeholder="The expected correct response"
              />
            </div>

            <div className="feedback-form-group">
              <label>Your Answer (optional)</label>
              <input
                type="text"
                value={details.userAnswer}
                onChange={e => setDetails(prev => ({ ...prev, userAnswer: e.target.value }))}
                placeholder="What was inputted"
              />
            </div>

            <div className="feedback-form-group">
              <label>Notes / Issue Description</label>
              <textarea
                ref={notesRef}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe the issue, missing alternative, spelling error, etc. in as much detail as possible..."
                required
                rows={4}
              />
            </div>

            <button
              type="submit"
              className="feedback-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Feedback'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
