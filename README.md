# CODEXCHANGE

B2B Marketplace for AI Tools - Empowering Indian agencies to discover, evaluate, and purchase software with ownership rights.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Supabase account (for database and auth)


> **Note**: The following features are **coming soon**:
> - AWS S3 Integration (Secure File Delivery)
> - Escrow functionality
> - Automated GST calculation

### Installation

1. **Clone and install dependencies:**

```bash
cd codexchange
pnpm install
```

2. **Setup environment variables:**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials from:
- Supabase: Database URL and API keys
- Cashfree Sandbox: API keys
- AWS S3: Storage credentials (can skip initially)

3. **Setup database:**

```bash
cd packages/db
pnpm db:push        # Push schema to Supabase
pnpm seed           # Seed initial data
```

4. **Start development server:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
codexchange/
├── apps/
│   └── web/              # Next.js 15 application
│       ├── app/          # App router pages
│       └── components/   # React components
├── packages/
│   ├── db/               # Database schema & migrations (Drizzle ORM)
│   └── typescript-config/ # Shared TypeScript configs
└── turbo.json           # Turborepo configuration
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, tRPC (coming soon)
- **Database**: Supabase Postgres + Drizzle ORM
- **Auth**: Supabase Auth
- **Payments**: Cashfree Sandbox
- **Storage**: AWS S3
- **Monorepo**: Turborepo + pnpm workspaces

## 📝 Development Scripts

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm lint         # Lint all code
pnpm typecheck    # Type check all code
pnpm format       # Format code with Prettier
```

## 🗄️ Database

We use Drizzle ORM with Supabase Postgres. Schema is defined in `packages/db/src/schema.ts`.

**Core tables:**
- `profiles` - User profiles
- `categories` - Asset categories
- `assets` - Listed AI tools
- `licenses` - Purchased licenses
- `transactions` - Payment records
- `surveys` - Pricing surveys
- `reviews` - Asset reviews

**Migration commands:**
```bash
cd packages/db
pnpm db:generate  # Generate migration files
pnpm db:push      # Push to database
pnpm db:studio    # Open Drizzle Studio
```

## 🔐 Authentication

Using Supabase Auth with:
- Magic link (email)
- Google OAuth
- Role-based access (buyer, builder, admin)


## 💳 Payments

Currently using **Cashfree Sandbox** for testing payments.


