// PDF Wrapper for Lambda compatibility
const jsPDF = require('jspdf');
const autoTable = require('jspdf-autotable');

function generateInvoicePDF(invoice, customer) {
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

  // Invoice details
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 30);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 45);
  doc.text(`Date: ${invoice.issueDate}`, 150, 50);
  doc.text(`Due Date: ${invoice.dueDate}`, 150, 55);

  // Customer information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 80);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(customer.name, 20, 90);
  if (customer.address) {
    doc.text(customer.address, 20, 95);
  }
  doc.text(customer.email, 20, 100);

  // Items table
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `$${item.rate.toFixed(2)}`,
    `$${item.amount.toFixed(2)}`
  ]);

  // Add totals row
  tableData.push(['', '', 'Subtotal:', `$${invoice.subtotal.toFixed(2)}`]);
  if (invoice.taxAmount > 0) {
    tableData.push(['', '', 'Tax:', `$${invoice.taxAmount.toFixed(2)}`]);
  }
  if (invoice.discountAmount > 0) {
    tableData.push(['', '', 'Discount:', `-$${invoice.discountAmount.toFixed(2)}`]);
  }
  tableData.push(['', '', 'Total:', `$${invoice.total.toFixed(2)}`]);

  autoTable(doc, {
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    startY: 120,
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Terms and notes
  if (invoice.terms) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms:', 20, doc.lastAutoTable.finalY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.terms, 20, doc.lastAutoTable.finalY + 30);
  }

  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, doc.lastAutoTable.finalY + 40);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.notes, 20, doc.lastAutoTable.finalY + 50);
  }

  // Convert to buffer
  const pdfBytes = doc.output('arraybuffer');
  return Buffer.from(pdfBytes);
}

module.exports = { generateInvoicePDF };
