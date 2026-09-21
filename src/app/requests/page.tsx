import type { Metadata } from "next";
import { FilterIcon } from "@/components/icons";
import { NewPaymentRequest } from "@/components/new-payment-request";
import { PageHeader, StatusBadge } from "@/components/ui";
import { paymentRequests } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Payment Requests" };

export default function RequestsPage() {
  return <><PageHeader eyebrow="Payment operations" title="Requests" description="Create, review and route payment requests with their operational context attached." action={<NewPaymentRequest />} /><section className="request-stats"><div><span>Open</span><strong>12</strong></div><div><span>Awaiting approval</span><strong>5</strong></div><div><span>Scheduled this week</span><strong>8</strong></div></section><section className="panel table-panel operations-table"><div className="table-toolbar"><p><strong>{paymentRequests.length}</strong> recent payment requests</p><button className="filter-button" type="button"><FilterIcon />Filter</button></div><div className="table-wrap"><table><thead><tr><th>Request</th><th>Requester</th><th>Counterparty</th><th>Amount</th><th>Created</th><th>Status</th><th>Owner</th><th>Approval</th></tr></thead><tbody>{paymentRequests.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small><span className="mono">{item.id}</span> · {item.type}</small></td><td>{item.requester}</td><td><strong>{item.counterparty}</strong><small>{item.reference}</small></td><td className="amount-cell">{formatCurrency(item.amount, item.currency)}</td><td>{formatDate(item.created)}</td><td><StatusBadge status={item.status} /></td><td>{item.owner}</td><td><span className="approval-state">{item.approval}</span></td></tr>)}</tbody></table></div></section></>;
}
