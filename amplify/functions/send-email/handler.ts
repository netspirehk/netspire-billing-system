import { Resend } from 'resend';
import { format } from 'date-fns';

// Import PDF wrapper
const { generateInvoicePDF: generatePDF } = require('./pdfWrapper');

type AttachmentInput = {
  filename: string;
  contentBase64?: string;
  contentType?: string;
  url?: string;
};

type InvoiceData = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  terms?: string;
  notes?: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
};

type CustomerData = {
  name: string;
  email: string;
  address?: string;
};

type SendEmailPayload = {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: AttachmentInput[];
  invoice?: InvoiceData;
  customer?: CustomerData;
  generatePdf?: boolean;
};

const resend = new Resend(process.env.RESEND_API_KEY ?? '');

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function safeJsonParse(input: string | undefined): any {
  if (!input) return undefined;
  try { return JSON.parse(input); } catch { return undefined; }
}

// Generate PDF invoice using wrapper
async function generateInvoicePDF(invoice: InvoiceData, customer: CustomerData): Promise<Buffer> {
  return generatePDF(invoice, customer);
}

// Handle OPTIONS preflight requests
export const handler = async (event: any) => {
  // Handle CORS preflight - Function URL handles this automatically
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '',
    };
  }

  try {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return json(500, { error: 'RESEND_API_KEY is not configured' });
    }

    const body: SendEmailPayload = safeJsonParse(event.body);
    console.log('Parsed body:', JSON.stringify(body, null, 2));
    
    if (!body || !body.from || !body.to || !body.subject) {
      console.error('Missing required fields:', { from: body?.from, to: body?.to, subject: body?.subject });
      return json(400, { error: 'Missing required fields: from, to, subject' });
    }

    const toArray = Array.isArray(body.to) ? body.to : [body.to];

    // Start with existing attachments
    let attachments = (body.attachments || []).map(att => {
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

    // Generate and attach invoice PDF if requested
    if (body.generatePdf && body.invoice && body.customer) {
      try {
        console.log('Generating invoice PDF...');
        const pdfBuffer = await generateInvoicePDF(body.invoice, body.customer);
        
        attachments.push({
          filename: `invoice-${body.invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        } as any);
        
        console.log('PDF generated and attached successfully');
      } catch (pdfError) {
        console.error('Failed to generate PDF:', pdfError);
        // Continue without PDF attachment rather than failing the entire email
      }
    }

    console.log('Sending email with Resend:', {
      from: body.from,
      to: toArray,
      subject: body.subject,
      hasHtml: !!body.html,
      hasText: !!body.text,
      attachmentsCount: attachments.length
    });

    const { data, error } = await resend.emails.send({
      from: body.from,
      to: toArray,
      subject: body.subject,
      text: body.text,
      html: body.html,
      attachments,
    });

    if (error) {
      console.error('Resend API error:', error);
      return json(502, { error: error.message || 'Failed to send email' });
    }

    console.log('Email sent successfully:', data?.id);
    return json(200, { id: data?.id });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return json(500, { error: err?.message || 'Unexpected error' });
  }
};


