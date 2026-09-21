"use client";

import { useState } from "react";
import { transactions } from "@/lib/demo-data";
import { ArrowIcon, CheckIcon, CloseIcon, DocumentIcon, FilterIcon, ShieldIcon, TransferIcon } from "@/components/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui";

export function TransactionLedger() {
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const selected = transactions.find((item) => item.reference === selectedReference);

  return (
    <>
      <section className="panel table-panel operations-table">
        <div className="table-toolbar"><p><strong>{transactions.length}</strong> transaction records</p><div><span className="read-only-tag"><ShieldIcon />Read only</span><button className="icon-button" type="button" aria-label="Filter transactions"><FilterIcon /></button></div></div>
        <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Counterparty</th><th>Amount</th><th>Type</th><th>Status</th><th>Provider</th><th>Created</th><th>Updated</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{transactions.map((item) => <tr key={item.reference} onClick={() => setSelectedReference(item.reference)}><td className="mono strong">{item.reference}</td><td><strong>{item.counterparty}</strong><small>{item.request}</small></td><td className="amount-cell">{formatCurrency(item.amount, "EUR")}</td><td>{item.type}</td><td><StatusBadge status={item.status} /></td><td><strong>{item.provider}</strong><small>Sandbox provider</small></td><td>{formatDate(item.created)}</td><td>{formatDate(item.updated, true)}</td><td><button className="row-link" type="button" aria-label={`Open ${item.reference}`}><ArrowIcon /></button></td></tr>)}</tbody></table></div>
      </section>
      {selected && <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReference(null); }}>
        <aside className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title">
          <header><div><span className="eyebrow">Transaction detail</span><h2 id="transaction-detail-title">{selected.reference}</h2><p>{selected.counterparty}</p></div><button className="icon-button" type="button" onClick={() => setSelectedReference(null)} aria-label="Close"><CloseIcon /></button></header>
          <div className="drawer-amount"><span>Amount</span><strong>{formatCurrency(selected.amount, "EUR")}</strong><StatusBadge status={selected.status} /></div>
          <section className="detail-section"><h3>Transaction details</h3><dl><div><dt>Type</dt><dd>{selected.type}</dd></div><div><dt>Provider</dt><dd className="provider-value">{selected.provider}<small>Sandbox provider</small></dd></div><div><dt>Created</dt><dd>{formatDate(selected.created, true)}</dd></div><div><dt>Updated</dt><dd>{formatDate(selected.updated, true)}</dd></div></dl></section>
          <section className="detail-section"><h3>Related controls</h3><div className="related-control"><DocumentIcon /><span><small>Payment request</small><strong>{selected.request}</strong></span></div><div className="related-control"><ShieldIcon /><span><small>Approval</small><strong>{selected.approval}</strong></span></div></section>
          <section className="detail-section"><h3>Payment timeline</h3><div className="payment-timeline"><div><span><CheckIcon /></span><p><strong>Request validated</strong><small>{formatDate(selected.created, true)}</small></p></div><div><span><TransferIcon /></span><p><strong>Submitted to provider</strong><small>{selected.provider}</small></p></div><div className={selected.status === "Failed" ? "failed" : "current"}><span>{selected.status === "Completed" ? <CheckIcon /> : <TransferIcon />}</span><p><strong>{selected.status}</strong><small>{formatDate(selected.updated, true)}</small></p></div></div></section>
          <section className="drawer-note"><h3>Operational note</h3><p>{selected.note}</p></section>
        </aside>
      </div>}
    </>
  );
}
