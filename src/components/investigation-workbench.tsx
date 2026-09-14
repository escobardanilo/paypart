"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowIcon, CheckIcon, ClockIcon, SearchIcon, ShieldIcon, SparkIcon, WalletIcon } from "@/components/icons";
import { StatusBadge } from "@/components/ui";
import type { ActionRequest, Json } from "@/lib/database/types";
import { titleCase } from "@/lib/format";

interface FinalReport {
  summary: string;
  diagnosis: string;
  recommendedAction: string;
  confidence: "high" | "medium" | "low";
  actionTaken: string;
}

interface StreamEvent {
  type: "investigation_started" | "thinking" | "tool_call" | "tool_result" | "action_created" | "action_verified" | "completed" | "failed";
  investigation_id?: string;
  iteration?: number;
  toolName?: string;
  input?: Json;
  output?: Json;
  report?: FinalReport;
  actions?: ActionRequest[];
  error?: string;
}

const toolLabels: Record<string, string> = {
  get_transaction: "Transaction lookup",
  get_account: "Account balance check",
  get_party: "Party profile",
  get_invoice: "Invoice check",
  get_payment_attempts: "Payment attempts",
  check_duplicate_transactions: "Duplicate risk",
  get_provider_error: "Provider error",
  create_support_ticket: "Support ticket",
  create_approval_request: "Approval request",
  verify_action_request: "Action verification",
};

const samples = [
  { title: "Failed payment", reference: "PAY-1001", description: "Find the cause and safest next step.", request: "Investigate why PAY-1001 failed and tell me what should happen next." },
  { title: "Successful payment review", reference: "PAY-1002", description: "Confirm whether follow-up is required.", request: "Review PAY-1002 and confirm whether anything requires follow-up." },
  { title: "Evidence check", reference: "PAY-1001", description: "Inspect account, attempts, provider, and duplicates.", request: "Check the transaction, account balance, payment attempts, provider status, and duplicate risk for PAY-1001." },
];

function record(value: Json | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Json | undefined> : null;
}

function toolData(events: StreamEvent[], toolName: string) {
  const event = [...events].reverse().find((item) => item.type === "tool_result" && item.toolName === toolName);
  return record(record(event?.output)?.data);
}

function formatMoney(value: Json | undefined, currency: Json | undefined) {
  if (typeof value !== "number") return "—";
  try { return new Intl.NumberFormat("en-IE", { style: "currency", currency: String(currency ?? "EUR") }).format(value); }
  catch { return `${String(currency ?? "")} ${value}`.trim(); }
}

function outputSummary(event: StreamEvent) {
  if (event.type === "thinking") return "Choosing the next evidence source.";
  if (event.type === "action_created") return "Pending record created for human review.";
  if (event.type === "action_verified") return "Action record found and state verified.";
  if (event.type === "completed") return "Evidence combined into the final diagnosis.";
  const output = record(event.output);
  if (!output) return "Controlled tool result returned.";
  if (output.error) return String(output.error);
  const data = output.data;
  if (Array.isArray(data)) {
    if (event.toolName === "get_payment_attempts") return `${data.length} payment attempt${data.length === 1 ? "" : "s"} found.`;
    if (event.toolName === "check_duplicate_transactions") return data.length ? `${data.length} possible duplicate${data.length === 1 ? "" : "s"} found.` : "No duplicate transactions found.";
    return `${data.length} record${data.length === 1 ? "" : "s"} returned.`;
  }
  const dataRecord = record(data);
  if (dataRecord) {
    if (event.toolName === "get_transaction") return `${String(dataRecord.transaction_reference ?? "Transaction")} · ${formatMoney(dataRecord.amount, dataRecord.currency)} · ${titleCase(String(dataRecord.status ?? "recorded"))}`;
    if (event.toolName === "get_account") return `${formatMoney(dataRecord.balance, dataRecord.currency)} available · ${titleCase(String(dataRecord.status ?? "recorded"))}`;
    if (event.toolName === "get_party") return `${String(dataRecord.name ?? "Party")} · ${titleCase(String(dataRecord.type ?? "party"))}`;
    if (event.toolName === "get_invoice") return `${String(dataRecord.invoice_number ?? "Invoice")} · ${titleCase(String(dataRecord.status ?? "recorded"))}`;
    if (event.toolName === "get_provider_error") return `${String(dataRecord.code ?? "Provider code")} · ${String(dataRecord.title ?? "Provider error matched")}`;
  }
  return output.message ? String(output.message) : data ? "Evidence captured for the investigation." : "No matching record returned.";
}

