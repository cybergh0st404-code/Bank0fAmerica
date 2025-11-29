# ProBank - Professional Online Banking System

A fully professional online banking website UI and frontend system, inspired by major financial institutions like Bank of America, Chase, and Wells Fargo. This is a production-ready, bank-grade React application with a clean, corporate, and trustworthy design.

## Features

### 🎨 Design
- **Bank of America Inspired**: Clean, corporate, modern fintech design
- **Professional Color Palette**: Soft navy blues, financial blues, subtle reds
- **Premium Typography**: Inter font family for a modern, trustworthy feel
- **Responsive Design**: Mobile-first approach with professional animations

### 📄 Pages

#### 1. **Login Page**
- Professional branding header
- Clean input fields with validation
- "Secure Sign-In" label
- 2FA authentication screen
- Links for enrollment and password recovery
- Subtle animations on load

#### 2. **Dashboard**
- Top navigation bar with profile menu
- Sidebar navigation
- Large account summary card with balance display
- Quick action buttons:
  - Transfer Money
  - Pay Bills
  - Deposit
  - Withdraw
- Transaction history preview
- Spending analytics with charts
- Organized grid layout

#### 3. **Transfer Page**
- 3-step transfer process:
  1. Select recipient (with search)
  2. Enter amount and memo
  3. Review and confirm
- Secure transfer confirmation
- Professional step indicators

#### 4. **Transaction History**
- Filterable transaction list
- Clear categorization (Debit/Credit)
- Pill-style category tags
- Search functionality
- Date range filtering
- Transaction summary cards

#### 5. **User Settings**
- Profile management (name, email, phone, address)
- Password change functionality
- Two-factor authentication toggle
- Notification preferences
- Tabbed interface

#### 6. **Admin Panel**
- User management table
- All accounts overview
- All transactions view
- Approve/flag functionality
- Search and filter capabilities
- Professional table UI

### 🔒 Security Features
- **Expiry System**: Frontend logic checks expiry date from backend
- **Expired Page**: Professional "PROJECT EXPIRED" page when system is expired
- **Protected Routes**: Authentication and authorization checks
- **2FA Support**: Two-factor authentication flow

## Tech Stack

- **React 18** - Modern React with hooks
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **Vite** - Fast build tool and dev server

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd ProBank
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Configuration

### Expiry Date

To set the project expiry date, edit `src/utils/expiryCheck.js`:

```javascript
export const EXPIRY_DATE = new Date('2025-12-31'); // Change this date
```

When the current date exceeds this date, users will see the "PROJECT EXPIRED" page.

### Admin Access

To log in as an admin, use an email that contains "admin" in the login form. For example:
- `admin@example.com`
- `testadmin@test.com`

Regular users can use any other email.

## Project Structure

```
ProBank/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── ExpiredPage.jsx
│   │   ├── Input.jsx
│   │   ├── Navbar.jsx
│   │   └── Sidebar.jsx
│   ├── pages/               # Page components
│   │   ├── AdminPanel.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Settings.jsx
│   │   ├── TransactionHistory.jsx
│   │   └── Transfer.jsx
│   ├── utils/               # Utility functions
│   │   └── expiryCheck.js
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Design System

### Colors

- **Primary Navy**: `#00335c`
- **Primary Blue**: `#1565c0`
- **Accent Red**: `#d7263d` (used sparingly)
- **Soft Grey**: `#f1f1f5`

### Typography

- **Font Family**: Inter, SF Pro Display, Roboto, system-ui, sans-serif
- **Weights**: 300, 400, 500, 600, 700

### Border Radius

- **Bank**: `8px`
- **Card**: `12px`

### Shadows

- **Bank**: `0 2px 8px rgba(0, 51, 92, 0.08)`
- **Bank Large**: `0 4px 16px rgba(0, 51, 92, 0.12)`

## Usage

### Login

1. Enter any email and password
2. Click "Sign In"
3. Enter a 6-digit 2FA code (any numbers will work in demo mode)
4. You'll be redirected to the dashboard (or admin panel if email contains "admin")

### Dashboard

- View account balance and summary
- Quick access to common banking operations
- View recent transactions
- See spending analytics

### Transfer Money

1. Click "Transfer Money" from dashboard or sidebar
2. Select a recipient
3. Enter amount and optional memo
4. Review and confirm

### Transaction History

- Filter by type (All, Credits, Debits)
- Filter by date range
- Search by description or category
- View transaction summaries

### Settings

- Update profile information
- Change password
- Enable/disable 2FA
- Configure notification preferences

### Admin Panel

- View all users
- View all accounts
- View all transactions
- Approve pending items
- Flag suspicious activity

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

```bash
npm run preview
```

Preview the production build locally.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- This is a **frontend-only** application for demonstration purposes
- Authentication is simulated using localStorage
- No actual banking operations are performed
- All data is sample/mock data
- In a production environment, you would need:
  - Backend API integration
  - Real authentication system
  - Database connections
  - Secure payment processing
  - Compliance with financial regulations

## License

This project is created for demonstration purposes.

## Credits

Design inspired by major financial institutions including Bank of America, Chase, and Wells Fargo.



