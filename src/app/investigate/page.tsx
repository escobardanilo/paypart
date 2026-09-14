import type { Metadata } from "next";
import { BoltIcon, CheckIcon, SearchIcon, ShieldIcon } from "@/components/icons";
import { InvestigationWorkbench } from "@/components/investigation-workbench";
import { Onboarding } from "@/components/onboarding";
import { listTransactions } from "@/lib/database/repositories";

export const metadata: Metadata = { title: "Investigate" };
export const dynamic = "force-dynamic";

const workflow = [
  { number: "01", icon: SearchIcon, title: "Ask", text: "Describe a payment issue." },
  { number: "02", icon: BoltIcon, title: "Investigate", text: "The agent selects and calls the appropriate financial tools." },
  { number: "03", icon: CheckIcon, title: "Diagnose", text: "PayPart combines transaction, account, invoice, party, and provider evidence." },
  { number: "04", icon: ShieldIcon, title: "Act safely", text: "It recommends or creates controlled follow-up actions. It never moves money." },
];

export default async function InvestigatePage() {
  let references: string[] = [];
  try { references = (await listTransactions(50)).map((transaction) => transaction.transaction_reference); } catch (error) { console.error("Transaction options failed", error); }

  return (
    <>
      <header className="investigate-hero"><div><span>AI payment operations</span><h1>Investigate a payment issue</h1><p>Describe the issue or choose a sample case. PayPart gathers financial evidence, diagnoses the cause, and recommends a controlled next action.</p></div><div className="hero-safety"><ShieldIcon /><span><strong>Investigation only</strong><small>No payment execution</small></span></div></header>
      <InvestigationWorkbench transactionReferences={references} />
      <section className="how-it-works" aria-labelledby="how-paypart-works">
        <div className="section-intro"><p className="eyebrow">Transparent by design</p><h2 id="how-paypart-works">How PayPart works</h2><p>A visible path from question to a human-controlled decision.</p></div>
        <div className="workflow-grid">{workflow.map((item) => { const StepIcon = item.icon; return <article key={item.title}><div><span>{item.number}</span><StepIcon /></div><h3>{item.title}</h3><p>{item.text}</p></article>; })}</div>
      </section>
      <Onboarding />
    </>
  );
}
