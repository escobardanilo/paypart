"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ActivityIcon,
  AlertIcon,
  ApprovalIcon,
  ArrowIcon,
  RequestIcon,
  TransferIcon,
} from "@/components/icons";

const capabilities = [
  {
    id: "requests",
    title: "Payment Requests",
    summary: "Capture amount, counterparty and purpose before work begins.",
    headline: "Start with the full operational context.",
    description: "Create payment requests with amount, counterparty, purpose, due date and supporting information before anything moves forward.",
    example: [["Request", "REQ-1048"], ["Counterparty", "Cloud Infrastructure Ltd."], ["Amount", "€3,240"], ["Status", "Awaiting approval"]],
    cta: "View requests",
    href: "/requests",
    Icon: RequestIcon,
  },
  {
    id: "approvals",
    title: "Approvals",
    summary: "Route authorization according to ownership and rules.",
    headline: "Route decisions to the right authority.",
    description: "Requests are reviewed and authorized according to amount, ownership and operational rules.",
    example: [["Request", "REQ-1048"], ["Amount", "€3,240"], ["Control", "Finance approval required"], ["Status", "Awaiting Finance Lead"]],
    cta: "View approvals",
    href: "/approvals",
    Icon: ApprovalIcon,
  },
  {
    id: "transactions",
    title: "Transactions",
    summary: "Follow status and provider context in one ledger.",
    headline: "Track every payment after approval.",
    description: "Follow payment status, provider context and related requests from one operational ledger.",
    example: [["Transaction", "TX-8921"], ["Counterparty", "Brightline Media"], ["Amount", "€2,450"], ["Status", "Completed · Stripe"]],
    cta: "View transactions",
    href: "/transactions",
    Icon: TransferIcon,
  },
  {
    id: "exceptions",
    title: "Exceptions",
    summary: "Prioritize failures, mismatches and expired decisions.",
    headline: "Surface what actually needs attention.",
    description: "Failed payments, mismatches, expired approvals and duplicate requests are routed into a dedicated operational queue.",
    example: [["Exception", "EXC-203"], ["Issue", "Supplier payment failed"], ["Amount", "€760"], ["Owner", "Payments"]],
    cta: "View exceptions",
    href: "/exceptions",
    Icon: AlertIcon,
  },
  {
    id: "activity",
    title: "Activity",
    summary: "Preserve decisions, updates and actions in one history.",
    headline: "Keep every operational decision traceable.",
    description: "Approvals, status changes, payment events and exception handling remain visible in one auditable history.",
    example: [["Event", "Maria Costa approved REQ-1048"], ["Time", "09:42"]],
    cta: "View activity",
    href: "/activity",
    Icon: ActivityIcon,
  },
] as const;

export function WorkspaceCapabilities() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCapability = capabilities[activeIndex];
  const ActiveIcon = activeCapability.Icon;

  return (
    <section className="capabilities-section" id="product">
      <div className="capabilities-intro">
        <p className="marketing-eyebrow">THE WORKSPACE</p>
        <h2>Built around operational work, not abstract analytics.</h2>
        <p>Every view is organized around ownership, status, evidence and the next controlled action.</p>
      </div>

      <div className="capabilities-experience">
        <div className="capability-list" role="tablist" aria-label="Workspace capabilities">
          {capabilities.map(({ id, title, summary, Icon }, index) => (
            <button
              className={`capability-card${index === activeIndex ? " is-active" : ""}`}
              id={`capability-tab-${id}`}
              key={id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls={`capability-panel-${id}`}
              onClick={() => setActiveIndex(index)}
            >
              <span className="capability-card-icon"><Icon /></span>
              <span className="capability-card-copy"><strong>{title}</strong><small>{summary}</small></span>
              <span className="capability-card-number">{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>

        <article
          className="capability-detail"
          id={`capability-panel-${activeCapability.id}`}
          key={activeCapability.id}
          role="tabpanel"
          aria-labelledby={`capability-tab-${activeCapability.id}`}
        >
          <header><span><ActiveIcon /></span><p>{activeCapability.title}</p></header>
          <h3>{activeCapability.headline}</h3>
          <p>{activeCapability.description}</p>
          <div className="capability-example">
            <span>Workspace example</span>
            <dl>
              {activeCapability.example.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          </div>
          <Link href={activeCapability.href}>{activeCapability.cta}<ArrowIcon /></Link>
        </article>
      </div>
    </section>
  );
}
