import { Resend } from 'resend';

type AttachmentInput = {
  filename: string;
  contentBase64?: string;
  contentType?: string;
  url?: string;
};

type SendEmailPayload = {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: AttachmentInput[];
};

const resend = new Resend(process.env.RESEND_API_KEY ?? '');

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  };
}

function safeJsonParse(input: string | undefined): any {
  if (!input) return undefined;
  try { return JSON.parse(input); } catch { return undefined; }
}

// Handle OPTIONS preflight requests
export const handler = async (event: any) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      return json(500, { error: 'RESEND_API_KEY is not configured' });
    }

    const body: SendEmailPayload = safeJsonParse(event.body);
    if (!body || !body.from || !body.to || !body.subject) {
      return json(400, { error: 'Missing required fields: from, to, subject' });
    }

    const toArray = Array.isArray(body.to) ? body.to : [body.to];

    const attachments = (body.attachments || []).map(att => {
      if (att.url) {
        return {
          filename: att.filename,
          path: att.url,
        } as any;
      }
      if (att.contentBase64) {
        const buffer = Buffer.from(att.contentBase64, 'base64');
        return {
          filename: att.filename,
          content: buffer,
          contentType: att.contentType,
        } as any;
      }
      return undefined;
    }).filter(Boolean) as Array<any>;

    const { data, error } = await resend.emails.send({
      from: body.from,
      to: toArray,
      subject: body.subject,
      text: body.text,
      html: body.html,
      attachments,
    });

    if (error) {
      return json(502, { error: error.message || 'Failed to send email' });
    }

    return json(200, { id: data?.id });
  } catch (err: any) {
    return json(500, { error: err?.message || 'Unexpected error' });
  }
};


