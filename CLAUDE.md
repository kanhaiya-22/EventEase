# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# EventEase — College Event Management Platform

## Project Overview
A unified platform for managing the full college event lifecycle: creation, registration, QR attendance, certificate generation, announcements, and analytics. Built for IET Lucknow (default org) with multi-college support — new colleges are auto-provisioned from a user's email domain via [src/lib/college-domain-map.ts](src/lib/college-domain-map.ts) + [src/lib/resolve-org.ts](src/lib/resolve-org.ts).

## Quick Start

```bash
npm install
cp .env.example .env          # Fill in DATABASE_URL, NEXTAUTH_SECRET, etc.
npx prisma generate
npx prisma migrate dev
npm run dev                    # localhost:3000
```

## Commands
- `npm run dev` — Dev server (localhost:3000)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run start` — Start production server
- `npm run migrate:cloudinary` — Migrate local uploads to Cloudinary
- `npx prisma generate` — Regenerate client after schema changes
- `npx prisma migrate dev` — Create and apply migrations
- `npx prisma studio` — Database GUI
- `npx prisma db push` — Push schema without migration (dev only)

## Tech Stack
- **Framework:** Next.js 16.2.2 (App Router, Server Components, Server Actions)
- **React:** 19.2.4
- **Database:** PostgreSQL + Prisma 6.19.3
- **Auth:** NextAuth.js v5 beta.30 (JWT strategy, credentials + Google OAuth)
- **UI:** Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **State:** TanStack Query 5 (staleTime: 60s, no window focus refetch)
- **Validation:** Zod 4 (shared client/server schemas)
- **Email:** Resend (dev mode redirects to TEST_EMAIL)
- **File Storage:** Cloudinary (images 10MB, videos 50MB, docs 20MB)
- **PDF:** @react-pdf/renderer (certificate generation)
- **QR:** qrcode (server generation), html5-qrcode (client scanning)
- **Icons:** lucide-react
- **Chatbot (Eeva):** Groq SDK + `@google/generative-ai` — system prompt and route in [src/app/api/chat/route.ts](src/app/api/chat/route.ts)

## Project Structure
```
src/
├── app/
│   ├── (auth)/                    # Login/register (split-screen layout)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/               # Protected routes (sidebar layout)
│   │   ├── dashboard/page.tsx     # Stats, recent activity, organizer analytics
│   │   ├── events/create/         # Create event form
│   │   ├── events/[slug]/         # Dashboard event detail
│   │   ├── my-registrations/      # Student QR codes + cancel registration
│   │   ├── check-in/              # Manual QR check-in
│   │   ├── certificates/          # Student certificates
│   │   ├── notifications/         # Full notification list (tabs: all/unread)
│   │   ├── profile/               # User profile (edit name, dept, year, phone, interests)
│   │   ├── announcements/         # Announcement board + threaded comments
│   │   ├── organized-events/      # Organizer event management
│   │   │   └── [id]/
│   │   │       ├── students/      # Registration list + CSV export
│   │   │       ├── edit/          # Edit event
│   │   │       └── certificates/  # Issue certificates
│   │   ├── admin/                 # Admin sub-routes inside dashboard layout
│   │   │   ├── events/
│   │   │   └── users/
│   │   └── layout.tsx
│   ├── (public)/                  # Public pages (navbar layout)
│   │   ├── about/                 # About page
│   │   ├── contact/               # Contact page
│   │   ├── events/page.tsx        # Events with search, filter, sort
│   │   ├── events/[id]/page.tsx   # Event detail + register (id route)
│   │   ├── events/[slug]/         # Event detail by slug
│   │   └── verify/[code]/page.tsx # Public certificate verification
│   ├── verification-pending/      # Page shown to unverified organizers
│   ├── admin/                     # Admin panel (separate layout)
│   │   ├── page.tsx               # Admin dashboard
│   │   ├── colleges/              # Manage organizations (list/create/[id])
│   │   ├── organizer-requests/    # Approve/reject organizer signups
│   │   ├── events/                # All events management
│   │   │   └── [id]/
│   │   │       ├── attendance/
│   │   │       ├── certificates/
│   │   │       └── registrations/
│   │   └── migration/             # Cloudinary migration UI
│   └── api/
│       ├── auth/[...nextauth]/    # NextAuth handler
│       ├── events/                # CRUD + register + export-csv
│       ├── attendance/            # QR verify + self-checkin
│       ├── certificates/          # CRUD + download
│       ├── notifications/         # GET list, PATCH mark-read, POST mark-all-read
│       ├── announcements/         # CRUD + comments + reactions
│       ├── comments/              # Edit + delete + reactions
│       ├── organizations/         # Org CRUD (admin manages colleges)
│       ├── organizer-requests/    # Approve/reject organizer verification
│       ├── chat/                  # Eeva chatbot (Groq) — server-side LLM proxy
│       ├── upload/                # Cloudinary upload
│       ├── migration/cloudinary/  # Cloudinary migration endpoint
│       ├── documents/download/    # Document download
│       └── seed/                  # Database seeding
├── components/
│   ├── ui/                        # shadcn primitives
│   ├── layout/                    # navbar.tsx, sidebar.tsx, notification-bell.tsx
│   ├── events/                    # register-button, student-qr-display, qr-scanner, filters, card, status-dropdown, export-csv, duplicate
│   ├── certificates/              # issue-certificates-form
│   ├── registrations/             # delete-registration-button, cancel-registration-button
│   ├── notifications/             # notification-list
│   ├── announcements/             # announcement-card/form/list/detail, comment-section, reaction-button
│   ├── profile/                   # profile-form
│   ├── admin/                     # college-form, delete-college-button, organizer-request-actions
│   ├── auth/                      # (placeholder)
│   ├── chatbot/                   # eeva-avatar, eeva-chatbot (floating widget)
│   ├── providers.tsx              # SessionProvider + QueryClientProvider
│   └── logo.tsx
├── lib/
│   ├── auth.ts                    # NextAuth config (JWT, Prisma adapter, credentials + Google)
│   ├── db.ts                      # Prisma singleton
│   ├── utils.ts                   # cn() helper
│   ├── email.ts                   # Resend email (registration, certificate, reminder)
│   ├── nav-items.ts               # Dashboard + public nav (role-filtered)
│   ├── migration.ts               # Cloudinary migration helpers
│   ├── college-domain-map.ts      # email-domain → CollegeInfo lookup table (UP institutions)
│   ├── resolve-org.ts             # resolveOrgFromEmail() — findOrCreate Organization on register
│   ├── data/
│   │   └── iet-events.ts          # static seed-style event data
│   ├── validators/
│   │   ├── auth.ts                # login + register Zod schemas
│   │   ├── profile.ts             # profile update Zod schema
│   │   └── organization.ts        # organization Zod schema
│   └── actions/
│       ├── auth.ts                # registerUser() — runs resolveOrgFromEmail()
│       ├── events.ts              # createEvent(), bulkImportEvents()
│       ├── registrations.ts       # deleteRegistration()
│       ├── certificates.ts        # getUserCertificates(), createCertificate(), etc.
│       ├── profile.ts             # updateProfile()
│       ├── event-status.ts        # updateEventStatus() with state machine
│       ├── cancel-registration.ts # cancelRegistration() — student soft-cancel
│       ├── duplicate-event.ts     # duplicateEvent() — clone as DRAFT
│       ├── announcements.ts       # announcement create/update/delete + reactions
│       └── organizations.ts       # admin org CRUD
├── hooks/                         # (empty — no custom hooks yet)
├── types/
│   ├── index.ts                   # Re-exports Prisma enums, NavItem interface
│   └── next-auth.d.ts             # Session/JWT type augmentation (id, role, department)
└── middleware.ts                   # Route protection + auth redirects

