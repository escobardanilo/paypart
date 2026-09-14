import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, CheckIcon, ClipboardIcon, SearchIcon, ShieldIcon } from "@/components/icons";
import { DataError, StatusBadge } from "@/components/ui";
import { getInvestigationDetail } from "@/lib/database/repositories";
import { formatCurrency, formatDate, titleCase } from "@/lib/format";

export const metadata: Metadata = { title: "Investigation detail" };
export const dynamic = "force-dynamic";

const toolLabels: Record<string, string> = {
  get_transaction: "Transaction lookup", get_account: "Account balance check", get_party: "Party profile", get_invoice: "Invoice check", get_payment_attempts: "Payment attempts", check_duplicate_transactions: "Duplicate risk", get_provider_error: "Provider error", create_support_ticket: "Support ticket", create_approval_request: "Approval request", verify_action_request: "Action verification",
};

function eventPresentation(event: { event_type: string; tool_name: string | null }) {
  const title = event.tool_name ? (toolLabels[event.tool_name] ?? titleCase(event.tool_name)) : titleCase(event.event_type);
  if (event.event_type === "tool_call") return { category: "Tool call", title, description: "Validated request sent to the controlled data source." };
  if (event.event_type === "tool_result") return { category: "Evidence", title, description: "Controlled result returned and preserved in the audit trail." };
  if (event.event_type === "action_created") return { category: "Controlled action", title, description: "A pending record was created for human handling." };
  if (event.event_type === "action_verified") return { category: "Verification", title, description: "The action record and its stored state were verified." };
  if (event.event_type === "diagnosis") return { category: "Diagnosis", title: "Evidence combined", description: "The agent formed an evidence-based diagnosis." };
  if (event.event_type.includes("failed") || event.event_type.includes("rejected")) return { category: "Agent control", title, description: "A controlled error was recorded for safe recovery." };
  return { category: "Agent decision", title, description: titleCase(event.event_type) };
}

export default async function InvestigationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let detail: Awaited<ReturnType<typeof getInvestigationDetail>> | null | undefined;
  try { detail = await getInvestigationDetail(id); } catch (error) { console.error("Investigation detail failed", error); detail = undefined; }
  if (detail === null) notFound();
  if (!detail) return <DataError />;
  const { investigation, events, actions } = detail;
  const transaction = investigation.transactions;

  return <>
    <Link href="/investigations" className="back-link"><ArrowIcon />Investigations</Link>
    <header className="detail-hero"><div><span>Investigation {investigation.id.slice(0, 8)}</span><h1>{transaction?.transaction_reference ?? "Unlinked investigation"}</h1><p>{investigation.user_request}</p></div><StatusBadge status={investigation.status} /></header>

    <section className="incident-zone">
      <div className="zone-heading"><span><SearchIcon /></span><div><small>Zone 1</small><h2>Incident summary</h2></div></div>
      {transaction ? <div className="incident-facts"><div><span>Amount</span><strong>{formatCurrency(transaction.amount, transaction.currency)}</strong></div><div><span>Payment status</span><StatusBadge status={transaction.status} /></div><div><span>Provider</span><strong>{transaction.provider}</strong></div><div><span>Error code</span><strong className="mono">{transaction.provider_error_code ?? "None"}</strong></div><div><span>Recorded</span><strong>{formatDate(transaction.created_at, true)}</strong></div></div> : <p className="muted">No transaction was associated with this investigation.</p>}
    </section>

    <div className="detail-zone-grid">
      <section className="evidence-zone">
        <div className="zone-title"><div><small>Zone 2</small><h2>Agent execution &amp; evidence</h2><p>The complete sequence of decisions, tool calls, and results.</p></div><span>{events.length} events</span></div>
        <div className="evidence-stream">{events.map((event, index) => { const presentation = eventPresentation(event); return <article key={event.id}><span className={`stream-marker${event.event_type.includes("failed") ? " failed" : ""}`}>{event.event_type.includes("verified") || event.event_type.includes("completed") ? <CheckIcon /> : index + 1}</span><div className="stream-card"><header><div><small>{presentation.category}</small><h3>{presentation.title}</h3>{event.tool_name && <code>{event.tool_name}</code>}</div><time>{formatDate(event.created_at, true)}</time></header><p>{presentation.description}</p>{(event.input !== null || event.output !== null) && <details><summary>Technical details</summary><pre>{JSON.stringify({ input: event.input, output: event.output }, null, 2)}</pre></details>}</div></article>; })}</div>
      </section>

      <aside className="outcome-zone">
        <div className="zone-title"><div><small>Zone 3</small><h2>Final outcome</h2><p>Diagnosis and controlled follow-up.</p></div><ShieldIcon /></div>
        <article className="outcome-diagnosis"><span>Diagnosis</span><h3>{investigation.diagnosis ?? "Diagnosis unavailable"}</h3></article>
        <article className="outcome-recommendation"><span>Recommended action</span><p>{investigation.recommended_action ?? "No recommendation was recorded."}</p></article>
        <div className="outcome-actions"><div><ClipboardIcon /><h3>Action records</h3></div>{actions.length === 0 ? <div className="no-actions"><ShieldIcon /><strong>No action created</strong><p>This investigation ended with guidance only.</p></div> : actions.map((action) => <article key={action.id}><header><span>{titleCase(action.action_type)}</span><StatusBadge status={action.status} /></header><h3>{action.title}</h3><p>{action.description}</p><small className="mono">{action.id}</small></article>)}</div>
      </aside>
    </div>
  </>;
}
