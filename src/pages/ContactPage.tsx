import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_TITLE_PREFIX } from '../types';

const PAGE_TITLE = 'Contact';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [submitLabel, setSubmitLabel] = useState('Send');

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState === 'sending' || submitState === 'success') return;

    setSubmitState('sending');
    setSubmitLabel('Sending...');
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
        setSubmitState('success');
        setSubmitLabel('Message sent');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setSubmitState('error');
        setSubmitLabel('Failed to send');
      }
    } catch {
      setSubmitState('error');
      setSubmitLabel('Failed to send');
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

      <p className="home-tagline is-body">
        Suggestions, compliments, or concerns? Don’t hesitate to get in touch, I’d love to hear from you.
      </p>

      <div className="card">
        <form onSubmit={submit} className="feedback-panel-form">
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

          <button
            type="submit"
            className={`feedback-submit-btn contact-submit-btn ${submitState === 'sending' ? 'is-sending' : submitState === 'success' ? 'is-success' : submitState === 'error' ? 'is-error' : ''}`}
            disabled={submitState === 'sending' || submitState === 'success'}
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
