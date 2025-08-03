import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { uploadData } from 'aws-amplify/storage';

/**
 * Generate PDF invoice and upload to S3
 */
export const generateInvoicePDF = async (invoice, customer, items, companyInfo) => {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name || 'Netspire', 20, 30);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo.address || 'Your Company Address', 20, 40);
  doc.text(companyInfo.phone || 'Phone: (555) 123-4567', 20, 45);
  doc.text(companyInfo.email || 'billing@netspire.com', 20, 50);

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
  const tableData = items.map(item => [
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

  // Generate PDF blob
  const pdfBlob = doc.output('blob');
  
  // Upload to S3
  try {
    const key = `invoices/${invoice.id}_${invoice.invoiceNumber}.pdf`;
    const result = await uploadData({
      key,
      data: pdfBlob,
      options: {
        contentType: 'application/pdf',
        accessLevel: 'protected'
      }
    });
    
    return {
      success: true,
      key: result.key,
      url: null // Will be generated when needed
    };
  } catch (error) {
    console.error('PDF upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate aging report PDF
 */
export const generateAgingReportPDF = async (agingData, reportDate) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Accounts Receivable Aging Report', 20, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Date: ${format(new Date(reportDate), 'MMM dd, yyyy')}`, 20, 45);

  // Summary table
  const summaryData = [
    ['Current (0-30 days)', `$${agingData.current.toFixed(2)}`],
    ['31-60 days', `$${agingData.thirtyToSixty.toFixed(2)}`],
    ['61-90 days', `$${agingData.sixtyToNinety.toFixed(2)}`],
    ['Over 90 days', `$${agingData.overNinety.toFixed(2)}`],
    ['Total Outstanding', `$${agingData.total.toFixed(2)}`]
  ];

  doc.autoTable({
    startY: 60,
    head: [['Age Bucket', 'Amount']],
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      1: { halign: 'right' }
    }
  });

  // Detailed breakdown
  if (agingData.details && agingData.details.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Breakdown', 20, doc.lastAutoTable.finalY + 20);

    const detailData = agingData.details.map(item => [
      item.customerName,
      item.invoiceNumber,
      format(new Date(item.dueDate), 'MMM dd, yyyy'),
      item.daysOverdue.toString(),
      `$${item.amount.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 30,
      head: [['Customer', 'Invoice', 'Due Date', 'Days Overdue', 'Amount']],
      body: detailData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'right' }
      }
    });
  }

  return doc.output('blob');
};

/**
 * Generate customer statement PDF
 */
export const generateCustomerStatementPDF = async (customer, transactions, period) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Statement', 20, 30);
  
  // Customer info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Statement For:', 20, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(customer.name, 20, 60);
  doc.text(customer.email, 20, 70);
  
  // Period
  doc.setFont('helvetica', 'bold');
  doc.text('Statement Period:', 120, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`${format(new Date(period.start), 'MMM dd, yyyy')} - ${format(new Date(period.end), 'MMM dd, yyyy')}`, 120, 60);

  // Transactions table
  const transactionData = transactions.map(txn => [
    format(new Date(txn.date), 'MMM dd, yyyy'),
    txn.type, // Invoice, Payment, etc.
    txn.reference,
    txn.type === 'Payment' ? '' : `$${txn.amount.toFixed(2)}`,
    txn.type === 'Payment' ? `$${txn.amount.toFixed(2)}` : '',
    `$${txn.balance.toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 90,
    head: [['Date', 'Type', 'Reference', 'Charges', 'Payments', 'Balance']],
    body: transactionData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' }
    }
  });

  return doc.output('blob');
};

/**
 * Company information - you can make this configurable
 */
export const getCompanyInfo = () => ({
  name: 'Netspire',
  address: '123 Business Street\nSuite 100\nYour City, State 12345',
  phone: '(555) 123-4567',
  email: 'billing@netspire.com',
  website: 'www.netspire.com',
  taxId: 'TAX-123456789'
});

/**
 * Email templates for different notifications
 */
export const emailTemplates = {
  invoiceSent: {
    subject: 'Invoice {{invoiceNumber}} from {{companyName}}',
    body: `Dear {{customerName}},

Please find attached invoice {{invoiceNumber}} for ${{total}}.

Invoice Details:
- Invoice Number: {{invoiceNumber}}
- Issue Date: {{issueDate}}
- Due Date: {{dueDate}}
- Amount Due: ${{total}}

You can download your invoice PDF from the link below:
{{pdfUrl}}

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,
{{companyName}}
{{companyEmail}}`
  },
  
  paymentReminder: {
    subject: 'Payment Reminder - Invoice {{invoiceNumber}}',
    body: `Dear {{customerName}},

This is a friendly reminder that invoice {{invoiceNumber}} for ${{total}} was due on {{dueDate}}.

Please process payment at your earliest convenience to avoid any late fees.

If you have already submitted payment, please disregard this notice.

Thank you for your prompt attention to this matter.

Best regards,
{{companyName}}`
  },
  
  paymentReceived: {
    subject: 'Payment Received - Thank You!',
    body: `Dear {{customerName}},

Thank you! We have received your payment of ${{amount}} for invoice {{invoiceNumber}}.

Payment Details:
- Amount: ${{amount}}
- Payment Date: {{paymentDate}}
- Payment Method: {{paymentMethod}}
- Reference: {{reference}}

Your account is now current.

We appreciate your business!

Best regards,
{{companyName}}`
  }
};