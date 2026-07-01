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
- **SQLite** for local dev (zero setup); swappable for Postgres/Neon in prod
- **Auth.js v5** — passwordless **magic-link** email login
- **Tailwind CSS v4** — cozy responsive UI
- **Zod** — shared input validation
- **Vitest** — unit tests

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#    Then edit SEED_MEMBER_EMAILS to list you and your friends' emails
#    (the first email becomes the group owner).

# 3. Create the database + seed your group
npm run db:setup      # runs migrations, then seeds the group + sample data

# 4. Run it
npm run dev           # http://localhost:3000
```

### Signing in (local dev)

There's **no email server needed in development**. When you request a sign-in
link, the magic-link URL is **printed to the terminal running `npm run dev`** —
copy it into your browser to sign in. Only emails listed in `SEED_MEMBER_EMAILS`
(i.e. members of the group) can access the feed; others land on a welcome screen.

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
  auth.ts                 Auth.js config (magic-link + Drizzle adapter)
  db/
    schema.ts             Drizzle schema (enrichment-ready media model)
    index.ts              DB client
    seed.ts               Seed group + members + samples
  lib/
    auth-guard.ts         requireMember() — group-scoped access control
    actions.ts            Server actions (create, react, comment, status)
    queries.ts            Read helpers for the feed / item / lists
    validation.ts         Zod schemas
  components/             UI (media card, reaction bar, forms, nav, ...)
  app/                    Routes: /feed /new /item/[id] /me /members /login ...
```

## Deploying to production

The app targets **Vercel + Neon (Postgres)** for a free/low-cost deploy:

1. Push this repo to GitHub and import it in Vercel.
2. Create a Neon Postgres database.
3. Swap the SQLite driver for Postgres: change `src/db/index.ts` to use
   `drizzle-orm/neon-http` (or `postgres-js`) and set `dialect: "postgresql"` in
   `drizzle.config.ts`; the schema column types port directly (text ids, json
   metadata, timestamp columns).
4. For real magic-link emails, set `RESEND_API_KEY` and a verified `EMAIL_FROM`
   (a [Resend](https://resend.com) free account is enough). Without a key, links
   are logged to the server console (dev behavior).
5. Set env vars in Vercel: `DATABASE_URL`, `AUTH_SECRET` (`npx auth secret`),
   `AUTH_URL` (your domain), `RESEND_API_KEY`, `EMAIL_FROM`.

## Roadmap

- **Now:** magic-link login, shared feed, post/react/comment, want-to-try /
  consumed + ratings, "for a friend" tagging, personal lists, PWA manifest.
- **Next:** email invites for new friends; optimistic reactions; feed search.
- **Later — media enrichment:** auto-fill cover art & metadata from TMDB (movies/
  TV), Open Library (books), and IGDB (games). The `mediaItems` table already has
  nullable `externalSource` / `coverImageUrl` / `metadata` columns, so this is
  purely additive — no migration required.
- **Native app:** ship the PWA now; wrap the same app with **Capacitor** for the
  App Store / Play Store when you want true native (push notifications, etc.),
  reusing ~100% of the code.
