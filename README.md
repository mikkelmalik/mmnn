# 📚 Book Club

A private, mobile-friendly app for you and your friends to recommend each other
media — **movies, TV, books, games, music, and more**. Post a recommendation to
a shared feed, optionally tag it "for a friend," and let everyone **react**,
**comment**, and mark things **want-to-try** or **consumed** with a rating.

Built as an installable **PWA** so it feels native on a phone (Add to Home
Screen), with a clean path to a true native app later (see below).

## Tech stack

- **Next.js 16** (App Router, React 19, TypeScript) — UI + API in one codebase
- **Drizzle ORM** — type-safe schema & migrations
- **Postgres** — the default backend everywhere, from local dev (Docker) to production
- **Auth.js v5** — **email + password** login (plus optional passwordless magic link)
- **Tailwind CSS v4** — cozy responsive UI
- **Zod** — shared input validation
- **Vitest** — unit tests

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start a local Postgres (Docker)
docker compose -f docker-compose.dev.yml up -d

# 3. Configure environment
cp .env.example .env.local
#    Then set ADMIN_EMAIL + ADMIN_PASSWORD — this becomes the group owner
#    you sign in as.

# 4. Create the database + seed the admin owner
npm run db:setup      # runs migrations, then seeds the admin + sample data

# 5. Run it
npm run dev           # http://localhost:3000
```

### Signing in (local dev)

Sign in at `/login` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set. From the
**Group** tab, create a sign-up link and share it — anyone who opens it picks a
password and joins the group. Only group members can access the feed; others
land on a welcome screen.

A passwordless **magic link** is also available (the "email me a link" option on
the login screen). In development no email server is needed — the link is
**printed to the terminal running `npm run dev`**.

## Useful scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (quick dev iteration) |
| `npm run db:seed` | Seed group, members & sample data |
| `npm run db:studio` | Open Drizzle Studio to inspect data |
| `npm run lint` / `typecheck` / `test` | Quality checks |

## Project structure

```
src/
  auth.ts                 Auth.js config (password + magic-link + Drizzle adapter)
  db/
    schema.ts             Drizzle schema (enrichment-ready media model)
    index.ts              DB client
    seed.ts               Seed admin owner + optional members + samples
  lib/
    auth-guard.ts         requireMember() — group-scoped access control
    auth-actions.ts       Sign in (password / magic link) + invite sign-up
    invite-actions.ts     Owner: create / revoke sign-up links
    password.ts           scrypt password hashing (no native deps)
    actions.ts            Server actions (create, react, comment, status)
    queries.ts            Read helpers for the feed / item / lists / invites
    validation.ts         Zod schemas
  components/             UI (media card, reaction bar, forms, invite panel, ...)
  app/                    Routes: /feed /new /item/[id] /me /members /login /signup ...
```

## Deploying to production

The provided `docker-compose.yml` runs the app, Postgres, and Caddy (automatic
HTTPS) together on a single VPS — see [DEPLOY.md](./DEPLOY.md) for the full
walkthrough.

Prefer a managed Postgres (Neon, Supabase, RDS, ...) instead of the bundled `db`
container? Just point `DATABASE_URL` at it and drop the `db` service from
`docker-compose.yml` — the app already speaks plain Postgres via `postgres-js`,
no code changes needed.

## Roadmap

- **Now:** email + password login, admin owner + shareable sign-up links,
  magic-link option, shared feed, post/react/comment, want-to-try / consumed +
  ratings, "for a friend" tagging, personal lists, PWA manifest.
- **Next:** email-delivered invites; optimistic reactions; feed search.
- **Later — media enrichment:** auto-fill cover art & metadata from TMDB (movies/
  TV), Open Library (books), and IGDB (games). The `mediaItems` table already has
  nullable `externalSource` / `coverImageUrl` / `metadata` columns, so this is
  purely additive — no migration required.
- **Native app:** ship the PWA now; wrap the same app with **Capacitor** for the
  App Store / Play Store when you want true native (push notifications, etc.),
  reusing ~100% of the code.
