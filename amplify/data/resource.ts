import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Customer model - enhanced from your current structure
  Customer: a
    .model({
      name: a.string().required(),
      email: a.string().required(),
      phone: a.string(),
      address: a.string(),
      taxId: a.string(),
      status: a.enum(['active', 'inactive', 'suspended']),
      billingAddress: a.string(),
      shippingAddress: a.string(),
      paymentTerms: a.integer(), // days
      creditLimit: a.float(),
      totalBilled: a.float().default(0),
      totalPaid: a.float().default(0),
      // Relationships
      invoices: a.hasMany('Invoice', 'customerId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['admin', 'billing']).to(['create', 'update', 'delete']),
      allow.groups(['viewer']).to(['read']),
    ]),

  // Product/Service model - enhanced from your current structure  
  Product: a
    .model({
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      category: a.enum(['services', 'products', 'subscription', 'one-time']),
      taxRate: a.float().default(0.08),
      isActive: a.boolean().default(true),
      unit: a.string().default('each'), // hours, each, monthly, etc.
      sku: a.string(),
      // Relationships
      invoiceItems: a.hasMany('InvoiceItem', 'productId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['admin', 'billing']).to(['create', 'update', 'delete']),
      allow.groups(['viewer']).to(['read']),
    ]),

  // Invoice model - enhanced from your current structure
  Invoice: a
    .model({
      invoiceNumber: a.string().required(),
      customerId: a.id().required(),
      customer: a.belongsTo('Customer', 'customerId'),
      issueDate: a.date().required(),
      dueDate: a.date().required(),
      status: a.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']),
      subtotal: a.float().required(),
      taxAmount: a.float().default(0),
      discountAmount: a.float().default(0),
      total: a.float().required(),
      notes: a.string(),
      terms: a.string(),
      pdfUrl: a.string(), // S3 URL for generated PDF
      sentAt: a.datetime(),
      viewedAt: a.datetime(),
      // Relationships
      items: a.hasMany('InvoiceItem', 'invoiceId'),
      payments: a.hasMany('Payment', 'invoiceId'),
      paymentSchedules: a.hasMany('PaymentSchedule', 'invoiceId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['admin', 'billing']).to(['create', 'update', 'delete']),
      allow.groups(['viewer']).to(['read']),
    ]),

  // Invoice line items - new model for better normalization
  InvoiceItem: a
    .model({
      invoiceId: a.id().required(),
      invoice: a.belongsTo('Invoice', 'invoiceId'),
      productId: a.id(),
      product: a.belongsTo('Product', 'productId'),
      description: a.string().required(),
      quantity: a.float().required(),
      rate: a.float().required(),
      amount: a.float().required(), // quantity * rate
      taxRate: a.float().default(0),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['admin', 'billing']).to(['create', 'update', 'delete']),
      allow.groups(['viewer']).to(['read']),
    ]),

  // Payment model - enhanced from your current structure
  Payment: a
    .model({
      invoiceId: a.id().required(),
      invoice: a.belongsTo('Invoice', 'invoiceId'),
      amount: a.float().required(),
      paymentDate: a.date().required(),
      method: a.enum(['cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'stripe']),
      reference: a.string(), // transaction ID, check number, etc.
      notes: a.string(),
      status: a.enum(['pending', 'completed', 'failed', 'refunded']),
      processingFee: a.float().default(0),
      // Relationships  
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['admin', 'billing']).to(['create', 'update', 'delete']),
      allow.groups(['viewer']).to(['read']),
    ]),

  // New models for enhanced functionality
  PaymentSchedule: a
    .model({
      invoiceId: a.id().required(),
      invoice: a.belongsTo('Invoice', 'invoiceId'),
      dueDate: a.date().required(),
      amount: a.float().required(),
      status: a.enum(['pending', 'paid', 'overdue']),
      reminderSent: a.boolean().default(false),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['admin', 'billing']).to(['create', 'update', 'delete']),
      allow.groups(['viewer']).to(['read']),
    ]),

  EmailTemplate: a
    .model({
      name: a.string().required(),
      type: a.enum(['invoice_sent', 'payment_reminder', 'payment_received', 'overdue_notice']),
      subject: a.string().required(),
      body: a.string().required(),
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['admin']).to(['create', 'update', 'delete']),
      allow.groups(['billing', 'viewer']).to(['read']),
    ]),

  AuditLog: a
    .model({
      entityType: a.string().required(), // Invoice, Customer, Payment, etc.
      entityId: a.string().required(),
      action: a.enum(['created', 'updated', 'deleted', 'sent', 'paid']),
      userId: a.string().required(),
      changes: a.string(), // Store what changed as JSON string
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['admin']).to(['create', 'read']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});