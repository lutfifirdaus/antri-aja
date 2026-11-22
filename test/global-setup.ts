import { execFileSync } from "node:child_process";
import { Client } from "pg";

// Prepares the real test database before any test runs:
//  1. refuses to run unless the database name ends in `_test` (tests delete data),
//  2. creates the database if it does not exist,
//  3. applies the committed migrations.
export default async function setup() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set. Tests need a real Postgres (see README: pnpm test:docker).");
  }
  const url = new URL(raw);
  const dbName = decodeURIComponent(url.pathname.slice(1));
  if (!/^[a-z0-9_]+_test$/.test(dbName)) {
    throw new Error(`Refusing to run tests against "${dbName}": database name must end with "_test".`);
  }

  const adminUrl = new URL(raw);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await admin.end();
  }

  execFileSync("./node_modules/.bin/prisma", ["migrate", "deploy"], { stdio: "inherit", env: process.env });
}
