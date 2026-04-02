# EventEase: Product Plan — From Academic Project to Real-World Product

## Critical Analysis of Original Documents

Before the plan, here's what was found **wrong or weak** in the original report/PPT:

| Issue | What was in the docs | What's actually needed |
|---|---|---|
| **"AI" is buzzword-heavy** | Claims AI chatbot with NLP, AI predictions, AI certificates. None of these need real AI. | Certificate generation is just template filling. A chatbot answering "when is the hackathon?" is a database query, not NLP. Be honest about what's AI and what's automation. |
| **Vague architecture** | "MERN stack + AI module" | No API design, no auth flow details, no state management strategy, no caching, no error handling |
| **No real security model** | "JWT-based auth" mentioned once | No refresh tokens, no CSRF protection, no rate limiting, no input sanitization strategy |
| **QR attendance is naive** | "Scan QR code = attendance" | What prevents screenshot sharing? What about check-in + check-out? Geo-fencing? |
| **No multi-tenancy design** | Designed for one college | A real product should support multiple institutions |
| **No payment model** | Listed as "future scope" | If this is a real product, monetization needs to be in v1 thinking |
| **Certificate "AI" is misleading** | "AI-powered certificate generation" | It's just merging names into a PDF template. That's not AI — it's mail merge. |
| **No offline/poor-network handling** | Assumes always-online | Indian college WiFi is unreliable. This is a real-world blocker. |
| **No data privacy consideration** | Stores student data with no mention of privacy | Need consent, data retention policies, GDPR-like compliance |
| **Predictive analytics is premature** | "Predicts registration count" | You need months of real data before any prediction model is useful. Don't build this in MVP. |

---

## 1. Refined Problem Statement

> Educational institutions waste significant administrative hours managing events through fragmented tools (WhatsApp groups, Google Forms, Excel sheets, manual certificates). There is no unified platform that handles the complete event lifecycle — from proposal and approval to registration, attendance verification, feedback collection, and credential issuance — while providing actionable analytics to improve future events.

**Key difference from original:** The problem isn't "manual processes are slow." The problem is **fragmentation** — colleges use 5+ disconnected tools for one event. The value proposition is **unification**, not just digitization.

---

## 2. Target Users & Use Cases

### Primary Users (MVP)

| Role | Real-World Persona | Key Pain Points |
|---|---|---|
| **Institution Admin** | Dean/HOD/Event Committee Head | No visibility into events across departments, can't track budgets, approval bottleneck |
| **Event Organizer** | Faculty coordinator or student club lead | Managing registrations in Google Sheets, manually making certificates, chasing approvals via email |
| **Student/Participant** | Undergraduate/postgraduate student | Misses event info, registration confusion, never gets certificates on time, no portfolio of participation |

### Secondary Users (Post-MVP)
- **Sponsors** — visibility into event reach, branding opportunities
- **Guest Speakers** — schedule management, bio/requirements submission
- **Super Admin** — platform-level management (multi-institution)

---

## 3. Feature Breakdown

### MVP (v1.0) — Build This First

```
Core Platform
├── Auth & User Management
│   ├── Email + password signup/login (with email verification)
│   ├── Google OAuth (students prefer this)
│   ├── Role-based access: Admin, Organizer, Student
│   ├── Profile management with department, year, interests
│   └── Secure session management (JWT access + refresh tokens)
│
├── Event Lifecycle Management
│   ├── Event creation with rich details (title, description, date/time, venue, capacity, category, poster)
│   ├── Multi-step approval workflow (Organizer → Admin)
│   ├── Event states: Draft → Pending Approval → Published → Ongoing → Completed → Archived
│   ├── Event categories & tags (technical, cultural, workshop, seminar, hackathon)
│   ├── Venue/time conflict detection
│   └── Event edit/cancel with participant notification
│
├── Registration System
│   ├── One-click registration (if logged in)
│   ├── Registration with custom form fields (per event)
│   ├── Waitlist when capacity is reached
│   ├── Registration confirmation via email
│   ├── Cancel registration (with deadline)
│   └── Team registration (for hackathons/competitions)
│
├── Attendance & Check-in
│   ├── QR code generated per registration (unique, time-limited)
│   ├── Organizer scan-to-verify (mobile-friendly web scanner)
│   ├── Anti-sharing: QR invalidated after single scan
│   ├── Manual override for edge cases
│   └── Check-in timestamp logging
│
├── Certificate Generation
│   ├── Template-based PDF generation (honest automation, not AI)
│   ├── Admin-uploadable certificate templates
│   ├── Auto-populate: name, event, date, organizer signature
│   ├── Unique certificate ID + verification URL
│   ├── Bulk generation post-event
│   └── Student download from dashboard
│
├── Notifications
│   ├── In-app notification center
│   ├── Email notifications (registration, reminders, certificates ready)
│   └── Event reminders (24h and 1h before)
│
├── Dashboards
│   ├── Student: My events, upcoming, certificates, interests
│   ├── Organizer: Event stats, registrations, attendance rate
│   └── Admin: All events overview, approval queue, platform analytics
│
└── Event Discovery
    ├── Browse/search events with filters (date, category, department)
    ├── Calendar view
    └── Event detail page with registration CTA
```

