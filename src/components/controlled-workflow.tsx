"use client";

import { useState } from "react";
import {
  ActivityIcon,
  ApprovalIcon,
  CheckIcon,
  ClipboardIcon,
  RequestIcon,
  TransferIcon,
} from "@/components/icons";

const workflowSteps = [
  {
    id: "request",
    title: "Request",
    short: "Capture the context",
    description: "A payment request is created with amount, counterparty and supporting context.",
    detail: "Amount, counterparty and evidence enter the workflow together, giving every downstream decision a complete operational record.",
    Icon: RequestIcon,
  },
  {
    id: "review",
    title: "Review",
    short: "Verify completeness",
    description: "Operations verifies the request and checks that the required information is complete.",
    detail: "Operations confirms the purpose, supporting information and ownership before the request can move forward.",
    Icon: ClipboardIcon,
  },
  {
    id: "approval",
    title: "Approval",
    short: "Route the decision",
    description: "The request is routed to the correct authority based on amount and operational rules.",
    detail: "Approval policy keeps authorization with the right person while preserving the decision and its context.",
    Icon: ApprovalIcon,
  },
  {
    id: "payment",
    title: "Payment",
    short: "Create the record",
    description: "An approved request becomes an operational payment record.",
    detail: "The approved request becomes a traceable payment record without losing its related request or authorization history.",
    Icon: TransferIcon,
  },
  {
    id: "monitoring",
    title: "Monitoring",
    short: "Track every update",
    description: "The workspace tracks status, ownership and provider updates.",
    detail: "Teams can follow the current state, owner and sandbox provider context from one shared operational view.",
    Icon: ActivityIcon,
  },
  {
    id: "resolution",
    title: "Resolution",
    short: "Close or escalate",
    description: "Completed payments are closed; failures or mismatches become exceptions.",
    detail: "Successful payments reach a clear conclusion, while anything that needs attention enters a controlled exception queue.",
    Icon: CheckIcon,
  },
] as const;

export function ControlledWorkflow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = workflowSteps[activeIndex];
  const ActiveIcon = activeStep.Icon;

  return (
    <section className="flow-section" id="how-it-works">
      <div className="flow-heading">
        <div>
          <p className="marketing-eyebrow">A CONTROLLED WORKFLOW</p>
          <h2>One operational layer for every payment.</h2>
        </div>
        <p>Keep context, ownership and decisions connected throughout the payment lifecycle.</p>
      </div>

      <div className="flow-experience">
        <div className="flow-step-list" role="tablist" aria-label="Payment workflow stages">
          {workflowSteps.map(({ id, title, short, Icon }, index) => (
            <button
              className={`flow-step${index === activeIndex ? " is-active" : ""}${index < activeIndex ? " is-complete" : ""}`}
              id={`workflow-tab-${id}`}
              key={id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls={`workflow-panel-${id}`}
              onClick={() => setActiveIndex(index)}
            >
              <span className="flow-node"><Icon /></span>
              <span className="flow-step-copy">
                <small>{String(index + 1).padStart(2, "0")}</small>
                <strong>{title}</strong>
                <em>{short}</em>
              </span>
            </button>
          ))}
        </div>

        <div
          className="flow-detail"
          id={`workflow-panel-${activeStep.id}`}
          key={activeStep.id}
          role="tabpanel"
          aria-labelledby={`workflow-tab-${activeStep.id}`}
        >
          <div className="flow-detail-symbol"><ActiveIcon /></div>
          <div className="flow-detail-copy">
            <span>Stage {String(activeIndex + 1).padStart(2, "0")} · {activeStep.title}</span>
            <h3>{activeStep.description}</h3>
            <p>{activeStep.detail}</p>
          </div>
          <div className="flow-position">
            <span>Lifecycle position</span>
            <strong>{activeIndex + 1} of {workflowSteps.length}</strong>
            <div aria-hidden="true"><span style={{ width: `${((activeIndex + 1) / workflowSteps.length) * 100}%` }} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
