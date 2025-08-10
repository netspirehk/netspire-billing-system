import { Resend } from 'resend';
import { format } from 'date-fns';

// Note: jsPDF will be imported dynamically due to Node.js compatibility
let jsPDF: any;
let autoTable: any;

// Dynamically import jsPDF (Node.js compatible)
async function loadJsPDF() {
  if (!jsPDF) {
    const jsPDFModule = await import('jspdf');
    jsPDF = jsPDFModule.default;
    
    // Load autoTable plugin
    const autoTableModule = await import('jspdf-autotable');
    autoTable = autoTableModule.default;
  }
  return { jsPDF, autoTable };
}

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

// Generate PDF invoice
async function generateInvoicePDF(invoice: InvoiceData, customer: CustomerData): Promise<Buffer> {
  const { jsPDF, autoTable } = await loadJsPDF();
  
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Netspire', 20, 30);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('123 Business Street', 20, 40);
  doc.text('Suite 100', 20, 45);
  doc.text('Your City, State 12345', 20, 50);
  doc.text('Phone: (555) 123-4567', 20, 55);
  doc.text('billing@netspire.com', 20, 60);

  // Invoice title and number
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 140, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 140, 45);
  doc.text(`Date: ${format(new Date(invoice.issueDate), 'MMM dd, yyyy')}`, 140, 55);
  doc.text(`Due Date: ${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}`, 140, 65);

  // Customer information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 80);
  
  doc.setFont('helvetica', 'normal');
  doc.text(customer.name, 20, 90);
  
  if (customer.address) {
    const addressLines = customer.address.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 20, 100 + (index * 5));
    });
  }

  // Invoice items table
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `$${item.rate.toFixed(2)}`,
    `$${item.amount.toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 120,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, 140, finalY + 10);
  
  if (invoice.taxAmount > 0) {
    doc.text(`Tax: $${invoice.taxAmount.toFixed(2)}`, 140, finalY + 20);
  }
  
  if (invoice.discountAmount > 0) {
    doc.text(`Discount: -$${invoice.discountAmount.toFixed(2)}`, 140, finalY + 30);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Total: $${invoice.total.toFixed(2)}`, 140, finalY + 40);

  // Payment terms and notes
  if (invoice.terms) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 20, finalY + 60);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.terms, 20, finalY + 70, { maxWidth: 170 });
  }

  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, finalY + 90);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.notes, 20, finalY + 100, { maxWidth: 170 });
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', 20, 280);

  // Return as Buffer
  return Buffer.from(doc.output('arraybuffer'));
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


