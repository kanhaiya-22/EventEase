# EventEase — Setup Guide

Complete step-by-step setup instructions for running EventEase on a new machine.

---

## Prerequisites

Install these before starting:

| Tool | Version | How to Install |
|---|---|---|
| **Node.js** | 18+ (LTS recommended) | [nodejs.org](https://nodejs.org) |
| **PostgreSQL** | 14+ | [postgresql.org/download](https://www.postgresql.org/download/) or use a hosted option below |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com) |

### PostgreSQL Options (pick one)

**Option A — Local Install (recommended for development)**
1. Install PostgreSQL from the link above
2. During installation, set a password for the `postgres` user (remember it!)
3. PostgreSQL runs on port `5432` by default

**Option B — Free Hosted (no install needed)**
- **Neon** — [neon.tech](https://neon.tech) — Free tier, instant setup
- **Supabase** — [supabase.com](https://supabase.com) — Free tier with dashboard
- **Railway** — [railway.app](https://railway.app) — Free trial

Both options give you a `DATABASE_URL` connection string.

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/EventEase.git
cd EventEase
```

## Step 2: Install Dependencies

```bash
npm install
```

This installs everything from `package.json`. No global packages needed.

## Step 3: Set Up Environment Variables

```bash
# Copy the example env file
cp .env.example .env
```

Now open `.env` in your editor and fill in the values:

### Required Variables

```env
# Database — replace with your actual PostgreSQL connection string
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/eventease?schema=public"

# NextAuth — generate a random secret
NEXTAUTH_SECRET="run-this-command-to-generate"
NEXTAUTH_URL="http://localhost:3000"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate NEXTAUTH_SECRET:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])

# Or just use any long random string (32+ chars)
```

### Optional Variables (can add later)

```env
# Google OAuth — get from https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email service — get free key from https://resend.com
RESEND_API_KEY=""

# File uploads — get from https://cloudinary.com
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

### Setting Up Google OAuth (optional but recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret into your `.env`

## Step 4: Create the Database

**If using local PostgreSQL:**

```bash
# Open psql (PostgreSQL CLI)
psql -U postgres

# Create the database
CREATE DATABASE eventease;

# Exit
\q
```

**If using hosted PostgreSQL:** The database is already created — just use the connection string they provide.

## Step 5: Generate Prisma Client & Run Migrations

```bash
# Generate the Prisma client (creates types for your code)
npx prisma generate

# Create all database tables
npx prisma migrate dev --name init
```

If migration succeeds, you'll see all tables created (users, events, registrations, etc.).

## Step 6: Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Common Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build (check for errors) |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open database GUI in browser |
| `npx prisma migrate dev` | Apply schema changes to DB |
| `npx prisma generate` | Regenerate client after schema edits |
| `npx prisma db push` | Quick push schema (no migration file) |

---

## Troubleshooting

### "Can't reach database server"
- Check PostgreSQL is running: `pg_isready` (Linux/Mac) or check Services (Windows)
- Verify your `DATABASE_URL` in `.env` — check host, port, password, database name

### "NEXTAUTH_SECRET is missing"
- Make sure `.env` has `NEXTAUTH_SECRET` set to a non-empty string

### "Module not found: @prisma/client"
- Run `npx prisma generate` — this generates the client into `node_modules`

### Build fails with type errors
- Run `npx prisma generate` first, then `npm run build`

### Port 3000 already in use
- Kill the process: `npx kill-port 3000`
- Or use a different port: `npm run dev -- -p 3001`

---

## Deploying to Production (Vercel)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Add all environment variables from `.env` in the Vercel dashboard
4. Set `NEXTAUTH_URL` to your production domain
5. Vercel auto-detects Next.js and deploys

For the database in production, use a hosted PostgreSQL (Neon, Supabase, or Railway).

---

## Project Structure Quick Reference

```
EventEase/
├── src/
│   ├── app/                  # Pages (Next.js App Router)
│   │   ├── (auth)/           # Login, Register
│   │   ├── (dashboard)/      # Protected dashboard pages
│   │   └── (public)/         # Public pages
│   ├── components/           # React components
│   │   ├── ui/               # Base UI (Button, Card, etc.)
│   │   └── layout/           # Navbar, Sidebar
│   └── lib/                  # Core logic
│       ├── auth.ts           # Auth config
│       ├── db.ts             # Database client
│       ├── actions/          # Server actions
│       └── validators/       # Zod schemas
├── prisma/
│   └── schema.prisma         # Database models
├── public/                   # Static files (logo, etc.)
├── .env.example              # Environment template
├── plan.md                   # Product plan & roadmap
├── CLAUDE.md                 # Dev conventions
└── SETUP.md                  # This file
```
