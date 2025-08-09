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

export const handler = async (event: any) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return json(500, { error: 'RESEND_API_KEY is not configured' });
    }

    const body: SendEmailPayload = safeJsonParse(event.body);
    if (!body || !body.from || !body.to || !body.subject) {
      return json(400, { error: 'Missing required fields: from, to, subject' });
    }

    // Ensure at least one of text or html is provided
    if (!body.text && !body.html) {
      return json(400, { error: 'Either text or html content is required' });
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

    // Resend types require a string for text; generate a fallback from HTML if needed
    const textContent: string = body.text ?? (body.html ? htmlToText(body.html) : '');

    const { data, error } = await resend.emails.send({
      from: body.from,
      to: toArray,
      subject: body.subject,
      text: textContent,
      html: body.html,
      attachments: attachments.length ? attachments : undefined,
    });

    if (error) {
      return json(502, { error: error.message || 'Failed to send email' });
    }

    return json(200, { id: data?.id });
  } catch (err: any) {
    return json(500, { error: err?.message || 'Unexpected error' });
  }
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
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

// Minimal HTML to plaintext conversion to satisfy Resend's required text field
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li>/gi, ' - ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}


