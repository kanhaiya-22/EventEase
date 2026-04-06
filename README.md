# EventEase

A unified college event management platform — handling the complete event lifecycle from creation and approval to registration, QR attendance, certificate generation, and analytics. **Supports multiple colleges with complete organizational individuality** while maintaining a centralized platform for all UP colleges.

## Features

- 🎓 **Multi-College Support** — Each college maintains complete individuality and separation
- 📅 **Event Management** — Create, publish, and manage college-specific events  
- 👥 **Registration System** — Students can register for events with capacity management
- 🎟️ **QR Code Attendance** — Generate unique QR codes per registration
- 📊 **Event Analytics** — Track registrations and attendance per college
- 🎓 **Certificates** — Generate certificates for event attendees
- 🔐 **Authentication** — Credentials + Google OAuth support
- 🎨 **Responsive UI** — Modern, mobile-friendly interface

## Tech Stack

- **Next.js 14+** (App Router) — Frontend + API
- **PostgreSQL** + **Prisma** — Database with organization/college support
- **NextAuth.js** — Authentication (credentials + Google OAuth)
- **Tailwind CSS** + **shadcn/ui** — UI
- **TanStack Query** — Server state management
- **Zod** — Validation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)

### Setup

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, etc.

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

See `.env.example` for all required and optional variables.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Login / Register
│   ├── (dashboard)/  # Authenticated pages
│   └── (public)/     # Public-facing pages
├── components/       # React components
├── lib/              # Utilities, auth, db, validators, server actions
└── types/            # TypeScript definitions

prisma/
└── schema.prisma     # Database schema
```

## Documentation

- **[COLLEGE_INDIVIDUALITY.md](COLLEGE_INDIVIDUALITY.md)** — Multi-college support, organization structure, and college-specific features
- **[FIX_SUMMARY.md](FIX_SUMMARY.md)** — Event clicking error fix and quick reference
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System architecture and data flow diagrams
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** — Complete implementation report
- **[plan.md](plan.md)** — Full product plan, architecture, and roadmap
- **[CLAUDE.md](CLAUDE.md)** — Development conventions and commands
- **[API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)** — API endpoints and testing

## License

Private — All rights reserved.
