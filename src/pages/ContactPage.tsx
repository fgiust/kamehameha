import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_TITLE_PREFIX } from '../types';
import { useTranslation } from 'react-i18next';

export default function ContactPage() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const submitLabel =
    submitState === 'sending' ? t('contact.sending') :
      submitState === 'success' ? t('contact.sent') :
        submitState === 'error' ? t('contact.failed') :
          t('contact.send');

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + t('common.contact');
  }, [i18n.language]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState === 'sending' || submitState === 'success') return;

    setSubmitState('sending');
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
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setSubmitState('error');
      }
    } catch {
      setSubmitState('error');
    }
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-heading">{t('common.contact')}</h1>
        <div className="page-actions">
          <Link to="/" className="header-btn" aria-label={t('common.back')}>{'<'}</Link>
        </div>
      </div>

      <p className="home-tagline is-body">
        {t('contact.intro')}
      </p>

      <div className="card">
        <form onSubmit={submit} className="feedback-panel-form">
          <div className="feedback-form-group">
            <label>{t('contact.name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="feedback-form-group">
            <label>{t('contact.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="feedback-form-group">
            <label>{t('contact.message')}</label>
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
