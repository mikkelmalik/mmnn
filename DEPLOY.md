# Deploying Book Club to a VPS

This app runs great on a single small VPS (1 shared vCPU / 1 GB RAM is plenty for
a friend group). It uses **SQLite on a persistent disk**, so there's no separate
database service to manage — just back up one file.

The provided **Docker Compose** setup runs the app plus **Caddy**, which fetches
and renews HTTPS certificates for your domain automatically.

## Prerequisites

- A VPS running Linux (Ubuntu 22.04+ works well) with a public IP.
- A domain name with an **A record pointing at the VPS IP** (needed before Caddy
  can issue a certificate).
- **Docker** + the Compose plugin installed:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```

## 1. Get the code and configure

```bash
git clone https://github.com/mikkelmalik/mmnn.git bookclub
cd bookclub
cp .env.deploy.example .env
nano .env          # fill in DOMAIN, AUTH_URL, AUTH_SECRET, email + seed vars
```

Generate a real secret for `AUTH_SECRET`:
```bash
npx auth secret        # or: openssl rand -base64 32
```

### Login email (important)

For your friends to sign in, the magic-link email has to actually send. Create a
free [Resend](https://resend.com) account, verify your sending domain, and set
`RESEND_API_KEY` + `EMAIL_FROM` in `.env`. Without a key the link is only printed
to the container log (`docker compose logs app`) — usable for your own testing,
but not for real users.

> Prefer your own mailbox/SMTP instead of Resend? Ask and the magic-link provider
> can be switched to plain SMTP (Gmail app password, Fastmail, self-hosted, etc.).

## 2. Launch

```bash
docker compose up -d --build
```

This builds the image, applies database migrations on start, and brings up the
app behind Caddy. Give Caddy a minute to obtain the certificate, then visit
`https://your-domain`.

## 3. Seed your group (first run only)

Create the group and add member emails (from `SEED_MEMBER_EMAILS`; first = owner):

```bash
docker compose exec app npm run db:seed
```

Only seeded member emails can access the feed — others hit a welcome screen.
To add a friend later, add their email to `SEED_MEMBER_EMAILS` and re-run the
seed (it's idempotent), or use the in-app invite flow once it lands.

## Operations

| Task | Command |
| --- | --- |
| View logs | `docker compose logs -f app` |
| Restart | `docker compose restart app` |
| Update to latest | `git pull && docker compose up -d --build` |
| Open a DB shell | `docker compose exec app npx drizzle-kit studio` |

### Backups

Your entire app state is one SQLite file inside the `dbdata` volume. Back it up
on a schedule, e.g. a nightly cron on the host:

```bash
docker compose exec -T app sh -c 'cat /data/sqlite.db' > backup-$(date +%F).db
```

## Notes & limits

- **HTTPS is required** — Auth.js uses secure cookies, so sign-in won't work over
  plain HTTP. The Caddy setup handles TLS for you; just use the `https://` URL.
- **Single server** — SQLite means one box, no horizontal scaling. Ideal for a
  small private group; if you ever outgrow it, migrate to Postgres/Neon (the
  schema ports directly — see README).
- **Migrations** run automatically on container start, so `git pull && up --build`
  is a safe upgrade path.
