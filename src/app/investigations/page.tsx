import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, SearchIcon } from "@/components/icons";
import { DataError, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { listInvestigations } from "@/lib/database/repositories";
import { formatCurrency, formatDate, truncate } from "@/lib/format";

export const metadata: Metadata = { title: "Investigations" };
export const dynamic = "force-dynamic";

export default async function InvestigationsPage() {
  let investigations: Awaited<ReturnType<typeof listInvestigations>> | null = null;
  try { investigations = await listInvestigations(); } catch (error) { console.error("Investigations data failed", error); }
  return <><PageHeader eyebrow="Audit trail" title="Investigations" description="Every agent decision, tool call, result, and recommendation in one traceable history." action={<Link href="/investigate" className="button primary"><SearchIcon />New investigation</Link>} />{!investigations ? <DataError /> : investigations.length === 0 ? <EmptyState title="No investigations yet" description="Start an investigation to create the first evidence trail." /> : <section className="panel table-panel"><div className="table-toolbar"><p><strong>{investigations.length}</strong> recorded investigations</p></div><div className="table-wrap"><table><thead><tr><th>Request</th><th>Transaction</th><th>Amount</th><th>Status</th><th>Diagnosis</th><th>Created</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{investigations.map((item) => <tr key={item.id}><td><strong>{truncate(item.user_request, 58)}</strong><small className="mono">{item.id.slice(0, 8)}</small></td><td className="mono strong">{item.transactions?.transaction_reference ?? "—"}</td><td>{item.transactions ? formatCurrency(item.transactions.amount, item.transactions.currency) : "—"}</td><td><StatusBadge status={item.status} /></td><td>{truncate(item.diagnosis, 72)}</td><td>{formatDate(item.created_at, true)}</td><td><Link className="row-link" href={`/investigations/${item.id}`} aria-label="Open investigation"><ArrowIcon /></Link></td></tr>)}</tbody></table></div></section>}</>;
}

