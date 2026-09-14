import Link from "next/link";
import { Navigation } from "@/components/nav";
import { ShieldIcon } from "@/components/icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="application-header">
        <div className="header-inner">
          <Link href="/dashboard" className="brand" aria-label="PayPart home"><span className="brand-mark"><span /><span /><span /></span><span>PayPart</span></Link>
          <Navigation />
          <div className="header-controls">
            <div className="environment-pill"><span />Core online</div>
            <div className="operator"><span className="avatar" aria-hidden="true">OP</span><span className="operator-copy"><strong>Operations Team</strong><small><ShieldIcon />Human-controlled</small></span></div>
          </div>
        </div>
      </header>
      <main className="app-main"><div className="page-content">{children}</div></main>
    </div>
  );
}
