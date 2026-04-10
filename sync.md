# EventEase — Sync Guide (run on the OTHER local)

This guide brings your other machine's clone of EventEase in sync with the state on the primary local (branch `main`, tip `cac2a32`). It covers git history, dependencies, Prisma schema/migrations, the database, and environment variables.

---

## 0. Security prerequisite (do this first)

The primary local's `origin` remote URL currently contains an embedded GitHub personal access token (`ghp_...`). **That token has been exposed in shell output and should be considered compromised.** Before anything else:

1. Go to https://github.com/settings/tokens and **revoke** the token starting with `ghp_CtSKve...`.
2. Generate a new token (fine-grained recommended) OR switch to SSH.
3. On BOTH machines, remove any token from the remote URL:
   ```bash
   git remote set-url origin https://github.com/kanhaiya-22/EventEase.git
   # OR, preferred, use SSH:
   # git remote set-url origin git@github.com:kanhaiya-22/EventEase.git
   ```
4. Configure a credential helper so tokens are stored by git, not pasted into URLs:
   ```bash
   git config --global credential.helper manager   # Windows
   ```

Do not skip this. Anyone with that token can push to the repo.

---

## 1. Preserve any in-progress work on the other local

Before pulling, check whether the other local has commits or uncommitted changes you care about.

```bash
cd /path/to/EventEase

git status
git log --oneline -20
git log --oneline origin/main..HEAD    # commits that exist ONLY on this machine
```

- If `git status` shows modified/untracked files you want to keep: `git stash push -u -m "other-local-wip"`
- If `git log origin/main..HEAD` lists commits you want to keep, note their hashes. Do NOT discard them. You'll rebase or cherry-pick them after the sync.
- If you are sure you don't need anything on this machine, you can skip straight to step 2.

---

## 2. Fetch and fast-forward from origin

The primary local has already pushed everything to `origin/main` (tip `cac2a32 change contact email address`). So on the other local:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
```

If `--ff-only` fails, the other local has diverged. In that case:

```bash
# See what diverged
git log --oneline --graph --all --decorate -30

# Option A — you want your local commits on top of origin
git rebase origin/main
# resolve any conflicts, then: git rebase --continue

# Option B — throw away local main entirely (DESTRUCTIVE, only if you're sure)
# git reset --hard origin/main
```

Verify you are now at `cac2a32`:

```bash
git log -1 --oneline
# expected: cac2a32 change contact email address
```

Restore any stashed work:

```bash
git stash list
git stash pop    # if you stashed in step 1
```

---

## 3. Reinstall dependencies

`package.json` picked up new deps across the recent commits (`@google/generative-ai`, `groq-sdk`, `@radix-ui/react-tabs`, `sonner`, etc.). The safest move is a clean install:

```bash
# Windows (bash / git-bash)
rm -rf node_modules
rm -f package-lock.json    # only if you want a clean lockfile; otherwise skip
npm install
```

If you kept `package-lock.json`, use `npm ci` instead of `npm install` for a reproducible install.

---

## 4. Environment variables

The existing `.env.example` is **out of date** — two variables used by recent commits are missing from it. Open your `.env` on the other local and make sure it has all of the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/eventease?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Resend (transactional email)
RESEND_API_KEY=""
# In NODE_ENV=development, all outgoing email is redirected to this address:
TEST_EMAIL="you@example.com"

# Cloudinary (uploads)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Chatbot (Groq — used by /api/chat, added in commit 458a56a)
CHATBOT_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Copy the real secret values from the primary local's `.env` by hand (do NOT commit or share them). If you don't need the chatbot on this machine, leave `CHATBOT_API_KEY` blank — `/api/chat` returns a friendly error when it's missing.

---

## 5. Database sync

You have two choices here. Pick ONE based on whether you want the other local's DB data preserved or replaced.

### Option A — Keep the other local's data, only update schema (RECOMMENDED for most cases)

This runs the new migrations (announcements, organizer verification, etc.) against whatever database the other local already has.

```bash
npx prisma generate
npx prisma migrate deploy
```

`migrate deploy` (not `migrate dev`) applies any pending migrations without creating new ones, and won't touch data in unrelated tables.

**Note on the duplicate-named migration:** the repo contains two migration folders both named `add_organizer_verification` (timestamps `20260408053557` and `20260408053605`). This is unusual but valid — Prisma treats them as distinct migrations by their timestamped folder name. `migrate deploy` will apply both in order. No action needed from you.

If `migrate deploy` reports drift ("database schema is not in sync with migration history"), your other local's DB was previously modified by hand. In that case, the safest recovery is:

```bash
# DESTRUCTIVE — wipes the local dev DB then reapplies all migrations
npx prisma migrate reset
```

Only run `migrate reset` on a local dev database. It drops and recreates the schema.

### Option B — Copy the actual DB contents from the primary local

Use this if you want the same rows (users, events, registrations, announcements) on both machines, not just the same schema.

**On the primary local (export):**

```bash
# Replace values to match your DATABASE_URL
pg_dump -h localhost -U <user> -d eventease -F c -f eventease.dump
```

Transfer `eventease.dump` to the other machine (USB, scp, cloud drive).

**On the other local (import):**

```bash
# Drop & recreate the DB first
psql -h localhost -U <user> -d postgres -c "DROP DATABASE IF EXISTS eventease;"
psql -h localhost -U <user> -d postgres -c "CREATE DATABASE eventease;"

