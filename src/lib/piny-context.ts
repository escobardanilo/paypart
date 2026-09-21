import "server-only";

import { actionRequired, activity, approvals, exceptions, paymentRequests, transactions } from "@/lib/demo-data";

function includesAny(query: string, terms: string[]) {
  return terms.some((term) => query.includes(term));
}

export function buildMinimalPinyWorkspaceContext(rawQuery: string) {
  const query = rawQuery.toLowerCase();
  const identifiers = rawQuery.match(/\b(?:REQ|TX|EXC|RF)-\d+\b/gi)?.map((value) => value.toUpperCase()) ?? [];

  if (identifiers.length > 0) {
    return {
      paymentRequests: paymentRequests.filter((item) => identifiers.includes(item.id) || identifiers.includes(item.reference)),
      approvals: approvals.filter((item) => identifiers.includes(item.requestId)),
      transactions: transactions.filter((item) => identifiers.includes(item.reference) || identifiers.includes(item.request)),
      exceptions: exceptions.filter((item) => identifiers.includes(item.id) || identifiers.includes(item.object)),
      activity: activity.filter((item) => identifiers.includes(item.object)),
    };
  }

  if (includesAny(query, ["attention", "today", "pending", "open", "priority"])) {
    return {
      actionRequired,
      pendingApprovals: approvals,
      openExceptions: exceptions.filter((item) => item.status !== "Resolved"),
    };
  }

  if (includesAny(query, ["approval", "authorize", "authorisation", "authorization"])) {
    return {
      approvals,
      requestsAwaitingDecision: paymentRequests.filter((item) => ["Awaiting approval", "Under review"].includes(item.status)),
    };
  }

  if (includesAny(query, ["exception", "failed", "failure", "mismatch", "duplicate"])) {
    return {
      exceptions,
      failedTransactions: transactions.filter((item) => item.status === "Failed"),
    };
  }

  if (includesAny(query, ["transaction", "payment", "provider", "refund"])) {
    return { transactions };
  }

  if (includesAny(query, ["request", "invoice", "subscription", "contractor", "expense"])) {
    return { paymentRequests };
  }

  if (includesAny(query, ["activity", "history", "happened", "event"])) {
    return { activity };
  }

  return {
    summary: {
      requests: paymentRequests.length,
      approvals: approvals.length,
      transactions: transactions.length,
      exceptions: exceptions.length,
      activityEvents: activity.length,
    },
    actionRequired,
  };
}
