import type { Metadata } from "next";
import Link from "next/link";
import { ActivityIcon, AlertIcon, ApprovalIcon, ArrowIcon, ClockIcon, RequestIcon, TransferIcon } from "@/components/icons";
import { NewPaymentRequest } from "@/components/new-payment-request";
import { StatusBadge } from "@/components/ui";
import { actionRequired, activity } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Payment Operations" };

const metrics = [
  { label: "Open requests", value: "12", note: "+3 since yesterday", icon: RequestIcon, tone: "green" },
  { label: "Awaiting approval", value: "5", note: "2 due today", icon: ApprovalIcon, tone: "violet" },
  { label: "Payments processing", value: "8", note: "€18,420 in flight", icon: TransferIcon, tone: "blue" },
  { label: "Exceptions", value: "3", note: "1 high priority", icon: AlertIcon, tone: "red" },
];

export default function DashboardPage() {
  return <>
    <header className="workspace-header"><div><p className="eyebrow">Payment Operations</p><h1>What needs attention today</h1><p>Monitor requests, approvals and payment activity across your workspace.</p></div><NewPaymentRequest /></header>
    <section className="ops-metric-grid">{metrics.map(({ icon: Icon, ...item }) => <article className="ops-metric" key={item.label}><span className={`ops-metric-icon ${item.tone}`}><Icon /></span><div><small>{item.label}</small><strong>{item.value}</strong><p>{item.note}</p></div></article>)}</section>
    <section className="overview-layout">
      <article className="panel action-required-panel"><div className="ops-section-heading"><div><p className="eyebrow">Priority queue</p><h2>Action required</h2></div><Link href="/exceptions">View queue<ArrowIcon /></Link></div><div className="responsive-table"><table><thead><tr><th>Item</th><th>Type</th><th>Amount</th><th>Status</th><th>Owner</th><th>Updated</th></tr></thead><tbody>{actionRequired.map((item) => <tr key={item.item}><td><strong>{item.item}</strong><small>{item.counterparty}</small></td><td>{item.type}</td><td className="amount-cell">{formatCurrency(item.amount, "EUR")}</td><td><StatusBadge status={item.status} /></td><td><span className="owner-chip">{item.owner.slice(0, 2).toUpperCase()}</span>{item.owner}</td><td>{item.updated}</td></tr>)}</tbody></table></div></article>
      <aside className="panel recent-activity-panel"><div className="ops-section-heading"><div><p className="eyebrow">Workspace</p><h2>Recent activity</h2></div><Link href="/activity"><ActivityIcon /></Link></div><div className="activity-feed compact">{activity.slice(0, 4).map((item) => <article key={`${item.object}-${item.timestamp}`}><span className={`activity-avatar ${item.tone}`}>{item.initials}</span><div><p><strong>{item.actor}</strong> {item.event} <b>{item.object}</b></p><small>{item.detail}</small></div><time>{item.timestamp}</time></article>)}</div><Link href="/activity" className="activity-footer-link">View complete audit trail<ArrowIcon /></Link></aside>
    </section>
    <section className="workspace-summary"><div><span><ClockIcon /></span><p><strong>Next scheduled payment run</strong><small>Today at 16:00 · 6 approved requests · €12,840 total</small></p></div><Link href="/transactions">Open transaction ledger<ArrowIcon /></Link></section>
  </>;
}
