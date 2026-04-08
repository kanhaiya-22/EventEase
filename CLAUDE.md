@AGENTS.md

# EventEase — College Event Management Platform

## Project Overview
A unified platform for managing the full college event lifecycle: creation, registration, QR attendance, certificate generation, and analytics. Built for IET Lucknow (default org) with multi-college support.

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

## Project Structure
```
src/
├── app/
│   ├── (auth)/                    # Login/register (split-screen layout)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/               # Protected routes (sidebar layout)
│   │   ├── dashboard/page.tsx     # Stats, recent activity, organizer analytics
│   │   ├── events/create/page.tsx # Create event form
│   │   ├── my-registrations/      # Student QR codes + cancel registration
│   │   ├── check-in/              # Manual QR check-in
│   │   ├── certificates/          # Student certificates
│   │   ├── notifications/         # Full notification list (tabs: all/unread)
│   │   ├── profile/               # User profile (edit name, dept, year, phone, interests)
│   │   ├── organized-events/      # Organizer event management
│   │   │   └── [id]/
│   │   │       ├── students/      # Registration list + CSV export
│   │   │       ├── edit/          # Edit event
│   │   │       └── certificates/  # Issue certificates
│   │   └── layout.tsx
│   ├── (public)/                  # Public pages (navbar layout)
│   │   ├── events/page.tsx        # Events with search, filter, sort
│   │   ├── events/[id]/page.tsx   # Event detail + register
│   │   └── verify/[code]/page.tsx # Public certificate verification
│   ├── admin/                     # Admin panel (separate layout)
│   │   ├── page.tsx               # Admin dashboard
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
│       ├── upload/                # Cloudinary upload
│       ├── documents/download/    # Document download
│       └── seed/                  # Database seeding
├── components/
│   ├── ui/                        # shadcn: button, input, label, card, badge, avatar, alert-dialog, select, dropdown-menu, textarea, separator, tabs, sonner
│   ├── layout/                    # navbar.tsx, sidebar.tsx, notification-bell.tsx
│   ├── events/                    # event-register-button, student-qr-display, qr-scanner, event-filters, event-card, event-status-dropdown, export-csv-button, duplicate-event-button
│   ├── certificates/              # issue-certificates-form
│   ├── registrations/             # delete-registration-button, cancel-registration-button
│   ├── notifications/             # notification-list
│   ├── announcements/             # announcement-card, announcement-form, announcement-list, announcement-detail, comment-section, reaction-button
│   ├── profile/                   # profile-form
│   ├── providers.tsx              # SessionProvider + QueryClientProvider
│   └── logo.tsx
├── lib/
│   ├── auth.ts                    # NextAuth config (JWT, Prisma adapter, credentials + Google)
│   ├── db.ts                      # Prisma singleton
│   ├── utils.ts                   # cn() helper
│   ├── email.ts                   # Resend email (registration, certificate, reminder)
│   ├── nav-items.ts               # Dashboard + public nav (role-filtered)
│   ├── migration.ts               # Cloudinary migration helpers
│   ├── validators/
│   │   ├── auth.ts                # login + register Zod schemas
│   │   └── profile.ts             # profile update Zod schema
│   └── actions/
│       ├── auth.ts                # registerUser()
│       ├── events.ts              # createEvent(), bulkImportEvents()
│       ├── registrations.ts       # deleteRegistration()
│       ├── certificates.ts        # getUserCertificates(), createCertificate(), etc.
│       ├── profile.ts             # updateProfile()
│       ├── event-status.ts        # updateEventStatus() with state machine
│       ├── cancel-registration.ts # cancelRegistration() — student soft-cancel
│       └── duplicate-event.ts     # duplicateEvent() — clone as DRAFT
├── hooks/                         # (empty — no custom hooks yet)
├── types/
│   ├── index.ts                   # Re-exports Prisma enums, NavItem interface
│   └── next-auth.d.ts             # Session/JWT type augmentation (id, role, department)
└── middleware.ts                   # Route protection + auth redirects

prisma/
├── schema.prisma                  # 11 models, 4 enums
└── migrations/
```

