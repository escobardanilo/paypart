import "server-only";

import { getSupabaseServerClient } from "@/lib/database/client";
import {
  DATABASE_OPERATION_HEADER,
  DatabaseOperationError,
  runDatabaseOperation,
} from "@/lib/database/diagnostics";
import type {
  Account,
  ActionRequest,
  ActionWithInvestigation,
  Investigation,
  InvestigationEvent,
  InvestigationWithTransaction,
  Invoice,
  Json,
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

export async function createInvestigation(userRequest: string) {
  const { data } = await runDatabaseOperation("create_investigation", () =>
    getSupabaseServerClient()
      .from("investigations")
      .insert({ user_request: userRequest, status: "running" })
      .select("*")
      .setHeader(DATABASE_OPERATION_HEADER, "create_investigation")
      .single(),
  );
  return data as Investigation;
}

export async function updateInvestigation(
  investigation_id: string,
  values: Partial<Pick<Investigation, "transaction_id" | "status" | "diagnosis" | "recommended_action" | "completed_at">>,
) {
  const { data } = await runDatabaseOperation("update_investigation", () =>
    getSupabaseServerClient()
      .from("investigations")
      .update(values)
      .eq("id", investigation_id)
      .select("*")
      .setHeader(DATABASE_OPERATION_HEADER, "update_investigation")
      .single(),
  );
  return data as Investigation;
}

export async function addInvestigationEvent(values: {
  investigation_id: string;
  event_type: string;
  tool_name?: string | null;
  input?: Json | null;
  output?: Json | null;
}) {
  const { data } = await runDatabaseOperation("create_investigation_event", () =>
    getSupabaseServerClient()
      .from("investigation_events")
      .insert({
        investigation_id: values.investigation_id,
        event_type: values.event_type,
        tool_name: values.tool_name ?? null,
        input: values.input ?? null,
        output: values.output ?? null,
      })
      .select("*")
      .setHeader(DATABASE_OPERATION_HEADER, "create_investigation_event")
      .single(),
  );
  return data as InvestigationEvent;
}

export async function createActionRequest(values: {
  investigation_id: string;
  action_type: ActionRequest["action_type"];
  title: string;
  description: string;
}) {
  const { data } = await runDatabaseOperation("create_action_request", () =>
    getSupabaseServerClient()
      .from("action_requests")
      .insert({ ...values, status: "pending" })
      .select("*")
      .setHeader(DATABASE_OPERATION_HEADER, "create_action_request")
      .single(),
  );
  return data as ActionRequest;
}

export async function getActionRequestById(action_request_id: string) {
  const { data } = await runDatabaseOperation("get_action_request_by_id", () =>
    getSupabaseServerClient()
      .from("action_requests")
      .select("*")
      .eq("id", action_request_id)
      .setHeader(DATABASE_OPERATION_HEADER, "get_action_request_by_id")
      .maybeSingle(),
  );
  return data as ActionRequest | null;
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

export async function listInvestigations(limit = 100) {
  const { data } = await runDatabaseOperation("list_investigations", () =>
    getSupabaseServerClient()
      .from("investigations")
      .select("*, transactions(transaction_reference,amount,currency,status)")
      .order("created_at", { ascending: false })
      .limit(limit)
      .setHeader(DATABASE_OPERATION_HEADER, "list_investigations"),
  );
  return (data ?? []) as unknown as InvestigationWithTransaction[];
}

export async function listActionRequests(limit = 100) {
  const { data } = await runDatabaseOperation("list_action_requests", () =>
    getSupabaseServerClient()
      .from("action_requests")
      .select("*, investigations(user_request, transactions(transaction_reference))")
      .order("created_at", { ascending: false })
      .limit(limit)
      .setHeader(DATABASE_OPERATION_HEADER, "list_action_requests"),
  );
  return (data ?? []) as unknown as ActionWithInvestigation[];
}

export async function getInvestigationDetail(investigation_id: string) {
  const { data } = await runDatabaseOperation("get_investigation_detail", () =>
    getSupabaseServerClient()
      .from("investigations")
      .select("*, transactions(transaction_reference,amount,currency,status,provider,provider_error_code,created_at)")
      .eq("id", investigation_id)
      .setHeader(DATABASE_OPERATION_HEADER, "get_investigation_detail")
      .maybeSingle(),
  );
  if (!data) return null;

  const [eventsResult, actionsResult] = await Promise.all([
    runDatabaseOperation("get_investigation_events", () =>
      getSupabaseServerClient()
        .from("investigation_events")
        .select("*")
        .eq("investigation_id", investigation_id)
        .order("created_at", { ascending: true })
        .setHeader(DATABASE_OPERATION_HEADER, "get_investigation_events"),
    ),
    runDatabaseOperation("get_investigation_actions", () =>
      getSupabaseServerClient()
        .from("action_requests")
        .select("*")
        .eq("investigation_id", investigation_id)
        .order("created_at", { ascending: true })
        .setHeader(DATABASE_OPERATION_HEADER, "get_investigation_actions"),
    ),
  ]);

  return {
    investigation: data as unknown as InvestigationWithTransaction & {
      transactions: (Pick<Transaction, "transaction_reference" | "amount" | "currency" | "status" | "provider" | "provider_error_code" | "created_at">) | null;
    },
    events: (eventsResult.data ?? []) as InvestigationEvent[],
    actions: (actionsResult.data ?? []) as ActionRequest[],
  };
}

async function countRows(table: "transactions" | "investigations" | "action_requests", status?: string) {
  const operation = `count_${table}${status ? `_${status}` : ""}`;
  const { count } = await runDatabaseOperation(operation, () => {
    let query = getSupabaseServerClient().from(table).select("*", { count: "exact", head: true });
    if (status) query = query.eq("status", status);
    return query.setHeader(DATABASE_OPERATION_HEADER, operation);
  });
  return count ?? 0;
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
    ["simple_read_investigations", () => client.from("investigations").select("id").limit(1).setHeader(DATABASE_OPERATION_HEADER, "simple_read_investigations")],
    ["simple_read_action_requests", () => client.from("action_requests").select("id").limit(1).setHeader(DATABASE_OPERATION_HEADER, "simple_read_action_requests")],
    ["count_transactions", () => client.from("transactions").select("*", { count: "exact", head: true }).setHeader(DATABASE_OPERATION_HEADER, "count_transactions")],
    ["count_investigations", () => client.from("investigations").select("*", { count: "exact", head: true }).setHeader(DATABASE_OPERATION_HEADER, "count_investigations")],
    ["count_action_requests", () => client.from("action_requests").select("*", { count: "exact", head: true }).setHeader(DATABASE_OPERATION_HEADER, "count_action_requests")],
    ["relationship_transactions_parties", () => client.from("transactions").select("id, parties(name,type)").limit(1).setHeader(DATABASE_OPERATION_HEADER, "relationship_transactions_parties")],
    ["relationship_transactions_accounts", () => client.from("transactions").select("id, accounts(account_name)").limit(1).setHeader(DATABASE_OPERATION_HEADER, "relationship_transactions_accounts")],
    ["relationship_transactions_invoices", () => client.from("transactions").select("id, invoices(invoice_number)").limit(1).setHeader(DATABASE_OPERATION_HEADER, "relationship_transactions_invoices")],
    ["list_transactions_relationships", () => client.from("transactions").select("id, parties(name,type), accounts(account_name), invoices(invoice_number)").limit(1).setHeader(DATABASE_OPERATION_HEADER, "list_transactions_relationships")],
    ["list_investigations_relationships", () => client.from("investigations").select("id, transactions(transaction_reference,amount,currency,status)").limit(1).setHeader(DATABASE_OPERATION_HEADER, "list_investigations_relationships")],
    ["relationship_action_requests_investigations", () => client.from("action_requests").select("id, investigations(user_request)").limit(1).setHeader(DATABASE_OPERATION_HEADER, "relationship_action_requests_investigations")],
    ["list_action_requests_relationships", () => client.from("action_requests").select("id, investigations(user_request, transactions(transaction_reference))").limit(1).setHeader(DATABASE_OPERATION_HEADER, "list_action_requests_relationships")],
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

export async function getDashboardData() {
  const [
    totalInvestigations,
    failedTransactions,
    openInvestigations,
    completedInvestigations,
    pendingActions,
    allInvestigations,
    actions,
    transactions,
  ] = await Promise.all([
    countRows("investigations"),
    countRows("transactions", "failed"),
    countRows("investigations", "running"),
    countRows("investigations", "completed"),
    countRows("action_requests", "pending"),
    listInvestigations(100),
    listActionRequests(5),
    listTransactions(100),
  ]);

  const activity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const dateKey = date.toISOString().slice(0, 10);
    return {
      date: dateKey,
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      count: allInvestigations.filter((item) => item.created_at.slice(0, 10) === dateKey).length,
    };
  });

  const paymentStatuses = transactions.reduce<Record<string, number>>((counts, transaction) => {
    const status = transaction.status.toLowerCase();
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});

  return {
    totalInvestigations,
    failedTransactions,
    openInvestigations,
    completedInvestigations,
    pendingActions,
    investigations: allInvestigations.slice(0, 5),
    actions,
    transactions: transactions.slice(0, 8),
    activity,
    paymentStatuses,
  };
}
