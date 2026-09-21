import "server-only";

import { getSupabaseServerClient } from "@/lib/database/client";
import {
  DATABASE_OPERATION_HEADER,
  DatabaseOperationError,
  runDatabaseOperation,
} from "@/lib/database/diagnostics";
import type {
  Account,
  Invoice,
  Party,
  PaymentAttempt,
  ProviderError,
  Transaction,
  TransactionWithRelations,
} from "@/lib/database/types";

export async function getTransactionByReference(reference: string) {
  const { data } = await runDatabaseOperation("get_transaction_by_reference", () =>
    getSupabaseServerClient()
      .from("transactions")
      .select("*")
      .ilike("transaction_reference", reference)
      .setHeader(DATABASE_OPERATION_HEADER, "get_transaction_by_reference")
      .maybeSingle(),
  );
  return data as Transaction | null;
}

export async function getTransactionById(transaction_id: string) {
  const { data } = await runDatabaseOperation("get_transaction_by_id", () =>
    getSupabaseServerClient()
      .from("transactions")
      .select("*")
      .eq("id", transaction_id)
      .setHeader(DATABASE_OPERATION_HEADER, "get_transaction_by_id")
      .maybeSingle(),
  );
  return data as Transaction | null;
}

export async function getAccountById(account_id: string) {
  const { data } = await runDatabaseOperation("get_account_by_id", () =>
    getSupabaseServerClient()
      .from("accounts")
      .select("*")
      .eq("id", account_id)
      .setHeader(DATABASE_OPERATION_HEADER, "get_account_by_id")
      .maybeSingle(),
  );
  return data as Account | null;
}

export async function getPartyById(party_id: string) {
  const { data } = await runDatabaseOperation("get_party_by_id", () =>
    getSupabaseServerClient()
      .from("parties")
      .select("*")
      .eq("id", party_id)
      .setHeader(DATABASE_OPERATION_HEADER, "get_party_by_id")
      .maybeSingle(),
  );
  return data as Party | null;
}

export async function getInvoiceById(invoice_id: string) {
  const { data } = await runDatabaseOperation("get_invoice_by_id", () =>
    getSupabaseServerClient()
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .setHeader(DATABASE_OPERATION_HEADER, "get_invoice_by_id")
      .maybeSingle(),
  );
  return data as Invoice | null;
}

export async function getPaymentAttemptsByTransaction(transaction_id: string) {
  const { data } = await runDatabaseOperation("get_payment_attempts", () =>
    getSupabaseServerClient()
      .from("payment_attempts")
      .select("*")
      .eq("transaction_id", transaction_id)
      .order("attempt_number", { ascending: true })
      .setHeader(DATABASE_OPERATION_HEADER, "get_payment_attempts"),
  );
  return (data ?? []) as PaymentAttempt[];
}

export async function findDuplicateTransactions(transaction_id: string) {
  const transaction = await getTransactionById(transaction_id);
  if (!transaction) return [];

  const { data } = await runDatabaseOperation("find_duplicate_transactions", () => {
    let query = getSupabaseServerClient()
      .from("transactions")
      .select("*")
      .eq("party_id", transaction.party_id)
      .eq("amount", transaction.amount)
      .eq("currency", transaction.currency)
      .neq("id", transaction.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (transaction.invoice_id) query = query.eq("invoice_id", transaction.invoice_id);
    return query.setHeader(DATABASE_OPERATION_HEADER, "find_duplicate_transactions");
  });
  return (data ?? []) as Transaction[];
}

export async function getProviderError(code: string, provider: string) {
  const { data } = await runDatabaseOperation("get_provider_error", () =>
    getSupabaseServerClient()
      .from("provider_errors")
      .select("*")
      .ilike("code", code)
      .ilike("provider", provider)
      .setHeader(DATABASE_OPERATION_HEADER, "get_provider_error")
      .maybeSingle(),
  );
  return data as ProviderError | null;
}

export async function listTransactions(limit = 100) {
  const { data } = await runDatabaseOperation("list_transactions", () =>
    getSupabaseServerClient()
      .from("transactions")
      .select("*, parties(name,type), accounts(account_name), invoices(invoice_number)")
      .order("created_at", { ascending: false })
      .limit(limit)
      .setHeader(DATABASE_OPERATION_HEADER, "list_transactions"),
  );
  return (data ?? []) as unknown as TransactionWithRelations[];
}

export interface DatabaseHealth {
  ok: boolean;
  service: "supabase";
  http_status: number | null;
  postgrest_code: string | null;
  classification: "healthy" | "transient" | "non_transient";
  duration_ms: number;
  message: string;
}

export interface DatabaseReadDiagnostic {
  operation: string;
  success: boolean;
  http_status: number | null;
  postgrest_code: string | null;
  message: string;
}

type DiagnosticQueryResult = {
  error: import("@supabase/supabase-js").PostgrestError | null;
  status: number;
  statusText?: string;
};

async function runDatabaseReadDiagnostic(
  operation: string,
  query: () => PromiseLike<DiagnosticQueryResult>,
): Promise<DatabaseReadDiagnostic> {
  try {
    const result = await runDatabaseOperation(operation, query);
    return {
      operation,
      success: true,
      http_status: result.status,
      postgrest_code: null,
      message: "Query succeeded.",
    };
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      return {
        operation,
        success: false,
        http_status: error.httpStatus,
        postgrest_code: error.postgrestCode,
        message: error.safeMessage,
      };
    }

    return {
      operation,
      success: false,
      http_status: null,
      postgrest_code: null,
      message: "Database diagnostic failed.",
    };
  }
}

