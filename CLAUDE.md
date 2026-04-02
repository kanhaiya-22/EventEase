@AGENTS.md

# EventEase — College Event Management Platform

## Project Overview
A unified platform for managing the full college event lifecycle: creation, approval, registration, QR attendance, certificate generation, and analytics. Built with Next.js 14+ (App Router), PostgreSQL (Prisma), and NextAuth.js.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations (requires PostgreSQL)
npx prisma migrate dev

# 5. Start dev server
npm run dev
```

## Commands
- `npm run dev` — Start development server (localhost:3000)
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npx prisma generate` — Regenerate Prisma client after schema changes
- `npx prisma migrate dev` — Create and apply migrations
- `npx prisma studio` — GUI for database inspection
- `npx prisma db push` — Push schema to DB without migration (dev only)

## Architecture

### Tech Stack
- **Framework:** Next.js 14+ (App Router, Server Components, Server Actions)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js v5 (credentials + Google OAuth)
- **UI:** Tailwind CSS + shadcn/ui components (manually installed)
- **State:** TanStack Query for server state
- **Validation:** Zod schemas shared between client and server

### Project Structure
```
src/
├── app/
│   ├── (auth)/          # Login/register pages (split layout)
│   ├── (dashboard)/     # Protected pages with sidebar
│   ├── (public)/        # Public pages with navbar
│   └── api/auth/        # NextAuth API route
├── components/
│   ├── ui/              # shadcn/ui primitives (Button, Card, etc.)
│   ├── layout/          # Navbar, Sidebar
│   ├── events/          # Event-specific components
│   └── auth/            # Auth-specific components
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Prisma client singleton
│   ├── utils.ts         # cn() utility
│   ├── nav-items.ts     # Navigation configuration
│   ├── validators/      # Zod schemas
│   └── actions/         # Server actions
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions

prisma/
├── schema.prisma        # Database schema
└── migrations/          # Migration history
```

### Route Groups
- `(auth)` — Full-screen split layout for login/register
- `(dashboard)` — Sidebar layout for authenticated users (role-filtered nav)
- `(public)` — Navbar + footer layout for public-facing pages

### Roles
- **STUDENT** — Browse events, register, view certificates
- **ORGANIZER** — Create events, manage registrations, generate certificates
- **ADMIN** — Approve/reject events, manage users, platform-wide analytics

### Database
Schema lives in `prisma/schema.prisma`. Core models: Organization, User, Event, Registration, Attendance, Certificate, CertTemplate, Notification. See `plan.md` for the full ER design.

## Conventions

### Code Style
- Use Server Components by default; add `"use client"` only when needed
- Server Actions in `src/lib/actions/` for mutations
- Zod validators in `src/lib/validators/` — shared between client forms and server actions
- Use `cn()` from `@/lib/utils` for conditional classnames
- Import from `@/` path alias (maps to `src/`)

### Component Patterns
- UI primitives in `src/components/ui/` (shadcn/ui style)
- Feature components in `src/components/{feature}/`
- Pages are thin — delegate logic to components and server actions

### Environment Variables
- Never commit `.env` — use `.env.example` as template
- Prefix client-accessible vars with `NEXT_PUBLIC_`
- Required vars: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

### Git
- Keep commits small and focused
- Don't commit `node_modules/`, `.next/`, or `.env`
- Prisma client is generated in `node_modules/@prisma/client` (Prisma v6)
- Import Prisma types from `@prisma/client`, use `db` from `@/lib/db`
