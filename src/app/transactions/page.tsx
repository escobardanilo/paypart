import type { Metadata } from "next";
import { ShieldIcon } from "@/components/icons";
import { TransactionLedger } from "@/components/transaction-ledger";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return <><PageHeader eyebrow="Payment ledger" title="Transactions" description="Track payment status, related requests and provider context from one read-only operational ledger." action={<div className="ledger-safety"><ShieldIcon /><span><strong>Read-only demo</strong><small>No money movement</small></span></div>} /><TransactionLedger /></>;
}
