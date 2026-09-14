import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  DATABASE_OPERATION_HEADER,
  isTransientDatabaseFailure,
  logDatabaseDiagnostic,
  safeDatabaseMessage,
} from "@/lib/database/diagnostics";
import { getServerEnv } from "@/lib/validation/env";

let client: SupabaseClient | undefined;

const DATABASE_REQUEST_TIMEOUT_MS = 6_000;
const RETRYABLE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const RETRYABLE_STATUSES = new Set([502, 503, 504, 525]);

function requestMethod(input: RequestInfo | URL, init?: RequestInit) {
  return (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
}

function requestHeaders(input: RequestInfo | URL, init?: RequestInit) {
  return new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
}

async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  const method = requestMethod(input, init);
  const headers = requestHeaders(input, init);
  const operation = headers.get(DATABASE_OPERATION_HEADER) || "supabase_request";
  headers.delete(DATABASE_OPERATION_HEADER);
  const mayRetry = RETRYABLE_METHODS.has(method);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const startedAt = performance.now();
    const controller = new AbortController();
    let timedOut = false;
    const upstreamSignal = init?.signal;
    const abortFromUpstream = () => controller.abort(upstreamSignal?.reason);
    if (upstreamSignal) upstreamSignal.addEventListener("abort", abortFromUpstream, { once: true });
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException("Database request timed out", "TimeoutError"));
    }, DATABASE_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(input, { ...init, headers, signal: controller.signal });
      const shouldRetry = mayRetry && attempt === 0 && RETRYABLE_STATUSES.has(response.status);
      if (shouldRetry) {
        logDatabaseDiagnostic({
          operation,
          http_status: response.status,
          postgrest_code: null,
          message: safeDatabaseMessage(response.statusText || "Transient upstream response"),
          classification: "transient",
          duration_ms: Math.round(performance.now() - startedAt),
        });
        await response.body?.cancel();
        continue;
      }
      return response;
    } catch (error) {
      const upstreamAborted = upstreamSignal?.aborted === true;
      const message = safeDatabaseMessage(timedOut ? "Database request timed out" : error);
      const transient = !upstreamAborted && isTransientDatabaseFailure(null, message);
      if (mayRetry && attempt === 0 && transient) {
        logDatabaseDiagnostic({
          operation,
          http_status: null,
          postgrest_code: null,
          message,
          classification: "transient",
          duration_ms: Math.round(performance.now() - startedAt),
        });
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      if (upstreamSignal) upstreamSignal.removeEventListener("abort", abortFromUpstream);
    }
  }

  throw new Error("Database request failed after one retry.");
}

export function getSupabaseServerClient() {
  if (!client) {
    const env = getServerEnv();
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      db: {
        retry: false,
      },
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        fetch: supabaseFetch,
      },
    });
  }

  return client;
}
