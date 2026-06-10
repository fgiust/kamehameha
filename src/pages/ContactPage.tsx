import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SubmitButton, { SubmitState } from '../components/SubmitButton';
import PageLayout from '../components/PageLayout';

export default function ContactPage() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

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
    <PageLayout pageTitle={t('common.contact')}>
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

          <SubmitButton
            state={submitState}
            labels={{
              idle: t('contact.send'),
              sending: t('contact.sending'),
              success: t('contact.sent'),
              error: t('contact.failed')
            }}
            disabled={submitState === 'sending' || submitState === 'success'}
            className="contact-submit-btn"
          />
        </form>
      </div>
    </PageLayout>
  );
}