export function InvestigationWorkbench({ transactionReferences }: { transactionReferences: string[] }) {
  const [request, setRequest] = useState(samples[0].request);
  const [transactionReference, setTransactionReference] = useState(samples[0].reference);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [phase, setPhase] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [report, setReport] = useState<FinalReport | null>(null);
  const [actions, setActions] = useState<ActionRequest[]>([]);
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transaction = useMemo(() => toolData(events, "get_transaction"), [events]);
  const account = useMemo(() => toolData(events, "get_account"), [events]);
  const party = useMemo(() => toolData(events, "get_party"), [events]);
  const invoice = useMemo(() => toolData(events, "get_invoice"), [events]);
  const trace = useMemo(() => events.filter((event) => event.type === "thinking" || event.type === "action_created" || event.type === "action_verified" || event.type === "completed" || (event.type === "tool_result" && !["create_support_ticket", "create_approval_request", "verify_action_request"].includes(event.toolName ?? ""))), [events]);
  const evidence = useMemo(() => events.filter((event) => event.type === "tool_result" && !record(event.output)?.error).map(outputSummary).slice(0, 6), [events]);
  const verified = events.some((event) => event.type === "action_verified");

  function selectSample(sample: typeof samples[number]) {
    setRequest(sample.request);
    setTransactionReference(sample.reference);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhase("running"); setEvents([]); setReport(null); setActions([]); setInvestigationId(null); setError(null);
    try {
      const response = await fetch("/api/investigations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request, transactionReference }) });
      if (!response.ok) { const payload = (await response.json()) as { error?: string }; throw new Error(payload.error ?? "The investigation request was rejected."); }
      if (!response.body) throw new Error("The server returned no progress stream.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { value, done } = await reader.read(); buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const progress = JSON.parse(line) as StreamEvent;
          setEvents((current) => [...current, progress]);
          if (progress.investigation_id) setInvestigationId(progress.investigation_id);
          if (progress.type === "completed" && progress.report) { setReport(progress.report); setActions(progress.actions ?? []); setPhase("completed"); }
          if (progress.type === "failed") { setError(progress.error ?? "The investigation failed."); setPhase("failed"); }
        }
        if (done) break;
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The investigation failed unexpectedly."); setPhase("failed"); }
  }

  return (
    <div className="investigation-workbench">
      <section className="guided-examples" id="guided-examples">
        <div className="guided-intro"><span>Try a guided example</span><p>Choose a case and run it immediately.</p></div>
        <div className="guided-cards">{samples.map((sample, index) => <button type="button" key={sample.title} className={`guided-card${request === sample.request ? " selected" : ""}`} onClick={() => selectSample(sample)} disabled={phase === "running"} aria-pressed={request === sample.request}><span className="guided-number">0{index + 1}</span><span><strong>{sample.title}</strong><small>{sample.reference}</small><em>{sample.description}</em></span><ArrowIcon /></button>)}</div>
      </section>

      <div className="investigation-layout">
        <div className="command-column">
          <section className="command-card" id="investigation-command">
            <div className="command-heading"><span className="command-icon"><SparkIcon /></span><div><span>AI financial operations workbench</span><h2>Investigation command</h2></div><div className="agent-ready"><i />Agent ready</div></div>
            <form onSubmit={handleSubmit}>
              <div className="command-composer">
                <label htmlFor="request">What should PayPart investigate?</label>
                <textarea id="request" value={request} onChange={(event) => setRequest(event.target.value)} minLength={10} maxLength={2000} rows={5} required disabled={phase === "running"} />
                <div className="composer-actions"><div className="reference-control"><label htmlFor="transactionReference">Transaction</label><input id="transactionReference" list="transaction-options" value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} placeholder="PAY-1001" disabled={phase === "running"} /><datalist id="transaction-options">{transactionReferences.map((reference) => <option key={reference} value={reference} />)}</datalist></div><div className="safe-scope"><ShieldIcon /><span>Read-only evidence<br /><small>No money movement</small></span></div><button className="button primary command-button" type="submit" disabled={phase === "running" || request.trim().length < 10}>{phase === "running" ? <><span className="spinner" />Investigating…</> : <><SearchIcon />Run investigation</>}</button></div>
              </div>
            </form>
          </section>

          <section className={`execution-section${phase === "idle" ? " idle" : ""}`} id="agent-execution" aria-live="polite">
            <div className="execution-heading"><div><span>Agent execution</span><h2>{phase === "idle" ? "Tools and evidence will appear here" : phase === "running" ? "PayPart is gathering evidence" : phase === "completed" ? "Tool execution complete" : "Execution stopped"}</h2></div><StatusBadge status={phase === "idle" ? "ready" : phase} /></div>
            {phase === "idle" ? <div className="execution-empty"><SparkIcon /><p>Run the command to watch PayPart select financial tools, inspect their results, and build an auditable diagnosis.</p></div> : <div className="execution-list">
              <article className="execution-step"><span className="execution-icon complete"><CheckIcon /></span><div className="execution-copy"><div><h3>Investigation record</h3><code>audit_trail</code></div><StatusBadge status="completed" /><p>{investigationId ? `Audit ${investigationId.slice(0, 8)} created` : "Creating audit record"}</p></div></article>
              {trace.map((item, index) => <article className={`execution-step ${item.type}`} key={`${item.type}-${item.toolName}-${index}`}><span className={`execution-icon ${item.type === "thinking" ? "thinking" : "complete"}`}>{item.type === "thinking" ? <SparkIcon /> : <CheckIcon />}</span><div className="execution-copy"><div><h3>{item.type === "thinking" ? "Agent decision" : item.type === "completed" ? "Diagnosis prepared" : toolLabels[item.toolName ?? ""] ?? titleCase(item.type)}</h3><code>{item.type === "thinking" ? `reasoning_step_${item.iteration ?? index + 1}` : item.toolName ?? item.type}</code></div><StatusBadge status={item.type === "thinking" ? "processing" : "completed"} /><p>{outputSummary(item)}</p>{(item.input !== undefined || item.output !== undefined) && <details><summary>Technical details</summary><pre>{JSON.stringify({ input: item.input, output: item.output }, null, 2)}</pre></details>}</div></article>)}
              {phase === "running" && <article className="execution-step current"><span className="execution-icon thinking"><ClockIcon /></span><div className="execution-copy"><div><h3>Evaluating evidence</h3><code>agent_loop</code></div><StatusBadge status="processing" /><p>Deciding whether another controlled tool is required.</p></div></article>}
            </div>}
            {error && <div className="inline-error" role="alert"><strong>Investigation stopped</strong><p>{error}</p></div>}
          </section>
        </div>

        <aside className="context-panel" id="investigation-context">
          <div className="context-heading"><div><span>Live context</span><h2>Payment evidence</h2></div><StatusBadge status={phase === "idle" ? "waiting" : phase} /></div>
          {!transaction ? <div className="context-empty"><span><WalletIcon /></span><h3>No evidence loaded yet</h3><p>The transaction, account, party, invoice, provider, and investigation status will assemble here while the agent works.</p><div><small>Prepared transaction</small><strong className="mono">{transactionReference || "Not selected"}</strong></div></div> : <div className="context-content">
            <div className="context-hero"><span>Transaction amount</span><strong>{formatMoney(transaction.amount, transaction.currency)}</strong><div><b className="mono">{String(transaction.transaction_reference ?? transactionReference)}</b><StatusBadge status={String(transaction.status ?? "recorded")} /></div></div>
            <dl className="context-list">
              <div><dt>Account balance</dt><dd>{formatMoney(account?.balance, account?.currency ?? transaction.currency)}</dd></div>
              <div><dt>Party / supplier</dt><dd>{String(party?.name ?? "Gathering evidence…")}</dd></div>
              <div><dt>Invoice</dt><dd className="mono">{String(invoice?.invoice_number ?? (transaction.invoice_id ? "Gathering evidence…" : "Not linked"))}</dd></div>
              <div><dt>Provider</dt><dd>{String(transaction.provider ?? "—")}</dd></div>
              <div><dt>Investigation</dt><dd><StatusBadge status={phase} /></dd></div>
            </dl>
            <div className="context-safety"><ShieldIcon /><p><strong>Controlled scope</strong><br />PayPart can investigate and create pending requests. It cannot retry or move money.</p></div>
          </div>}
        </aside>
      </div>

      {report && <section className="final-report" id="final-report">
        <div className="final-report-heading"><div><span>Final investigation report</span><h2>{report.summary}</h2></div><div><StatusBadge status="completed" /><span className={`confidence ${report.confidence}`}>{titleCase(report.confidence)} confidence</span></div></div>
        <div className="outcome-grid"><article className="diagnosis-panel"><span>Diagnosis</span><h3>{report.diagnosis}</h3><div><small>Incident</small><strong className="mono">{transactionReference || "Unlinked request"}</strong></div></article><article className="recommendation-panel"><span>Recommended action</span><h3>{report.recommendedAction}</h3><ShieldIcon /></article></div>
        <article className="evidence-panel"><div><span>Evidence summary</span><p>The financial facts used to reach this outcome.</p></div>{evidence.length ? <ul>{evidence.map((item, index) => <li key={`${item}-${index}`}><CheckIcon /><span>{item}</span></li>)}</ul> : <p>No additional evidence was returned.</p>}</article>
        <div className="controlled-grid"><article><span><ShieldIcon /></span><div><small>Controlled action</small><h3>{actions.length ? report.actionTaken : "No controlled action required"}</h3>{actions.map((action) => <p key={action.id}><StatusBadge status={action.status} /> {titleCase(action.action_type)} · <span className="mono">{action.id.slice(0, 8)}</span></p>)}</div></article><article><span><CheckIcon /></span><div><small>Verification result</small><h3>{actions.length ? (verified ? "Action record verified in pending state" : "Verification not recorded") : "Not applicable"}</h3><p>Evidence and tool results remain preserved in the audit trail.</p></div></article></div>
        {investigationId && <div className="final-report-footer"><Link className="button secondary" href={`/investigations/${investigationId}`}>Open full investigation<ArrowIcon /></Link></div>}
      </section>}
    </div>
  );
}
