"use client";

import { useState } from "react";
import { exceptions } from "@/lib/demo-data";
import { AlertIcon, CheckIcon, ClipboardIcon, UserIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/ui";

export function ExceptionsWorkspace() {
  const [selectedId, setSelectedId] = useState(exceptions[0].id);
  const [states, setStates] = useState<Record<string, string>>({});
  const selected = exceptions.find((item) => item.id === selectedId) ?? exceptions[0];
  const currentStatus = states[selected.id] ?? selected.status;

  return <section className="exceptions-layout">
    <div className="exception-queue panel">
      <div className="queue-heading"><div><span className="eyebrow">Operational queue</span><h2>Needs attention</h2></div><span className="queue-count danger">{exceptions.length}</span></div>
      {exceptions.map((item) => <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`exception-row${selected.id === item.id ? " selected" : ""}`}><span className={`priority-bar ${item.priority.toLowerCase()}`} /><span><span className="exception-meta"><b className="mono">{item.id}</b><small>{item.updated}</small></span><strong>{item.title}</strong><small>{item.counterparty} · {formatCurrency(item.amount, "EUR")}</small><span className="exception-footer"><StatusBadge status={states[item.id] ?? item.status} /><em>{item.owner}</em></span></span></button>)}
    </div>
    <article className="exception-detail panel">
      <header><div><span className="eyebrow">{selected.type}</span><h2>{selected.title}</h2><p><span className="mono">{selected.id}</span> · {selected.object}</p></div><StatusBadge status={currentStatus} /></header>
      <div className="exception-facts"><div><span>Amount</span><strong>{formatCurrency(selected.amount, "EUR")}</strong></div><div><span>Counterparty</span><strong>{selected.counterparty}</strong></div><div><span>Owner</span><strong>{selected.owner}</strong></div><div><span>Provider</span><strong>{selected.provider}</strong></div></div>
      <section className="exception-reason"><span><AlertIcon /></span><div><small>Reason</small><h3>{selected.reason}</h3></div></section>
      <section className="next-step"><small>Recommended next step</small><p>{selected.nextStep}</p></section>
      <section className="exception-audit"><h3>Operational context</h3><div><span>Created automatically from payment activity</span><time>{selected.updated}</time></div><div><span>Routed to {selected.owner}</span><time>Current owner</time></div></section>
      <footer><button type="button" className="button secondary" onClick={() => setStates((current) => ({ ...current, [selected.id]: "In review" }))}><ClipboardIcon />Review</button><button type="button" className="button secondary" onClick={() => setStates((current) => ({ ...current, [selected.id]: "Assigned" }))}><UserIcon />Assign</button><button type="button" className="button primary" onClick={() => setStates((current) => ({ ...current, [selected.id]: "Resolved" }))}><CheckIcon />Resolve</button></footer>
    </article>
  </section>;
}
