import type { Metadata } from "next";
import { ClipboardIcon, ShieldIcon } from "@/components/icons";
import { DataError, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { listActionRequests } from "@/lib/database/repositories";
import { formatDate, titleCase } from "@/lib/format";

export const metadata: Metadata = { title: "Action requests" };
export const dynamic = "force-dynamic";

export default async function ActionsPage() {
  let actions: Awaited<ReturnType<typeof listActionRequests>> | null = null;
  try { actions = await listActionRequests(); } catch (error) { console.error("Actions data failed", error); }
  return <><PageHeader eyebrow="Human control" title="Action requests" description="Support tickets and approval requests created by investigations. Nothing here moves money." /><div className="control-banner"><ShieldIcon /><div><strong>Human review is mandatory</strong><p>PayPart can create a pending request and verify its record. It cannot approve the request or perform the underlying financial action.</p></div></div>{!actions ? <DataError /> : actions.length === 0 ? <EmptyState title="No action requests" description="Evidence-backed requests created by the agent will appear here." /> : <section className="action-card-grid">{actions.map((action) => <article className="panel action-card" key={action.id}><div className="action-card-icon"><ClipboardIcon /></div><div className="action-card-content"><div className="action-card-meta"><span>{titleCase(action.action_type)}</span><StatusBadge status={action.status} /></div><h2>{action.title}</h2><p>{action.description}</p><dl><div><dt>Transaction</dt><dd className="mono">{action.investigations?.transactions?.transaction_reference ?? "Not linked"}</dd></div><div><dt>Created</dt><dd>{formatDate(action.created_at, true)}</dd></div><div><dt>Request ID</dt><dd className="mono">{action.id.slice(0, 8)}…</dd></div></dl></div></article>)}</section>}</>;
}

