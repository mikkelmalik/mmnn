import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

// Reuse the connection across hot reloads in dev to avoid exhausting handles.
const globalForDb = globalThis as unknown as {
  __pg?: postgres.Sql;
};

const client = globalForDb.__pg ?? postgres(DATABASE_URL);
if (process.env.NODE_ENV !== "production") globalForDb.__pg = client;

export const db = drizzle(client, { schema });
export { schema };
