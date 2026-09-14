import type { Metadata } from "next";
import Link from "next/link";
import { InvestigationActivityChart, PaymentStatusChart } from "@/components/dashboard-charts";
import { AlertIcon, ArrowIcon, CheckIcon, ClipboardIcon, SearchIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { DataError, EmptyState, SectionHeading, StatusBadge } from "@/components/ui";
import { getDashboardData } from "@/lib/database/repositories";
import { formatDate, truncate } from "@/lib/format";

export const metadata: Metadata = { title: "Operations overview" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  try { data = await getDashboardData(); } catch (error) { console.error("Dashboard data failed", error); }
  const resolutionRate = data?.totalInvestigations ? Math.round((data.completedInvestigations / data.totalInvestigations) * 100) : 0;

  return (
    <>
      <header className="overview-hero"><div><span>Payment operations</span><h1>Overview</h1><p>Monitor investigations, payment health, and every controlled follow-up from one operational view.</p></div><div className="overview-actions"><div><i />System connected</div><Link href="/investigate" className="button primary"><SearchIcon />New investigation</Link></div></header>
      {!data ? <DataError /> : <section className="dashboard-board">
        <article className="metric-tile investigations"><div><span className="metric-icon green"><SparkIcon /></span><small>Payment investigations</small></div><strong>{data.totalInvestigations}</strong><p>{data.openInvestigations} active now</p></article>
        <article className="metric-tile failures"><div><span className="metric-icon red"><AlertIcon /></span><small>Failed payments</small></div><strong>{data.failedTransactions}</strong><p>Need operational review</p></article>
        <article className="metric-tile actions"><div><span className="metric-icon amber"><ClipboardIcon /></span><small>Pending actions</small></div><strong>{data.pendingActions}</strong><p>Awaiting human handling</p></article>
        <article className="metric-tile resolution"><div><span className="metric-icon blue"><CheckIcon /></span><small>Resolution rate</small></div><strong>{resolutionRate}%</strong><p>{data.completedInvestigations} cases completed</p><span className="resolution-track"><i style={{ width: `${resolutionRate}%` }} /></span></article>

        <article className="board-card activity-module">
          <div className="module-heading"><div><h2>Investigation activity</h2><p>Agent-led reviews created over the last seven days</p></div><span>Last 7 days</span></div>
          <InvestigationActivityChart data={data.activity} />
        </article>

        <article className="board-card health-module">
          <div className="module-heading"><div><h2>Payment health</h2><p>Current recorded status distribution</p></div></div>
          <PaymentStatusChart statuses={data.paymentStatuses} />
          <div className="health-note"><ShieldIcon /><span><strong>Read-only monitoring</strong><small>No balance or payment mutation</small></span></div>
        </article>

        <article className="board-card investigations-module">
          <SectionHeading title="Recent investigations" detail="Latest evidence-led reviews" href="/investigations" />
          {data.investigations.length === 0 ? <EmptyState title="No investigations yet" description="Start with a transaction reference to create the first audit trail." /> : <div className="investigation-log">{data.investigations.map((item) => <Link href={`/investigations/${item.id}`} key={item.id} className="log-row"><span className={`log-indicator ${item.status}`} /><span className="log-main"><strong>{truncate(item.user_request, 58)}</strong><small>{truncate(item.diagnosis, 70)}</small></span><span className="log-reference mono">{item.transactions?.transaction_reference ?? "—"}</span><StatusBadge status={item.status} /><time>{formatDate(item.created_at)}</time><ArrowIcon /></Link>)}</div>}
        </article>

        <aside className="board-card attention-module">
          <SectionHeading title="Attention required" detail="Pending operational action requests" href="/actions" />
          <div className="attention-list">{data.actions.length === 0 ? <EmptyState title="Queue is clear" description="Evidence-backed requests will appear here." /> : data.actions.map((action) => <article key={action.id}><div><span className={`action-type ${action.action_type === "approval_request" ? "approval" : "ticket"}`}>{action.action_type === "approval_request" ? "Approval" : "Support"}</span><StatusBadge status={action.status} /></div><h3>{action.title}</h3><p>{truncate(action.description, 110)}</p><footer><span className="mono">{action.investigations?.transactions?.transaction_reference ?? "No transaction"}</span><time>{formatDate(action.created_at)}</time></footer></article>)}</div>
        </aside>
      </section>}
    </>
  );
}
