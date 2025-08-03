#!/usr/bin/env node

/**
 * Migration script to transfer existing localStorage data to AWS Amplify
 * Run this after setting up your Amplify backend
 */

const { generateClient } = require('aws-amplify/data');
const { Amplify } = require('aws-amplify');

// This would be run in a Node.js environment with your Amplify config
const migrateData = async () => {
  console.log('🚀 Starting data migration to AWS Amplify...');

  try {
    // Get the Amplify client
    const client = generateClient();

    // Sample data structure from your localStorage
    const existingData = {
      customers: [
        {
          id: 1,
          name: 'Acme Corporation',
          email: 'billing@acme.com',
          phone: '+1 (555) 123-4567',
          address: '123 Business St, Suite 100, New York, NY 10001',
          taxId: 'US123456789',
          createdAt: '2024-01-15'
        },
        // ... more customers
      ],
      products: [
        {
          id: 1,
          name: 'Web Development Service',
          description: 'Custom website development and design',
          price: 150.00,
          category: 'Services',
          taxRate: 0.08
        },
        // ... more products
      ],
      invoices: [
        {
          id: 1,
          customerId: 1,
          invoiceNumber: 'INV-2024-001',
          issueDate: '2024-01-15',
          dueDate: '2024-02-14',
          status: 'paid',
          items: [
            { productId: 1, quantity: 40, rate: 150.00 },
            { productId: 3, quantity: 1, rate: 299.00 }
          ],
          subtotal: 6299.00,
          tax: 503.92,
          total: 6802.92,
          notes: 'Thank you for your business!'
        },
        // ... more invoices
      ],
      payments: [
        {
          id: 1,
          invoiceId: 1,
          amount: 6802.92,
          paymentDate: '2024-01-30',
          method: 'Bank Transfer',
          reference: 'TXN-001234',
          notes: 'Received via wire transfer'
        },
        // ... more payments
      ]
    };

    // Migrate customers
    console.log('📝 Migrating customers...');
    const customerMap = new Map();
    for (const customer of existingData.customers) {
      const { id, ...customerData } = customer;
      const result = await client.models.Customer.create({
        ...customerData,
        status: 'active',
        totalBilled: 0,
        totalPaid: 0,
      });
      customerMap.set(id, result.data.id);
      console.log(`✅ Migrated customer: ${customer.name}`);
    }

    // Migrate products
    console.log('📦 Migrating products...');
    const productMap = new Map();
    for (const product of existingData.products) {
      const { id, ...productData } = product;
      const result = await client.models.Product.create({
        ...productData,
        category: product.category.toLowerCase(),
        isActive: true,
        unit: 'each',
        sku: `SKU-${String(id).padStart(3, '0')}`,
      });
      productMap.set(id, result.data.id);
      console.log(`✅ Migrated product: ${product.name}`);
    }

    // Migrate invoices
    console.log('🧾 Migrating invoices...');
    const invoiceMap = new Map();
    for (const invoice of existingData.invoices) {
      const { id, items, customerId, ...invoiceData } = invoice;
      
      // Create the invoice
      const result = await client.models.Invoice.create({
        ...invoiceData,
        customerId: customerMap.get(customerId),
        status: invoice.status === 'paid' ? 'paid' : 'pending',
        taxAmount: invoice.tax || 0,
        discountAmount: 0,
      });
      
      invoiceMap.set(id, result.data.id);

      // Create invoice items
      for (const item of items) {
        await client.models.InvoiceItem.create({
          invoiceId: result.data.id,
          productId: productMap.get(item.productId),
          description: `Product ${item.productId}`,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
          taxRate: 0.08,
        });
      }

      console.log(`✅ Migrated invoice: ${invoice.invoiceNumber}`);
    }

    // Migrate payments
    console.log('💰 Migrating payments...');
    for (const payment of existingData.payments) {
      const { id, invoiceId, method, ...paymentData } = payment;
      
      await client.models.Payment.create({
        ...paymentData,
        invoiceId: invoiceMap.get(invoiceId),
        method: method.toLowerCase().replace(' ', '_'),
        status: 'completed',
        processingFee: 0,
      });

      console.log(`✅ Migrated payment: ${payment.reference}`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   • ${existingData.customers.length} customers migrated`);
    console.log(`   • ${existingData.products.length} products migrated`);
    console.log(`   • ${existingData.invoices.length} invoices migrated`);
    console.log(`   • ${existingData.payments.length} payments migrated`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateData().then(() => {
    console.log('✨ All done! Your data is now in AWS Amplify.');
    process.exit(0);
  });
}

module.exports = { migrateData };