### v2.0 — After MVP Validated

```
Advanced Features
├── Feedback & Ratings (post-event surveys, event ratings)
├── Payment Integration (Razorpay — for paid workshops/fests)
├── Event Recommendations (based on past registrations + interests)
├── Push Notifications (web push via service workers)
├── Event Analytics (trend analysis, popular categories, peak times)
├── Multi-department Event Coordination
├── Budget Tracking (for organizers/admins)
└── Public Event Pages (shareable links for external promotion)
```

### v3.0 — Scale Phase

```
Platform Features
├── Multi-institution Support (SaaS model)
├── Mobile App (React Native)
├── AI Chatbot (NOW it makes sense — with enough data)
├── Predictive Analytics (with real historical data)
├── API for third-party integrations (LMS, ERP)
├── Sponsor Portal
└── Alumni Network Integration
```

---

## 4. Tech Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | **Next.js 14+ (App Router)** | SSR for SEO (public event pages), file-based routing, API routes, React Server Components for performance |
| **UI Library** | **shadcn/ui + Tailwind CSS** | Production-grade components, fully customizable, accessible (WCAG), no vendor lock-in |
| **State Management** | **TanStack Query (React Query)** | Server state management, caching, optimistic updates. No Redux needed. |
| **Backend** | **Next.js API Routes + Server Actions** | Simplified architecture, single deployment, same-origin requests |
| **Database** | **PostgreSQL** | Events have relational data (users ↔ events ↔ registrations ↔ certificates). Relational DB is the right choice. |
| **ORM** | **Prisma** | Type-safe database access, migrations, great DX |
| **Auth** | **NextAuth.js (Auth.js v5)** | Built-in providers (Google, email), JWT + session management, CSRF protection |
| **File Storage** | **Cloudinary** | Event posters, certificate PDFs, profile pictures |
| **Email** | **Resend** | Modern email API, great DX, free tier sufficient for MVP |
| **PDF Generation** | **@react-pdf/renderer** | Template-based certificate generation |
| **QR Codes** | **qrcode + html5-qrcode** | Generation + mobile browser scanner |
| **Validation** | **Zod** | Schema validation shared between client and server |
| **Deployment** | **Vercel** | Free tier, auto CI/CD, perfect for Next.js |
| **Monitoring** | **Sentry** | Error tracking from day 1 |

### Why PostgreSQL over MongoDB?
Data is inherently relational:
- A User has many Registrations
- An Event has many Registrations, Attendances, Certificates
- An Organization has many Users and Events
- Registrations need ACID transactions (no double-registrations)

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTS                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │  Browser  │  │  Mobile  │  │  QR Scanner (PWA)     │  │
│  │ (Next.js) │  │  (v3.0)  │  │  (mobile web)         │  │
│  └─────┬─────┘  └────┬─────┘  └──────────┬────────────┘  │
└────────┼──────────────┼──────────────────┼───────────────┘
         │              │                  │
         ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    NEXT.JS APP                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │  App Router (SSR + RSC + API Routes)             │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │     │
