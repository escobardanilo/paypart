import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

export const DATABASE_OPERATION_HEADER = "x-paypart-database-operation";

const TRANSIENT_HTTP_STATUSES = new Set([502, 503, 504, 525]);
const SENSITIVE_PATTERNS = [
  /\bBearer\s+\S+/gi,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  /\bgsk_[A-Za-z0-9_-]+\b/g,
  /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+\b/g,
  /https?:\/\/\S+/gi,
];

interface DatabaseResult {
  error: PostgrestError | null;
  status: number;
  statusText?: string;
}

export interface DatabaseDiagnostic {
  operation: string;
  http_status: number | null;
  postgrest_code: string | null;
  message: string;
  classification: "transient" | "non_transient";
  duration_ms: number;
}

export class DatabaseOperationError extends Error {
  readonly operation: string;
  readonly httpStatus: number | null;
  readonly postgrestCode: string | null;
  readonly safeMessage: string;
  readonly transient: boolean;
  readonly durationMs: number;

  constructor(diagnostic: DatabaseDiagnostic) {
    super(`${diagnostic.operation} failed: ${diagnostic.message}`);
    this.name = "DatabaseOperationError";
    this.operation = diagnostic.operation;
    this.httpStatus = diagnostic.http_status;
    this.postgrestCode = diagnostic.postgrest_code;
    this.safeMessage = diagnostic.message;
    this.transient = diagnostic.classification === "transient";
    this.durationMs = diagnostic.duration_ms;
  }
}

export function safeDatabaseMessage(value: unknown) {
  const original = value instanceof Error ? value.message : typeof value === "string" ? value : "Database request failed.";
  if (/<!doctype\s+html|<html[\s>]/i.test(original)) return "Upstream returned an HTML error response.";
  return SENSITIVE_PATTERNS.reduce((message, pattern) => message.replace(pattern, "[redacted]"), original)
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 300);
}

export function isTransientDatabaseFailure(status: number | null, message: string) {
  if (status !== null && TRANSIENT_HTTP_STATUSES.has(status)) return true;
  if (status !== null && status !== 0) return false;
  return /abort|fetch failed|network|socket|timed?\s*out|timeout|econnreset|enotfound|eai_again/i.test(message);
}

export function logDatabaseDiagnostic(diagnostic: DatabaseDiagnostic) {
  console.error("Database diagnostic", diagnostic);
}

export async function runDatabaseOperation<T extends DatabaseResult>(
  operation: string,
  request: () => PromiseLike<T>,
): Promise<T> {
  const startedAt = performance.now();

  try {
    const result = await request();
    if (!result.error) return result;

    const message = result.status === 525
      ? "Upstream TLS handshake failed."
      : safeDatabaseMessage(result.error.message || result.statusText);
    const diagnostic: DatabaseDiagnostic = {
      operation,
      http_status: result.status || null,
      postgrest_code: result.error.code || null,
      message,
      classification: isTransientDatabaseFailure(result.status, message) ? "transient" : "non_transient",
      duration_ms: Math.round(performance.now() - startedAt),
    };
    logDatabaseDiagnostic(diagnostic);
    throw new DatabaseOperationError(diagnostic);
  } catch (error) {
    if (error instanceof DatabaseOperationError) throw error;

    const message = safeDatabaseMessage(error);
    const diagnostic: DatabaseDiagnostic = {
      operation,
      http_status: null,
      postgrest_code: null,
      message,
      classification: isTransientDatabaseFailure(null, message) ? "transient" : "non_transient",
      duration_ms: Math.round(performance.now() - startedAt),
    };
    logDatabaseDiagnostic(diagnostic);
    throw new DatabaseOperationError(diagnostic);
  }
}
