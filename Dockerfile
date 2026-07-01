# Book Club — production image.
FROM node:22-bookworm-slim

WORKDIR /app

# Install dependencies (incl. dev deps: needed for `next build` + drizzle-kit).
COPY package.json package-lock.json ./
RUN npm ci

# Build the app.
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# On start: apply DB migrations, then seed (creates/updates the admin owner from
# ADMIN_EMAIL/ADMIN_PASSWORD — idempotent), then serve. Postgres data lives in the
# "db" service (see docker-compose.yml), so app data persists across restarts.
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run start -- -p ${PORT} -H 0.0.0.0"]
