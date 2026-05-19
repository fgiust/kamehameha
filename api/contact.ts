type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
};

type VercelRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

function json(res: VercelResponse, code: number, obj: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

function parseBody(body: unknown): ContactPayload {
  if (body && typeof body === 'object') return body as ContactPayload;
  if (typeof body === 'string') return JSON.parse(body) as ContactPayload;
  return {};
}

function isValidEmail(email: string) {
  if (email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeLine(s: string) {
  return s.replace(/\r/g, '').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    json(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const payload = parseBody(req.body);
    const name = sanitizeLine(String(payload.name ?? ''));
    const email = sanitizeLine(String(payload.email ?? ''));
    const message = String(payload.message ?? '').replace(/\r/g, '').trim();

    if (!name || name.length > 120) {
      json(res, 400, { success: false, error: 'Invalid name' });
      return;
    }
    if (!email || !isValidEmail(email)) {
      json(res, 400, { success: false, error: 'Invalid email' });
      return;
    }
    if (!message || message.length > 5000) {
      json(res, 400, { success: false, error: 'Invalid message' });
      return;
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL;
    if (!apiKey || !to || !from) {
      json(res, 500, { success: false, error: 'Contact email is not configured' });
      return;
    }

    const subject = `[kamehameha] Contact form: ${name}`;
    const text = [
      'New contact message',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      message,
      '',
      `Sent at: ${new Date().toISOString()}`,
    ].join('\n');

    const r = await fetch('https://api.resend.com/emails', {
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
        reply_to: email,
      }),
    });

    if (!r.ok) {
      const raw = await r.text().catch(() => '');
      json(res, 502, { success: false, error: raw || 'Failed to send email' });
      return;
    }

    json(res, 200, { success: true, message: 'Message sent successfully!' });
  } catch (err) {
    json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

