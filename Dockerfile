# Book Club — production image.
# Uses a full build stage (better-sqlite3 is a native module and needs a
# compiler at install time), then runs migrations and starts Next.js.
FROM node:22-bookworm-slim

WORKDIR /app

# Build tools required to compile better-sqlite3 (node-gyp).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (incl. dev deps: needed for `next build` + drizzle-kit).
COPY package.json package-lock.json ./
RUN npm ci

# Build the app.
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Apply DB migrations on start, then serve. The SQLite file lives on a mounted
# volume (see docker-compose.yml), so data persists across restarts/redeploys.
CMD ["sh", "-c", "npm run db:migrate && npm run start -- -p ${PORT} -H 0.0.0.0"]
