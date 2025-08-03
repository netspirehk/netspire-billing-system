# Netspire Billing System

A comprehensive React-based billing system for managing customers, invoices, products, payments, and generating reports.

## Features

### 🏠 Dashboard
- Real-time business metrics and KPIs
- Revenue tracking and growth indicators
- Recent invoices overview
- Quick stats and upcoming tasks

### 👥 Customer Management
- Add, edit, and delete customers
- Store complete customer information (contact details, address, tax ID)
- Customer cards with intuitive interface

### 📄 Invoice Management
- Create and manage invoices with line items
- Support for multiple products/services per invoice
- Automatic tax calculations
- Invoice status tracking (draft, pending, paid, overdue)
- Professional invoice layout

### 📦 Products & Services
- Product/service catalog management
- Pricing and tax rate configuration
- Category-based organization
- Easy-to-use product cards interface

### 💳 Payment Tracking
- Record and track customer payments
- Multiple payment methods support
- Payment history and status tracking
- Automatic invoice status updates
- Unpaid invoices management

### 📊 Reports & Analytics
- Revenue trends and analytics
- Top customers and products analysis
- Monthly performance charts
- Customizable date ranges
- Export capabilities

## Technology Stack

- **Frontend**: React 18
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Charts**: Recharts
- **State Management**: React Context + useReducer
- **Styling**: CSS-in-JS with responsive design

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/
│   └── Layout/
│       ├── Header.js
│       ├── Layout.js
│       └── Sidebar.js
├── context/
│   └── BillingContext.js
├── pages/
│   ├── Customers.js
│   ├── Dashboard.js
│   ├── Invoices.js
│   ├── Payments.js
│   ├── Products.js
│   └── Reports.js
├── App.js
├── index.js
└── index.css
```

## Key Features Explained

### State Management
The application uses React Context with useReducer for centralized state management. All data is automatically saved to localStorage for persistence.

### Invoice System
- Automatic invoice numbering (INV-YYYY-XXX format)
- Line item support with quantities and rates
- Tax calculations (8% default, configurable per product)
- Status workflow: Draft → Pending → Paid/Overdue

### Payment Processing
- Links payments to specific invoices
- Automatic status updates when invoices are fully paid
- Support for partial payments
- Multiple payment method tracking

### Responsive Design
- Fully responsive interface
- Mobile-friendly navigation
- Adaptive layouts for all screen sizes

## Data Model

### Customer
```javascript
{
  id: number,
  name: string,
  email: string,
  phone: string,
  address: string,
  taxId: string,
  createdAt: string
}
```

### Product
```javascript
{
  id: number,
  name: string,
  description: string,
  price: number,
  category: string,
  taxRate: number
}
```

### Invoice
```javascript
{
  id: number,
  customerId: number,
  invoiceNumber: string,
  issueDate: string,
  dueDate: string,
  status: 'draft' | 'pending' | 'paid' | 'overdue',
  items: Array<{
    productId: number,
    quantity: number,
    rate: number
  }>,
  subtotal: number,
  tax: number,
  total: number,
  notes: string
}
```

### Payment
```javascript
{
  id: number,
  invoiceId: number,
  amount: number,
  paymentDate: string,
  method: string,
  reference: string,
  notes: string
}
```

## Customization

### Styling
The application uses CSS-in-JS with styled-jsx for component styling. You can easily customize:
- Color schemes
- Layout dimensions
- Typography
- Component appearances

### Business Logic
- Tax rates can be configured per product
- Invoice numbering format can be modified
- Payment terms and methods can be customized
- Report periods can be adjusted

## Sample Data

The application comes with sample data including:
- 2 customers (Acme Corporation, TechStart Inc)
- 3 products/services (Web Development, Maintenance, Logo Design)
- 2 sample invoices
- 1 sample payment

## Future Enhancements

- PDF invoice generation
- Email notifications
- Recurring invoices
- Advanced reporting
- Multi-currency support
- User authentication
- API integration
- Backup and export features

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please contact the development team.

---

**Built with ❤️ for Netspire Company**