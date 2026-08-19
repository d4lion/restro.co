import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function getConnectionString(): string {
  let connectionString = process.env.DATABASE_URL || "";
  if (connectionString.includes("?pgbouncer=true")) {
    connectionString = connectionString.replace("?pgbouncer=true", "");
  }
  return connectionString;
}

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: getConnectionString(),
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
