import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_TITLE_PREFIX } from '../types';

const PAGE_TITLE = 'Contact';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const out = (await res.json()) as { success?: boolean; error?: string; message?: string };
      if (out.success) {
        setStatus({ type: 'success', text: 'Message sent successfully!' });
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus({ type: 'error', text: out.error || 'Failed to send message.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send message.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-heading">{PAGE_TITLE}</h1>
        <div className="page-actions">
          <Link to="/" className="header-btn" aria-label="Back">{'<'}</Link>
        </div>
      </div>

      <div className="card">
        <form onSubmit={submit} className="feedback-panel-form">
          {status && (
            <div className={`feedback-message ${status.type}`}>
              {status.text}
            </div>
          )}

          <div className="feedback-form-group">
            <label>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="feedback-form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="feedback-form-group">
            <label>Your message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={6} />
          </div>

          <button type="submit" className="feedback-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