│  │  │  Auth    │ │  Events  │ │  Registrations   │ │     │
│  │  │  Module  │ │  Module  │ │  Module          │ │     │
│  │  ├──────────┤ ├──────────┤ ├──────────────────┤ │     │
│  │  │Attendance│ │Certifi-  │ │  Notifications   │ │     │
│  │  │  Module  │ │  cates   │ │  Module          │ │     │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │     │
│  └─────────────────────┬───────────────────────────┘     │
└────────────────────────┼────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │  Cloudinary  │ │   Resend     │
│  (via Prisma)│ │  (Files)     │ │  (Email)     │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 6. Database Design

### Core Models

```
User
├── id, email, passwordHash, name, role (ADMIN/ORGANIZER/STUDENT)
├── department, year, phone, interests[], avatarUrl
├── emailVerified, isActive, createdAt, updatedAt

Organization
├── id, name, slug, logo, settings (JSON)
├── createdAt, updatedAt

Event
├── id, title, slug, description, category, tags[]
├── startDate, endDate, venue, capacity, posterUrl
├── status (DRAFT/PENDING/PUBLISHED/ONGOING/COMPLETED/CANCELLED/ARCHIVED)
├── organizerId (FK→User), approvedById (FK→User), orgId (FK→Organization)
├── customFields (JSON), createdAt, updatedAt

Registration
├── id, userId (FK), eventId (FK), status (CONFIRMED/WAITLISTED/CANCELLED)
├── qrCode (unique UUID), formData (JSON)
├── registeredAt, cancelledAt
├── UNIQUE(userId, eventId)

Attendance
├── id, registrationId (FK), checkedInAt, method (QR/MANUAL)

Certificate
├── id, userId (FK), eventId (FK), certificateUrl
├── verificationCode (unique), templateId (FK), issuedAt

CertTemplate
├── id, name, templateData (JSON), orgId (FK)

Notification
├── id, userId (FK), type (enum), title, message
├── isRead, link, createdAt
```

---

## 7. Development Roadmap (Agile — 2-week sprints)

| Sprint | Focus | Deliverable |
|---|---|---|
| **Sprint 1** (Week 1-2) | Project setup, DB schema, Auth | Working signup/login with Google OAuth, role-based routing |
| **Sprint 2** (Week 3-4) | Event CRUD + Approval | Organizers create events, admins approve, public event listing |
| **Sprint 3** (Week 5-6) | Registration + Event Discovery | Search, filter, register, waitlist, calendar view |
| **Sprint 4** (Week 7-8) | QR Attendance | QR generation, mobile scanner, attendance logging |
| **Sprint 5** (Week 9-10) | Certificates + Notifications | Template upload, PDF generation, email notifications |
| **Sprint 6** (Week 11-12) | Dashboards + Polish | Analytics dashboards, responsive UI polish, bug fixes |
| **Sprint 7** (Week 13-14) | Testing + Deployment | E2E tests, performance testing, production deployment |

---

## 8. UI/UX Considerations

- **Mobile-first design** — students use phones 90% of the time
- **Minimal clicks to register** — event page → one click → done
- **Dark/light mode** — system preference detection
- **Skeleton loading states** — not spinners
- **Empty states with CTAs** — "No events yet? Create your first event"
- **Progressive disclosure** — don't show admin features to students
- **WCAG 2.1 AA** — keyboard nav, screen reader support, color contrast
- **Quick QR scan** — organizer scans and sees confirmation in <1 second

---

## 9. Scalability & Future Improvements

**Short-term (6 months):** PWA support, event templates, bulk CSV import
**Medium-term (1 year):** Multi-institution SaaS, Razorpay, feedback system, recommendations
**Long-term (2+ years):** React Native app, API marketplace, AI insights (with real data), white-labeling

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Unreliable campus WiFi | Can't register or check in | PWA with offline queueing, lightweight pages |
| QR code sharing/fraud | Fake attendance | One-time-use QR, time-limited validity, optional geo-check |
| Low initial adoption | Empty platform = no value | Seed with real events, get student council buy-in |
| Email deliverability | Mails go to spam | Use Resend, setup SPF/DKIM |
| Scope creep | Building too much before validating | Strict MVP discipline |