pg_restore -h localhost -U <user> -d eventease --clean --if-exists eventease.dump

# Regenerate the Prisma client against the restored DB
npx prisma generate
```

After an import you do NOT need to run `migrate deploy` — the dump already contains the schema at `cac2a32`.

---

## 6. Regenerate Prisma client (always)

Whether you picked option A or B above, make sure the client is fresh:

```bash
npx prisma generate
```

---

## 7. Sanity check

```bash
npm run lint
npm run dev
```

Open http://localhost:3000 and verify:

- You can log in with an existing account (or register a new one)
- The announcements page loads: http://localhost:3000/announcements
- The admin organizer-requests page loads (if logged in as admin): http://localhost:3000/admin/organizer-requests
- The Eeva chatbot widget appears in the bottom corner (from commit `458a56a`)
- The sidebar shows the new nav items

If anything 500s, first check the terminal for a Prisma error — it usually means a migration wasn't applied or the Prisma client is stale. Re-run:

```bash
npx prisma generate
npx prisma migrate deploy
```

---

## 8. What this sync covers — reference

Commits pulled in (oldest first among the recent batch):

| Hash | Message |
|------|---------|
| `b1d2271` | adding pages |
| `02b6a17` | adding more features (profile, notifications, CSV export, status mgmt, org admin, college management) |
| `217740f` | adding announcement functionality (announcements, comments, reactions) |
| `458a56a` | adding chatbot functionality (Eeva / Groq + organizer verification flow) |
| `cac2a32` | change contact email address |

Prisma migrations now present in `prisma/migrations/`:

- `20260404180444_init`
- `20260405000000_add_documents_to_events`
- `20260407171801_add_announcements`
- `20260408053557_add_organizer_verification`
- `20260408053605_add_organizer_verification`

New runtime env vars introduced since init (add to `.env`):

- `CHATBOT_API_KEY` — Groq API key for `/api/chat`
- `TEST_EMAIL` — dev-mode destination for all Resend emails

New npm dependencies of note:

- `@google/generative-ai`, `groq-sdk` (chatbot)
- `@radix-ui/react-tabs`, `sonner` (UI)
- `@react-pdf/renderer` (certificates)
- `html5-qrcode`, `qrcode` (QR)

---

## 9. If something goes wrong

- **`prisma migrate deploy` fails with "migration already applied" conflict:** your DB history table disagrees with the folder list. Back up any data you care about, then `npx prisma migrate reset`.
- **`npm install` fails with peer-dep errors:** try `npm install --legacy-peer-deps`. Next.js 16 + React 19 can be strict.
- **Login works but `/api/chat` returns 500:** `CHATBOT_API_KEY` is missing or invalid. The route is coded to degrade gracefully, but check server logs.
- **Email sending throws in dev:** set `TEST_EMAIL` in `.env` — in development the code redirects all outgoing mail to that address and errors if it's unset alongside a real `RESEND_API_KEY`.
- **Diverged git history you can't reconcile:** do NOT `reset --hard` without first making a backup branch: `git branch backup-other-local-$(date +%s)` and then rebase or reset from there.