prisma/
├── schema.prisma                  # 13 models, 7 enums
└── migrations/
```

## Database Models
Schema in [prisma/schema.prisma](prisma/schema.prisma):
- **Organization** — Multi-college (name, slug, logo, settings JSON)
- **User** — Auth + profile (role, department, year, interests[], avatarUrl, isActive, isVerified, orgId). `isVerified` gates organizer access — see Auth Flow.
- **Account/Session/VerificationToken** — NextAuth adapter tables
- **Event** — Core entity (title, slug, description, category, tags[], dates, venue, capacity, posterUrl, documents JSON, status, customFields JSON, organizerId, approvedById, orgId)
- **Registration** — User-event join (status, qrCode UUID, formData JSON, cancelledAt). Unique: (userId, eventId)
- **Attendance** — Check-in record (method: QR/MANUAL). Unique: registrationId
- **CertTemplate** — Certificate template (templateData JSON, orgId)
- **Certificate** — Issued cert (certificateUrl, verificationCode UUID). Unique: (userId, eventId)
- **Notification** — In-app alerts (type enum, isRead, link). Indexed: (userId, isRead)
- **OrganizerRequest** — Organizer verification request (collegeName, designation, organizationWeb?, reason, status, rejectionReason?, reviewerId?). Unique: userId. Indexed: status
- **Announcement** — Org-wide posts (title, content, isPinned, authorId, orgId, eventId?). Indexed: (orgId, createdAt)
- **Comment** — Threaded comments on announcements (content, authorId, announcementId, parentId?). Indexed: (announcementId, createdAt)
- **AnnouncementReaction / CommentReaction** — Emoji reactions. Unique on (userId, parentId, emoji).

### Enums
- `Role`: STUDENT, ORGANIZER, ADMIN
- `EventStatus`: DRAFT, PENDING, PUBLISHED, ONGOING, COMPLETED, CANCELLED, ARCHIVED
- `EventCategory`: TECHNICAL, CULTURAL, WORKSHOP, SEMINAR, HACKATHON, SPORTS, SOCIAL, OTHER
- `RegistrationStatus`: CONFIRMED, WAITLISTED, CANCELLED
- `AttendanceMethod`: QR, MANUAL
- `OrganizerRequestStatus`: PENDING, APPROVED, REJECTED
- `NotificationType`: EVENT_*, REGISTRATION_*, CERTIFICATE_READY, ANNOUNCEMENT_POSTED, ANNOUNCEMENT_COMMENT, ORGANIZER_REQUEST, ORGANIZER_APPROVED, ORGANIZER_REJECTED, GENERAL

## Roles & Permissions
- **STUDENT** — Browse events, register, view QR codes, download certificates, post on announcement board
- **ORGANIZER** — Create events, manage registrations, scan QR, issue certificates. **Must be verified** by an admin before any organizer-only route is accessible.
- **ADMIN** — Approve/reject events and organizer requests, manage colleges (organizations) and users, platform analytics, Cloudinary migration

## Auth Flow
- JWT strategy (not database sessions); session augmented with `user.id`, `user.role`, `user.department`, `user.isVerified`.
- Credentials: email + bcrypt-hashed password (salt 12). Google OAuth also supported.
- **Org resolution on register** — [registerUser()](src/lib/actions/auth.ts) calls [resolveOrgFromEmail()](src/lib/resolve-org.ts), which looks the email domain up in [college-domain-map.ts](src/lib/college-domain-map.ts) and `findOrCreate`s the matching `Organization`. Unknown domains → no org assigned (user can still register but is "unaffiliated"). The legacy "IET Lucknow" org is matched by name as a fallback.
- **Organizer verification** — Users who register as ORGANIZER are created with `isVerified=false` and must submit an `OrganizerRequest`. Admin approves/rejects via `/admin/organizer-requests`. Until verified, [middleware.ts](src/middleware.ts) redirects them to `/verification-pending` and blocks `/events/create`, `/organized-events`, `/check-in`, `/admin`.
- Middleware also protects all dashboard/admin routes and redirects logged-in users away from login/register.

## API Routes Summary
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/events` | List/create events |
| GET/POST | `/api/events/[id]` | Get/update event |
| POST | `/api/events/[id]/register` | Register for event |
| GET/POST | `/api/events/[id]/certificates` | Certificate ops |
| GET | `/api/attendance?qrCode=` | Verify QR code |
| POST | `/api/attendance` | Mark attendance (organizer) |
| POST | `/api/attendance/self-checkin` | Student self-check-in (15-min window) |
| GET/POST/DELETE | `/api/certificates/[id]` | Certificate CRUD |
| GET | `/api/certificates/[id]/download` | Download certificate |
| GET | `/api/notifications` | Fetch notifications + unread count |
| PATCH | `/api/notifications/[id]` | Mark notification read |
| POST | `/api/notifications/mark-all-read` | Mark all read |
| GET | `/api/events/[id]/export-csv` | Download registrations CSV |
| POST | `/api/upload` | Cloudinary file upload |
| GET | `/api/documents/download` | Download event documents |
| GET/POST | `/api/announcements` | List/create announcements |
| GET/PUT/DELETE | `/api/announcements/[id]` | Announcement CRUD |
| POST | `/api/announcements/[id]/comments` | Add comment/reply |
| POST | `/api/announcements/[id]/reactions` | Toggle emoji reaction |
| PUT/DELETE | `/api/comments/[id]` | Edit/delete comment |
| POST | `/api/comments/[id]/reactions` | Toggle comment reaction |
| GET/POST | `/api/organizations` | List/create colleges (admin) |
| GET/PUT/DELETE | `/api/organizations/[id]` | College CRUD (admin) |
| PATCH | `/api/organizer-requests/[id]` | Approve/reject organizer request (admin) |
| POST | `/api/chat` | Eeva chatbot — server-side Groq proxy |
| POST | `/api/migration/cloudinary` | Trigger Cloudinary migration (admin) |
| POST | `/api/seed` | Seed database |

