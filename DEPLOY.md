# Deploying Book Club to a VPS

This app runs great on a single small VPS (1 shared vCPU / 1 GB RAM is plenty for
a friend group). It uses **Postgres on a persistent disk**, so state survives
container rebuilds.

The provided **Docker Compose** setup runs the app, a **Postgres** database, and
**Caddy**, which fetches and renews HTTPS certificates for your domain
automatically.

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
cp .env.example .env
nano .env          # fill in DOMAIN, AUTH_URL, AUTH_SECRET, POSTGRES_PASSWORD,
                   # and ADMIN_EMAIL + ADMIN_PASSWORD (your login)
```

Generate a real secret for `AUTH_SECRET`:
```bash
npx auth secret        # or: openssl rand -base64 32
```

### Admin login (required)

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. On first start the app creates
this user as the **group owner** — you sign in with that email + password at
`https://your-domain/login`, no email service needed. Change `ADMIN_PASSWORD` and
re-deploy to rotate it (the seed re-syncs the password on every start).

### Login email (optional)

Members can also request a passwordless **magic link**. For that link to actually
send, create a free [Resend](https://resend.com) account, verify your sending
domain, and set `RESEND_API_KEY` + `EMAIL_FROM` in `.env`. Without a key the link
is only printed to the container log (`docker compose logs app`). Since invited
members set a password when they sign up, Resend is entirely optional.

> Prefer your own mailbox/SMTP instead of Resend? Ask and the magic-link provider
> can be switched to plain SMTP (Gmail app password, Fastmail, self-hosted, etc.).

## 2. Launch

```bash
docker compose up -d --build
```

This starts Postgres, builds the app image, applies database migrations **and
seeds the admin owner** on start, and brings up the app behind Caddy. Give Caddy
a minute to obtain the certificate, then visit `https://your-domain`.

## 3. Sign in and invite people

1. Go to `https://your-domain/login` and sign in with `ADMIN_EMAIL` /
   `ADMIN_PASSWORD`.
2. Open the **Group** tab and click **Create link** to generate a sign-up link.
3. Share the link. Anyone who opens it picks a password and joins the group;
   they then sign in with email + password like you do.

Only members of the group can access the feed — anyone else lands on a welcome
screen. You can revoke a sign-up link anytime from the Group tab.

## Operations

| Task | Command |
| --- | --- |
| View logs | `docker compose logs -f app` |
| Restart | `docker compose restart app` |
| Update to latest | `git pull && docker compose up -d --build` |
| Open a DB shell | `docker compose exec db psql -U ${POSTGRES_USER:-bookclub} -d ${POSTGRES_DB:-bookclub}` |
| Open Drizzle Studio | `docker compose exec app npx drizzle-kit studio` |

### Backups

Your entire app state lives in the `db` service's `pgdata` volume. Back it up on
a schedule, e.g. a nightly cron on the host:

```bash
docker compose exec -T db pg_dump -U ${POSTGRES_USER:-bookclub} ${POSTGRES_DB:-bookclub} > backup-$(date +%F).sql
```

## Notes & limits

- **HTTPS is required** — Auth.js uses secure cookies, so sign-in won't work over
  plain HTTP. The Caddy setup handles TLS for you; just use the `https://` URL.
- **Migrations** run automatically on container start, so `git pull && up --build`
  is a safe upgrade path.
