import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// A placeholder URL lets `next build` run without a database; real queries need DATABASE_URL.
const url = process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/placeholder";
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

type DB = ReturnType<typeof drizzleNeon<typeof schema>>;

/** Neon (serverless HTTP) in production; a normal Postgres pool when DATABASE_URL points at localhost (local dev). */
export const db: DB = isLocal
  ? (drizzlePg(new Pool({ connectionString: url }), { schema }) as unknown as DB)
  : drizzleNeon(neon(url), { schema });

export * from "./schema";
