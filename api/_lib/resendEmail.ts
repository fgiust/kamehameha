type SendTextEmailParams = {
  subject: string;
  text: string;
  replyTo?: string;
};

function getRequiredEnv(name: 'RESEND_API_KEY' | 'CONTACT_TO_EMAIL' | 'CONTACT_FROM_EMAIL') {
  const value = process.env[name];
  if (!value) {
    throw new Error('Contact email is not configured');
  }
  return value;
}

export async function sendConfiguredTextEmail({ subject, text, replyTo }: SendTextEmailParams) {
  const apiKey = getRequiredEnv('RESEND_API_KEY');
  const to = getRequiredEnv('CONTACT_TO_EMAIL');
  const from = getRequiredEnv('CONTACT_FROM_EMAIL');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    throw new Error(raw || 'Failed to send email');
  }
}
