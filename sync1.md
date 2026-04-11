# EventEase — Sync Guide #1: Waitlist Auto-Promotion

This guide brings your other local in sync with the waitlist auto-promotion work added on **2026-04-11**. It assumes you already followed [sync.md](sync.md) at least once and your other local is otherwise current with `origin/main`.

> **Precondition:** the waitlist commit must be pushed to `origin/main` from the primary local before you start this guide. If it isn't pushed yet, push it first:
> ```bash
> # on the PRIMARY local
> git status
> git add -A
> git commit -m "feat: waitlist auto-promotion"
> git push origin main
> ```

---

## 1. Pull the new commit

```bash
cd /path/to/EventEase

git fetch origin
git status                          # should be clean — stash anything you want to keep
git pull --ff-only origin main
```

If `--ff-only` fails because the other local has its own commits, see section 2 of [sync.md](sync.md).

---

## 2. Apply the new database migration

A new field `Event.waitlistEnabled Boolean @default(true)` was added. The migration folder is:

```
prisma/migrations/20260411090521_add_waitlist_enabled/
```

Apply it without losing existing data:

```bash
npx prisma migrate deploy
```

This adds one column to the `events` table with a default of `true`, so all existing events will have waitlists enabled automatically. No data loss.

If `migrate deploy` reports drift, see section 5 of [sync.md](sync.md).

---

## 3. Regenerate the Prisma client

**This is the step most likely to bite you on Windows.** If your dev server is running, it will be holding `query_engine-windows.dll.node` open and the regen will fail with `EPERM: operation not permitted, rename ...`.

```bash
# Stop the dev server first (Ctrl+C in the terminal where `npm run dev` is running)
npx prisma generate
# Then restart the dev server
npm run dev
```

Without this regen, TypeScript will not know about `Event.waitlistEnabled` and the build will fail with errors like `Property 'waitlistEnabled' does not exist on type 'Event'`.

---

## 4. No new dependencies, no new env vars

This change is pure schema + application code. You do **not** need to:

- Run `npm install` (no `package.json` changes)
- Add anything to `.env`

If you suspect drift, run `npm install` anyway — it's a no-op when nothing changed.

---

## 5. Sanity check

```bash
npm run lint
npm run dev
```

Open http://localhost:3000 and verify the new behavior end-to-end:

1. **Create / edit an event** — the form now shows an "Enable waitlist" checkbox (defaulted on) below the Capacity field.
2. **Register for an event with free capacity** — should confirm normally.
3. **Fill the event to capacity, then try to register a different student**:
   - The button label changes to "Join Waitlist" (amber).
   - Clicking it shows a confirm panel ("Event is full. Join the waitlist?").
   - Confirming creates a `WAITLISTED` registration and shows a position toast.
4. **Visit `/my-registrations`** — waitlisted events appear in a new "On the Waitlist" section with a `Waitlist · #N` badge.
5. **Cancel the confirmed registration** of the original user — the waitlisted user is auto-promoted, gets the green "A spot opened up" email, and their badge in `/my-registrations` flips to a confirmed entry with a QR code.
6. **Visit `/organized-events/[id]/students` as the organizer** — confirmed students appear in the main table; waitlisted students appear in a separate "Waitlist" card below, ordered by position.

---

## 6. What changed — file reference

If you want to review the diff before pulling, these are the files touched on 2026-04-11:

**Schema + new helper**
- `prisma/schema.prisma` — added `Event.waitlistEnabled`
- `prisma/migrations/20260411090521_add_waitlist_enabled/` — the migration
- `src/lib/waitlist.ts` — **new file** with `promoteFromWaitlist()` and `getWaitlistPosition()`

**Backend**
- `src/app/api/events/[id]/register/route.ts` — full rewrite. Wraps capacity check + insert in a Serializable transaction (fixes the prior race condition). Accepts `joinWaitlist: boolean`. Returns `409 { full: true, canWaitlist }` when full and the flag is absent.
- `src/app/api/events/[id]/route.ts` — PUT now accepts `waitlistEnabled`
- `src/lib/actions/cancel-registration.ts` — calls `promoteFromWaitlist` after a confirmed cancellation
- `src/lib/actions/registrations.ts` — same, on the organizer hard-delete path
- `src/lib/actions/events.ts` — `createEvent` accepts and writes `waitlistEnabled`
- `src/lib/email.ts` — `sendRegistrationConfirmation` extended with `options.wasPromoted` (adds a green "spot opened up" banner); new `sendWaitlistJoinedEmail`

**UI**
- `src/components/events/event-register-button.tsx` — handles the 409 confirm-dialog flow
- `src/app/(public)/events/[id]/page.tsx` — fixed a related bug where `_count.registrations` was counting `CONFIRMED + WAITLISTED` together (made events look fuller than they were); now counts CONFIRMED only and shows a separate "N on waitlist" line. Also shows an amber "You're on the waitlist" card if the user is waitlisted.
- `src/app/(dashboard)/my-registrations/page.tsx` — new "On the Waitlist" section with per-row position badge
- `src/app/(dashboard)/organized-events/[id]/students/page.tsx` — split confirmed vs waitlisted; new Waitlist table; cert form correctly receives confirmed-only attendees
- `src/app/(dashboard)/events/create/page.tsx` — new "Enable waitlist" checkbox
- `src/app/(dashboard)/organized-events/[id]/edit/page.tsx` — same checkbox, prefilled from the existing event

---

## 7. Rollback

If something goes wrong on the other local and you need to back out only this change (without losing later commits):

```bash
# 1. Find the waitlist commit
git log --oneline --all | grep -i waitlist

# 2. Revert it (creates a new commit that undoes the change)
git revert <commit-hash>

# 3. Roll the migration back manually (Prisma has no built-in down migration)
psql -h localhost -U <user> -d eventease -c "ALTER TABLE events DROP COLUMN \"waitlistEnabled\";"

# 4. Mark the migration as rolled back so Prisma stops trying to apply it
npx prisma migrate resolve --rolled-back 20260411090521_add_waitlist_enabled

# 5. Regenerate
npx prisma generate
```

Only do this on a local dev DB — never on production data without a backup.

---

## 8. Known limitations (deferred, not bugs)

These are intentional v1 cuts. Don't file them as bugs on the other local:

- **Capacity-increase trigger** — if an organizer raises an event's capacity, no auto-promotion happens. Worth a follow-up PR.
- **Acceptance window** — promoted users don't get a "you have 24h to confirm" gate; the seat just becomes theirs.
- **Manual organizer "promote this user" button** — auto-only for now.