## Conventions

### Code Style
- Server Components by default; `"use client"` only when needed
- Server Actions in `src/lib/actions/` for mutations
- Zod validators in `src/lib/validators/` — shared between client and server
- `cn()` from `@/lib/utils` for conditional classnames
- `@/` path alias maps to `src/`
- `db` imported from `@/lib/db`, Prisma types from `@prisma/client`

### Component Patterns
- UI primitives in `src/components/ui/` (shadcn/ui)
- Feature components in `src/components/{feature}/`
- Pages are thin — delegate to components and server actions
- Providers (SessionProvider + QueryClient) wrap the app in `providers.tsx`

### Data Flow
- Server Components fetch data via Prisma directly
- Client components use API routes + TanStack Query for reads
- Mutations via Server Actions or POST API routes
- Forms submit to Server Actions (formData) or API routes (JSON)

### Environment Variables
Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `TEST_EMAIL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_APP_URL`, `GROQ_API_KEY` (Eeva chatbot), `GOOGLE_GENERATIVE_AI_API_KEY`

### Git
- Don't commit `node_modules/`, `.next/`, `.env`
- Prisma client generated in `node_modules/@prisma/client` (Prisma v6)

## Key Features
- **Multi-college auto-provisioning** — email-domain → Organization mapping, see Auth Flow
- **Organizer verification flow** — `OrganizerRequest` model + middleware-enforced gate, admin review at `/admin/organizer-requests`
- **Admin colleges UI** — `/admin/colleges` for managing organizations
- **Eeva chatbot** — floating widget ([components/chatbot/eeva-chatbot.tsx](src/components/chatbot/eeva-chatbot.tsx)) backed by Groq via `/api/chat`; system prompt includes full platform knowledge
- **Announcements & Discussion** — org-wide board with threaded comments, emoji reactions, pin/unpin, event linking, notification integration
- **Notification system** — bell icon with unread badge, dropdown, full notifications page with tabs
- **Event status state machine** — organizers move status (PUBLISHED→ONGOING→COMPLETED→ARCHIVED, cancel) via [event-status.ts](src/lib/actions/event-status.ts)
- **Self check-in** — students can self-check-in within a 15-minute window of event start
- **CSV export, duplicate event, cancel registration, public certificate verification, sonner toasts**

## Known Incomplete Areas
- `src/hooks/` — empty
- `src/components/auth/` — empty placeholder
- Certificate PDF generation — `@react-pdf/renderer` is installed but not wired; certificates are stored as URL with HTML rendering
- Event validators — event create/update uses inline validation, not extracted to `validators/`
