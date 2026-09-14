import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/database/client";
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

function dbError(operation: string, error: PostgrestError): never {
  throw new Error(`${operation} failed: ${error.message}`);
}

export async function getTransactionByReference(reference: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("transactions")
    .select("*")
    .ilike("transaction_reference", reference)
    .maybeSingle();

  if (error) dbError("Get transaction", error);
  return data as Transaction | null;
}

export async function getTransactionById(transaction_id: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("transactions")
    .select("*")
    .eq("id", transaction_id)
    .maybeSingle();

  if (error) dbError("Get transaction", error);
  return data as Transaction | null;
}

export async function getAccountById(account_id: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("accounts")
    .select("*")
    .eq("id", account_id)
    .maybeSingle();

  if (error) dbError("Get account", error);
  return data as Account | null;
}

export async function getPartyById(party_id: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("parties")
    .select("*")
    .eq("id", party_id)
    .maybeSingle();

  if (error) dbError("Get party", error);
  return data as Party | null;
}

export async function getInvoiceById(invoice_id: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("invoices")
    .select("*")
    .eq("id", invoice_id)
    .maybeSingle();

  if (error) dbError("Get invoice", error);
  return data as Invoice | null;
}

export async function getPaymentAttemptsByTransaction(transaction_id: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("payment_attempts")
    .select("*")
    .eq("transaction_id", transaction_id)
    .order("attempt_number", { ascending: true });

  if (error) dbError("Get payment attempts", error);
  return (data ?? []) as PaymentAttempt[];
}

export async function findDuplicateTransactions(transaction_id: string) {
  const transaction = await getTransactionById(transaction_id);
  if (!transaction) return [];

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

  const { data, error } = await query;
  if (error) dbError("Check duplicate transactions", error);
  return (data ?? []) as Transaction[];
}

export async function getProviderError(code: string, provider: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("provider_errors")
    .select("*")
    .ilike("code", code)
    .ilike("provider", provider)
    .maybeSingle();

  if (error) dbError("Get provider error", error);
  return data as ProviderError | null;
}

export async function createInvestigation(userRequest: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("investigations")
    .insert({ user_request: userRequest, status: "running" })
    .select("*")
    .single();

  if (error) dbError("Create investigation", error);
  return data as Investigation;
}

export async function updateInvestigation(
  investigation_id: string,
  values: Partial<Pick<Investigation, "transaction_id" | "status" | "diagnosis" | "recommended_action" | "completed_at">>,
) {
  const { data, error } = await getSupabaseServerClient()
    .from("investigations")
    .update(values)
    .eq("id", investigation_id)
    .select("*")
    .single();

  if (error) dbError("Update investigation", error);
  return data as Investigation;
}

export async function addInvestigationEvent(values: {
  investigation_id: string;
  event_type: string;
  tool_name?: string | null;
  input?: Json | null;
  output?: Json | null;
}) {
  const { data, error } = await getSupabaseServerClient()
    .from("investigation_events")
    .insert({
      investigation_id: values.investigation_id,
      event_type: values.event_type,
      tool_name: values.tool_name ?? null,
      input: values.input ?? null,
      output: values.output ?? null,
    })
    .select("*")
    .single();

  if (error) dbError("Create investigation event", error);
  return data as InvestigationEvent;
}

export async function createActionRequest(values: {
  investigation_id: string;
  action_type: ActionRequest["action_type"];
  title: string;
  description: string;
}) {
  const { data, error } = await getSupabaseServerClient()
    .from("action_requests")
    .insert({ ...values, status: "pending" })
    .select("*")
    .single();

  if (error) dbError("Create action request", error);
  return data as ActionRequest;
}

export async function getActionRequestById(action_request_id: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("action_requests")
    .select("*")
    .eq("id", action_request_id)
    .maybeSingle();

  if (error) dbError("Verify action request", error);
  return data as ActionRequest | null;
}

export async function listTransactions(limit = 100) {
  const { data, error } = await getSupabaseServerClient()
    .from("transactions")
    .select("*, parties(name,type), accounts(account_name), invoices(invoice_number)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) dbError("List transactions", error);
  return (data ?? []) as unknown as TransactionWithRelations[];
}

export async function listInvestigations(limit = 100) {
  const { data, error } = await getSupabaseServerClient()
    .from("investigations")
    .select("*, transactions(transaction_reference,amount,currency,status)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) dbError("List investigations", error);
  return (data ?? []) as unknown as InvestigationWithTransaction[];
}

export async function listActionRequests(limit = 100) {
  const { data, error } = await getSupabaseServerClient()
    .from("action_requests")
    .select("*, investigations(user_request, transactions(transaction_reference))")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) dbError("List action requests", error);
  return (data ?? []) as unknown as ActionWithInvestigation[];
}

export async function getInvestigationDetail(investigation_id: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("investigations")
    .select("*, transactions(transaction_reference,amount,currency,status,provider,provider_error_code,created_at)")
    .eq("id", investigation_id)
    .maybeSingle();

  if (error) dbError("Get investigation", error);
  if (!data) return null;

  const [eventsResult, actionsResult] = await Promise.all([
    getSupabaseServerClient().from("investigation_events").select("*").eq("investigation_id", investigation_id).order("created_at", { ascending: true }),
    getSupabaseServerClient().from("action_requests").select("*").eq("investigation_id", investigation_id).order("created_at", { ascending: true }),
  ]);

  if (eventsResult.error) dbError("Get investigation events", eventsResult.error);
  if (actionsResult.error) dbError("Get investigation actions", actionsResult.error);

  return {
    investigation: data as unknown as InvestigationWithTransaction & {
      transactions: (Pick<Transaction, "transaction_reference" | "amount" | "currency" | "status" | "provider" | "provider_error_code" | "created_at">) | null;
    },
    events: (eventsResult.data ?? []) as InvestigationEvent[],
    actions: (actionsResult.data ?? []) as ActionRequest[],
  };
}

async function countRows(table: "transactions" | "investigations" | "action_requests", status?: string) {
  let query = getSupabaseServerClient().from(table).select("*", { count: "exact", head: true });
  if (status) query = query.eq("status", status);
  const { count, error } = await query;
  if (error) dbError(`Count ${table}`, error);
  return count ?? 0;
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
