"use client";

import { useState } from "react";
import { approvals } from "@/lib/demo-data";
import { ApprovalIcon, ArrowIcon, CheckIcon, ClipboardIcon, ShieldIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/ui";

type Decision = "Approved" | "Rejected" | "Information requested";

export function ApprovalWorkspace() {
  const [selectedId, setSelectedId] = useState(approvals[0].requestId);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const selected = approvals.find((item) => item.requestId === selectedId) ?? approvals[0];
  const decision = decisions[selected.requestId];

  function decide(value: Decision) {
    setDecisions((current) => ({ ...current, [selected.requestId]: value }));
  }

  return (
    <section className="approval-workspace">
      <div className="approval-queue panel">
        <div className="queue-heading"><div><span className="eyebrow">Review queue</span><h2>Awaiting authorization</h2></div><span className="queue-count">{approvals.length}</span></div>
        {approvals.map((item) => <button type="button" key={item.requestId} className={`approval-list-item${selectedId === item.requestId ? " selected" : ""}`} onClick={() => setSelectedId(item.requestId)}>
          <span className="approval-list-top"><span className="mono">{item.requestId}</span><StatusBadge status={decisions[item.requestId] ?? "Pending"} /></span>
          <strong>{item.counterparty}</strong><small>{item.title}</small>
          <span className="approval-list-bottom"><b>{formatCurrency(item.amount, "EUR")}</b><span>{item.requiredApproval}<ArrowIcon /></span></span>
        </button>)}
      </div>

      <article className="approval-detail panel">
        <header className="approval-detail-heading"><div><span className="eyebrow">Authorization request</span><h2>{selected.requestId}</h2><p>{selected.counterparty}</p></div><span className="approval-shield"><ShieldIcon /></span></header>
        <div className="approval-summary"><div><span>Amount</span><strong>{formatCurrency(selected.amount, "EUR")}</strong></div><div><span>Purpose</span><strong>{selected.title}</strong></div><div><span>Risk</span><strong>{selected.risk}</strong></div></div>
        <div className="approval-context"><h3>Approval context</h3><p>{selected.note}</p><dl><div><dt>Requested by</dt><dd>{selected.requestedBy}</dd></div><div><dt>Required approval</dt><dd>{selected.requiredApproval}</dd></div><div><dt>Submitted</dt><dd>{selected.submitted}</dd></div></dl></div>
        <div className="approval-history"><h3>Approval history</h3>{selected.history.map((item, index) => <div key={item}><span className={index === selected.history.length - 1 ? "current" : "complete"}>{index < selected.history.length - 1 ? <CheckIcon /> : index + 1}</span><p>{item}</p></div>)}</div>
        <footer className="approval-actions">
          {decision ? <div className="decision-confirmation"><CheckIcon /><span><strong>{decision}</strong><small>Demo decision recorded in this session.</small></span></div> : <><button type="button" className="button secondary" onClick={() => decide("Information requested")}><ClipboardIcon />Request information</button><button type="button" className="button reject" onClick={() => decide("Rejected")}>Reject</button><button type="button" className="button primary" onClick={() => decide("Approved")}><ApprovalIcon />Approve</button></>}
        </footer>
      </article>
    </section>
  );
}
