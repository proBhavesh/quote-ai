# QuoteAI - AI-Powered Quote Analysis Platform

QuoteAI is a modern web application that helps businesses analyze quotes and invoices using artificial intelligence. It provides market price comparisons, cost analysis, and supplier recommendations to help make informed purchasing decisions.

## Features

- **Quote Analysis**: Upload and analyze quotes/invoices to get detailed insights
- **Market Price Comparison**: Compare quoted prices with current market rates
- **Line Item Analysis**: Detailed breakdown of each item with price differentials
- **Supplier Recommendations**: Get alternative supplier suggestions for better pricing
- **Cost Summary**: View total potential savings and price analysis
- **User Management**: Secure authentication and user-specific quote history
- **Subscription Plans**: Free and premium plans with usage tracking

## Tech Stackk

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**:
  - Shadcn UI
  - Radix UI Primitives
  - Tailwind CSS
- **State Management**: React Server Components + Client Hooks
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form + Zod Validation

### Backend

- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **AI Integration**: Vercel AI SDK
- **Payments**: Stripe Integration

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm package manager
- Supabase account
- Stripe account (for payments)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/quote-ai.git
cd quote-ai
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Fill in the following environment variables:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Email (Optional)
EMAIL_SERVER_HOST=your-smtp-host
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email
EMAIL_SERVER_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

4. Run database migrations:

```bash
pnpm supabase:migrate
```

5. Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── quotes/           # Quote-specific components
├── lib/                  # Utility functions and shared logic
├── types/                # TypeScript type definitions
└── styles/              # Global styles and Tailwind config
```

## Key Components

### Quote Analysis

- Upload quotes in various formats (PDF, Excel, etc.)
- AI-powered extraction of line items and metadata
- Real-time market price comparison
- Detailed cost analysis and savings calculation

### User Dashboard

- Overview of analyzed quotes
- Usage statistics and limits
- Subscription management
- Profile settings

### Authentication

- Email/password authentication
- OAuth providers support
- Protected routes and API endpoints
- Session management

## Development

### Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript checks
- `pnpm test` - Run tests
- `pnpm supabase:migrate` - Run database migrations

### Code Style

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Husky for pre-commit hooks

## Deployment

The application is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy with `git push` to main branch

### Manual Deployment

```bash
pnpm build
vercel deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@quoteai.com or open an issue in the GitHub repository.
