import Link from "next/link";
import { ApprovalIcon, ArrowIcon, CheckIcon, ClipboardIcon, ShieldIcon } from "@/components/icons";
import { ControlledWorkflow } from "@/components/controlled-workflow";
import { WorkspaceCapabilities } from "@/components/workspace-capabilities";

export default function Home() {
  return <main className="marketing-page">
    <nav className="marketing-nav"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span><span>PayPart</span></Link><div className="marketing-links"><a href="#product">Product</a><a href="#how-it-works">How it works</a><a href="#operations">Operations</a></div><Link href="/dashboard" className="button primary">View Demo<ArrowIcon /></Link></nav>

    <section className="marketing-hero">
      <div className="hero-copy"><p className="marketing-eyebrow">PAYMENT OPERATIONS</p><h1>Run payment operations from <span>one workspace.</span></h1><p>Coordinate payment requests, approvals, transactions and exceptions without losing context between teams and systems.</p><div className="hero-cta"><Link href="/dashboard" className="button primary">View Demo<ArrowIcon /></Link><span><ShieldIcon />Built for finance and operations teams.</span></div></div>
      <div className="workspace-preview" aria-label="Preview of the PayPart operations workspace">
        <div className="preview-window"><div className="preview-top"><span className="preview-logo"><span className="brand-mark"><span /><span /><span /></span>PayPart</span><span className="preview-team">Finance Operations <b>FO</b></span></div><div className="preview-body"><aside><span className="active"><i /><b>Overview</b></span><span><i />Requests</span><span><i />Approvals</span><span><i />Transactions</span><span><i />Exceptions</span></aside><div className="preview-content"><header><span><small>PAYMENT OPERATIONS</small><strong>Good morning, Finance</strong></span><em>New request</em></header><div className="preview-metrics"><span><small>Open requests</small><b>12</b></span><span><small>Awaiting approval</small><b>5</b></span><span><small>Exceptions</small><b>3</b></span></div><div className="preview-table"><strong>Action required</strong>{["Cloud Infrastructure Ltd.", "Customer refund", "Northstar Software", "Acme Logistics"].map((item, index) => <span key={item}><i className={index === 3 ? "red" : ""} /><b>{item}</b><small>{["€3,240", "€428", "€1,890", "€760"][index]}</small><em>{["Approval", "Review", "Scheduled", "Exception"][index]}</em></span>)}</div></div></div></div>
        <div className="floating-approval"><span><ApprovalIcon /></span><div><small>APPROVAL REQUIRED</small><strong>€3,240</strong><p>Cloud Infrastructure Ltd.</p></div><CheckIcon /></div>
      </div>
    </section>

    <section className="problem-section" id="operations"><div className="section-kicker">THE OPERATING PROBLEM</div><div className="problem-heading"><h2>Payment operations shouldn&apos;t live across disconnected tools.</h2><p>Requests, approvals and follow-up actions lose context when they move between messages, spreadsheets and provider portals.</p></div><div className="problem-grid"><article><span>01</span><h3>Fragmented requests</h3><p>Payment context is spread across messages, invoices and internal tools.</p></article><article><span>02</span><h3>Slow approvals</h3><p>Teams lose time determining who needs to review or authorize a payment.</p></article><article><span>03</span><h3>Poor visibility</h3><p>Once a payment moves forward, its status and follow-up actions become difficult to track.</p></article></div></section>

    <ControlledWorkflow />

    <WorkspaceCapabilities />

    <section className="safety-band"><div><span><ShieldIcon /></span><div><p className="marketing-eyebrow">CONTROLLED BY DESIGN</p><h2>Human authorization stays in the loop.</h2></div></div><p>PayPart organizes the work and preserves the record. Critical approvals and financial actions remain controlled by software rules and people.</p></section>

    <section className="final-marketing-cta"><span><ClipboardIcon /></span><p className="marketing-eyebrow">PAYPART DEMO</p><h2>See PayPart in operation.</h2><p>Explore a realistic payment operations workspace with requests, approvals, transactions, exceptions and audit history.</p><Link href="/dashboard" className="button primary">View Demo<ArrowIcon /></Link></section>
    <footer className="marketing-footer"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span><span>PayPart</span><small className="creator-attribution">TM Danilo Escobar</small></Link><p>Payment operations, coordinated.</p><span>Portfolio demo · No real money movement</span></footer>
  </main>;
}
