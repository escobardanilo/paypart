import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { DataError, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { listTransactions } from "@/lib/database/repositories";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Transactions" };
export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  let transactions: Awaited<ReturnType<typeof listTransactions>> | null = null;
  try { transactions = await listTransactions(); } catch (error) { console.error("Transactions data failed", error); }
  return <><PageHeader eyebrow="Ledger view" title="Transactions" description="Read-only payment records available to the investigation agent." action={<Link href="/investigate" className="button primary"><SearchIcon />Investigate a payment</Link>} />{!transactions ? <DataError /> : transactions.length === 0 ? <EmptyState title="No transactions found" description="Records will appear when they are added to the connected data source." /> : <section className="panel table-panel"><div className="table-toolbar"><p><strong>{transactions.length}</strong> transaction records</p><span className="read-only-tag">Read only</span></div><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Party</th><th>Account</th><th>Invoice</th><th>Amount</th><th>Provider</th><th>Status</th><th>Created</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id}><td className="mono strong">{item.transaction_reference}</td><td><strong>{item.parties?.name ?? "—"}</strong><small>{item.parties?.type ?? "Unknown party"}</small></td><td>{item.accounts?.account_name ?? "—"}</td><td className="mono muted">{item.invoices?.invoice_number ?? "—"}</td><td>{formatCurrency(item.amount, item.currency)}</td><td>{item.provider}</td><td><StatusBadge status={item.status} /></td><td>{formatDate(item.created_at)}</td></tr>)}</tbody></table></div></section>}</>;
}

