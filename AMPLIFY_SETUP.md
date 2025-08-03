# AWS Amplify Gen 2 Setup Guide for Netspire Billing System

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ 
- AWS Account
- AWS CLI configured
- Git

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Amplify Backend
```bash
# Create a new Amplify app (first time only)
npx create-amplify@latest --template react

# Or use existing project structure
npm run amplify:sandbox
```

### 4. Deploy to AWS
```bash
# For development
npm run amplify:sandbox

# For production
npm run amplify:deploy
```

## 🏗️ Architecture Overview

Your enhanced billing system now includes:

### **Backend Services**
- **Amazon Cognito**: User authentication & authorization
- **AWS AppSync**: GraphQL API with real-time subscriptions  
- **Amazon DynamoDB**: Scalable NoSQL database
- **Amazon S3**: File storage for PDFs and attachments
- **AWS Lambda**: Serverless functions for business logic

### **Enhanced Features**
1. **User Authentication** with role-based access control
2. **Real-time Updates** when invoices are paid or customers added
3. **File Storage** for invoice PDFs and attachments
4. **Audit Logging** for compliance tracking
5. **Email Integration** for invoice delivery and reminders
6. **Advanced Reporting** with real-time analytics

## 📊 Data Models

Your existing data structure has been enhanced:

### **Customer Model**
```graphql
type Customer {
  id: ID!
  name: String!
  email: AWSEmail!
  phone: AWSPhone
  address: String
  taxId: String
  status: CustomerStatus!          # New: active, inactive, suspended
  billingAddress: String           # New: separate billing address
  paymentTerms: Int               # New: payment terms in days
  creditLimit: Float              # New: credit limit
  totalBilled: Float              # New: lifetime billing total
  totalPaid: Float                # New: lifetime payment total
  invoices: [Invoice]             # Relationship
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
}
```

### **Enhanced Invoice Model**
```graphql
type Invoice {
  id: ID!
  invoiceNumber: String!
  customer: Customer!
  issueDate: AWSDate!
  dueDate: AWSDate!
  status: InvoiceStatus!          # draft, sent, viewed, paid, overdue, cancelled
  subtotal: Float!
  taxAmount: Float                # New: calculated tax
  discountAmount: Float           # New: discount support
  total: Float!
  notes: String
  terms: String
  pdfUrl: String                  # New: generated PDF URL
  sentAt: AWSDateTime             # New: when invoice was sent
  viewedAt: AWSDateTime           # New: when customer viewed invoice
  items: [InvoiceItem]            # New: normalized line items
  payments: [Payment]             # Relationship
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
}
```

## 🔐 Security & Authorization

### **User Groups**
- **Admin**: Full access to all features including user management
- **Billing**: Can manage customers, invoices, payments, and reports
- **Viewer**: Read-only access to data

### **Data Access Patterns**
```javascript
// Example usage in your components
import { usePermissions } from './context/AmplifyBillingContext';

function CustomerForm() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  
  return (
    <div>
      {canCreate && <button>Add Customer</button>}
      {canEdit && <button>Edit</button>}
      {canDelete && <button>Delete</button>}
    </div>
  );
}
```

## 📧 Email Integration

### **Automated Email Triggers**
- Invoice creation and sending
- Payment reminders
- Overdue notifications
- Payment confirmations

### **Email Templates**
The system includes customizable email templates stored in the database:
```javascript
const emailTemplates = {
  invoice_sent: {
    subject: "Invoice {{invoiceNumber}} from Netspire",
    body: "Dear {{customerName}}, please find your invoice attached..."
  },
  payment_reminder: {
    subject: "Payment Reminder - Invoice {{invoiceNumber}}",
    body: "This is a friendly reminder that invoice {{invoiceNumber}} is due..."
  }
};
```

## 📁 File Storage

### **S3 Integration**
```javascript
import { uploadData, getUrl } from 'aws-amplify/storage';

// Upload invoice PDF
const uploadInvoicePDF = async (invoiceId, pdfBlob) => {
  const key = `invoices/${invoiceId}.pdf`;
  const result = await uploadData({
    key,
    data: pdfBlob,
    options: {
      contentType: 'application/pdf',
      accessLevel: 'protected'
    }
  });
  return result.key;
};

// Get PDF URL for download
const getInvoicePDF = async (key) => {
  const url = await getUrl({ key });
  return url.href;
};
```

## 🔄 Real-time Features

### **Live Updates**
Your dashboard and lists automatically update when:
- New invoices are created
- Payments are received
- Customer information changes
- Invoice status updates

### **Subscription Examples**
```javascript
// Real-time invoice updates
useEffect(() => {
  const subscription = client.models.Invoice.onCreate().subscribe(({ data }) => {
    // New invoice created - update UI
    dispatch({ type: 'ADD_INVOICE', payload: data });
  });

  return () => subscription.unsubscribe();
}, []);
```

## 📈 Advanced Analytics

### **Dashboard Metrics**
- Real-time revenue tracking
- Customer lifetime value
- Payment trend analysis
- Overdue invoice monitoring
- Cash flow projections

### **Custom Reports**
```javascript
// Generate aging report
const generateAgingReport = async () => {
  const invoices = await client.models.Invoice.list({
    filter: { status: { ne: 'paid' } }
  });
  
  // Process aging buckets: 0-30, 31-60, 61-90, 90+ days
  return processAgingData(invoices.data);
};
```

## 🚀 Deployment Options

### **Development**
```bash
npm run amplify:sandbox
npm start
```

### **Staging**
```bash
npm run amplify:deploy --branch staging
```

### **Production**
```bash
npm run amplify:deploy --branch main
```

## 📝 Migration from Existing System

Run the migration script to transfer your existing localStorage data:

```bash
node scripts/migrate-to-amplify.js
```

This will:
1. ✅ Migrate all customers with enhanced fields
2. ✅ Transfer products with new categorization
3. ✅ Convert invoices with line item normalization
4. ✅ Import payments with status tracking
5. ✅ Preserve all relationships and references

## 🔧 Customization

### **Adding Custom Fields**
To add custom fields to any model, update the schema in `amplify/data/resource.ts`:

```typescript
Customer: a.model({
  // ... existing fields
  customField: a.string(),           // Add new field
  tags: a.string().array(),          // Array field
  metadata: a.json(),                // JSON field for flexible data
})
```

### **Custom Business Logic**
Add Lambda functions for:
- Automatic invoice numbering
- Tax calculations
- Payment processing
- Report generation
- Email sending

## 🛠️ Troubleshooting

### **Common Issues**
1. **Authentication errors**: Check AWS credentials and region
2. **GraphQL errors**: Verify schema syntax and field types
3. **Permission errors**: Review IAM roles and Cognito groups
4. **Real-time not working**: Check subscription setup and network

### **Useful Commands**
```bash
# Reset local environment
npx amplify delete

# View backend status
npx amplify status

# Generate GraphQL types
npm run amplify:generate

# View logs
npx amplify console
```

## 📞 Next Steps

1. **Set up CI/CD** with GitHub Actions or AWS CodePipeline
2. **Configure monitoring** with CloudWatch and X-Ray
3. **Add backup strategies** for DynamoDB
4. **Implement advanced features** like:
   - Subscription billing
   - Multi-currency support
   - Advanced tax calculations
   - Integration with payment processors (Stripe, PayPal)
   - Mobile app with React Native

Your Netspire billing system is now powered by a scalable, secure, and feature-rich AWS backend! 🎉