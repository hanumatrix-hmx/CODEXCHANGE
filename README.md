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

## 👑 Administration

To grant admin privileges to a user:

1. Navigate to the database package:
   ```bash
   cd packages/db
   ```
2. Run the make-admin script with the user's email:
   ```bash
   pnpm run make-admin <user-email>
   ```

## ✨ Features

- **Asset Submission**: Detailed forms with validation.
- **Image Gallery**: 
  - Multiple image uploads for assets.
  - **Image Zoom**: High-quality zoom for cover and gallery images using `react-medium-image-zoom`.
- **License Customization**: Builders can define specific features for Usage and Source licenses (e.g., "Unlimited users", "Deployment support").
- **Unique View Counter**: Intelligent view tracking using session-based cookies to prevent artificial view count inflation.
- **Admin Dashboard**: Manage users and assets.

## 🗄️ Database

We use Drizzle ORM with Supabase Postgres. Schema is defined in `packages/db/src/schema.ts`.

**Full table list (19 tables):**
- `profiles` - User profiles (extends Supabase auth)
- `builder_profiles` - Builder-specific compliance and store data
- `categories` - Asset categories (hierarchical)
- `assets` - Listed AI tools/software
- `listing_images` - Gallery and cover images for assets
- `listing_versions` - Semver version tracking for assets
- `tags` - Global tags
- `listing_tags` - Many-to-many link between assets and tags
- `moderation_queue` - Quality gate for new/updated assets
- `moderation_log` - History of moderation actions
- `licenses` - Active/expired licenses for buyers
- `orders` - Payment intent records with tax breakdown (GST/TCS)
- `payments` - Captured payment records linked to orders
- `refunds` - Refund tracking against payments
- `surveys` - Pricing surveys (Van Westendorp model)
- `survey_responses` - Individual user feedback on pricing
- `payouts` - Builder earnings and transfers (updated structure)
- `reviews` - Asset ratings and feedback
- `audit_logs` - System-wide activity tracking

## 📦 Storage

We use **Supabase Storage** (and eventually AWS S3) for asset files.

- **Buckets**:
  - `listing-image`: Publicly accessible bucket for asset cover photos and gallery images.

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


