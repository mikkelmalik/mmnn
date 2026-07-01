# Book Club — one image, two run modes (dev hot-reload + prod).
#
# Everything (install, build, migrate, seed, run) happens inside the container,
# so a clean host with only Docker installed can run the whole app — no host
# Node.js or `npm install` required. See docker-compose.yml for how the `dev`
# and `prod` stages are selected via COMPOSE_PROFILES.

# --- base: dependencies (incl. devDeps: needed for `next build`, drizzle-kit, tsx) ---
FROM node:22-bookworm-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- dev: hot-reload server; the source tree is bind-mounted at runtime and
#     node_modules/.next live in named volumes (see docker-compose.yml). ---
FROM base AS dev
ENV NODE_ENV=development
ENV PORT=3000
EXPOSE 3000
# Apply migrations, seed the admin owner, then run the dev server.
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run dev -- -p ${PORT} -H 0.0.0.0"]

# --- build: compile the production bundle ---
FROM base AS build
COPY . .
RUN npm run build

# --- prod: serve the compiled app ---
FROM build AS prod
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
# On start: apply DB migrations, then seed (creates/updates the admin owner from
# ADMIN_EMAIL/ADMIN_PASSWORD — idempotent), then serve. Postgres data lives in
# the "db" service (see docker-compose.yml), so app data persists across restarts.
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run start -- -p ${PORT} -H 0.0.0.0"]