export async function getDatabaseReadDiagnostics(): Promise<DatabaseReadDiagnostic[]> {
  const client = getSupabaseServerClient();
  const checks: Array<[string, () => PromiseLike<DiagnosticQueryResult>]> = [
    ["simple_read_transactions", () => client.from("transactions").select("id").limit(1).setHeader(DATABASE_OPERATION_HEADER, "simple_read_transactions")],
    ["simple_read_accounts", () => client.from("accounts").select("id").limit(1).setHeader(DATABASE_OPERATION_HEADER, "simple_read_accounts")],
    ["simple_read_parties", () => client.from("parties").select("id").limit(1).setHeader(DATABASE_OPERATION_HEADER, "simple_read_parties")],
    ["count_transactions", () => client.from("transactions").select("*", { count: "exact", head: true }).setHeader(DATABASE_OPERATION_HEADER, "count_transactions")],
    ["count_accounts", () => client.from("accounts").select("*", { count: "exact", head: true }).setHeader(DATABASE_OPERATION_HEADER, "count_accounts")],
    ["count_parties", () => client.from("parties").select("*", { count: "exact", head: true }).setHeader(DATABASE_OPERATION_HEADER, "count_parties")],
    ["relationship_transactions_parties", () => client.from("transactions").select("id, parties(name,type)").limit(1).setHeader(DATABASE_OPERATION_HEADER, "relationship_transactions_parties")],
    ["relationship_transactions_accounts", () => client.from("transactions").select("id, accounts(account_name)").limit(1).setHeader(DATABASE_OPERATION_HEADER, "relationship_transactions_accounts")],
    ["relationship_transactions_invoices", () => client.from("transactions").select("id, invoices(invoice_number)").limit(1).setHeader(DATABASE_OPERATION_HEADER, "relationship_transactions_invoices")],
    ["list_transactions_relationships", () => client.from("transactions").select("id, parties(name,type), accounts(account_name), invoices(invoice_number)").limit(1).setHeader(DATABASE_OPERATION_HEADER, "list_transactions_relationships")],
  ];

  return Promise.all(checks.map(([operation, query]) => runDatabaseReadDiagnostic(operation, query)));
}

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const startedAt = performance.now();

  try {
    const result = await runDatabaseOperation("database_health_check", () =>
      getSupabaseServerClient()
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .limit(1)
        .setHeader(DATABASE_OPERATION_HEADER, "database_health_check"),
    );

    return {
      ok: true,
      service: "supabase",
      http_status: result.status,
      postgrest_code: null,
      classification: "healthy",
      duration_ms: Math.round(performance.now() - startedAt),
      message: "Database connectivity check passed.",
    };
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      return {
        ok: false,
        service: "supabase",
        http_status: error.httpStatus,
        postgrest_code: error.postgrestCode,
        classification: error.transient ? "transient" : "non_transient",
        duration_ms: error.durationMs,
        message: "Database connectivity check failed.",
      };
    }

    return {
      ok: false,
      service: "supabase",
      http_status: null,
      postgrest_code: null,
      classification: "non_transient",
      duration_ms: Math.round(performance.now() - startedAt),
      message: "Database connectivity check failed.",
    };
  }
}