## Database Models
Schema in `prisma/schema.prisma`:
- **Organization** — Multi-college (name, slug, logo, settings JSON)
- **User** — Auth + profile (role, department, year, interests[], orgId)
- **Account/Session/VerificationToken** — NextAuth adapter tables
- **Event** — Core entity (title, slug, description, category, tags[], dates, venue, capacity, posterUrl, documents JSON, status, customFields JSON, organizerId, orgId)
- **Registration** — User-event join (status, qrCode UUID, formData JSON). Unique: (userId, eventId)
- **Attendance** — Check-in record (method: QR/MANUAL). Unique: registrationId
- **CertTemplate** — Certificate template (templateData JSON, orgId)
- **Certificate** — Issued cert (certificateUrl, verificationCode UUID). Unique: (userId, eventId)
- **Notification** — In-app alerts (type enum, isRead). Indexed: (userId, isRead)
- **Announcement** — Org-wide posts (title, content, isPinned, authorId, orgId, eventId?). Indexed: (orgId, createdAt)
- **Comment** — Threaded comments on announcements (content, authorId, announcementId, parentId?). Indexed: (announcementId, createdAt)
- **AnnouncementReaction** — Emoji reactions on announcements. Unique: (userId, announcementId, emoji)
- **CommentReaction** — Emoji reactions on comments. Unique: (userId, commentId, emoji)

### Enums
- `Role`: STUDENT, ORGANIZER, ADMIN
- `EventStatus`: DRAFT, PENDING, PUBLISHED, ONGOING, COMPLETED, CANCELLED, ARCHIVED
- `EventCategory`: TECHNICAL, CULTURAL, WORKSHOP, SEMINAR, HACKATHON, SPORTS, SOCIAL, OTHER
- `RegistrationStatus`: CONFIRMED, WAITLISTED, CANCELLED

## Roles & Permissions
- **STUDENT** — Browse events, register, view QR codes, download certificates
- **ORGANIZER** — Create events (auto-published), manage registrations, scan QR, issue certificates
- **ADMIN** — Approve/reject events, manage all users, platform analytics, Cloudinary migration

## Auth Flow
- JWT strategy (not database sessions)
- Credentials: email + bcrypt-hashed password (salt 12)
- Google OAuth supported
- Session augmented with: `user.id`, `user.role`, `user.department`
- New organizers auto-assigned to "IET Lucknow" org
- Middleware protects dashboard/admin routes, redirects authed users away from login/register

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
Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_APP_URL`

### Git
- Don't commit `node_modules/`, `.next/`, `.env`
- Prisma client generated in `node_modules/@prisma/client` (Prisma v6)

## Key Features Added
- **Profile page** — students/organizers edit name, department, year, phone, interests
- **Event search & filters** — search by title, filter by category, sort by date/registrations
- **Notification system** — bell icon with unread badge, dropdown, full notifications page with tabs
- **Event status management** — organizers change status (PUBLISHED→ONGOING→COMPLETED→ARCHIVED, cancel)
- **Cancel registration** — students soft-cancel their own registrations
- **CSV export** — organizers download registration lists
- **Duplicate event** — clone events as DRAFT for recurring use
- **Certificate verification** — public `/verify/[code]` page
- **Toast notifications** — sonner replaces all alert() calls
- **Announcements & Discussion** — Org-wide announcement board with threaded comments, emoji reactions, pin/unpin, event linking, edit/delete, notification integration

## Known Incomplete Areas
- `src/hooks/` — Empty, no custom hooks yet
- Certificate PDF generation — stores URL but HTML certificate generated, no PDF library wired
- Event validators — event creation/update uses inline validation, not extracted to validators/
