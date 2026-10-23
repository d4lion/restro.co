/**
 * Prisma error codes that indicate the database is unreachable or unavailable.
 * https://www.prisma.io/docs/orm/reference/error-reference
 */
const DB_UNAVAILABLE_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server timed out
  "P1008", // Operations timed out
  "P1017", // Server has closed the connection
  "P2024", // Timed out fetching a connection from the pool
]);

const DB_UNAVAILABLE_ADAPTER_KINDS = new Set([
  "DatabaseNotReachable",
  "DatabaseDoesNotExist",
  "SocketTimeout",
  "ConnectionClosed",
  "TooManyConnections",
]);

export class DatabaseUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Database is currently unavailable", { cause });
    this.name = "DatabaseUnavailableError";
  }
}

/** Returns true if the error means the database cannot be reached right now. */
export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (error instanceof DatabaseUnavailableError) return true;

  const err = error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
    meta?: { driverAdapterError?: { cause?: { kind?: unknown }; message?: unknown } };
    cause?: unknown;
  };

  if (typeof err.code === "string" && DB_UNAVAILABLE_CODES.has(err.code)) return true;
  if (err.name === "PrismaClientInitializationError") return true;

  const adapterKind = err.meta?.driverAdapterError?.cause?.kind;
  if (typeof adapterKind === "string" && DB_UNAVAILABLE_ADAPTER_KINDS.has(adapterKind)) return true;

  if (typeof err.message === "string" && /ECONNREFUSED|Can't reach database server/i.test(err.message)) {
    return true;
  }

  return err.cause ? isDatabaseUnavailableError(err.cause) : false;
}
