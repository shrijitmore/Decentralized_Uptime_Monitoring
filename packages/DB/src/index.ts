import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Load .env file from the DB package directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error(`DATABASE_URL environment variable is not set. Checked: ${envPath}`);
}

// Ensure DATABASE_URL is a string
const databaseUrl = String(process.env.DATABASE_URL).trim();

if (!databaseUrl || databaseUrl === 'undefined') {
  throw new Error(`DATABASE_URL is invalid: ${databaseUrl}`);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});
