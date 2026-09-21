"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navigation } from "@/components/nav";
import { ShieldIcon } from "@/components/icons";
import { PaymentRequestProvider } from "@/components/new-payment-request";
import { PinyAgent } from "@/components/piny-agent";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return children;

  return (
    <PaymentRequestProvider>
      <div className="app-shell">
        <header className="application-header">
          <div className="header-inner">
            <Link href="/dashboard" className="brand" aria-label="PayPart home"><span className="brand-mark"><span /><span /><span /></span><span>PayPart</span></Link>
            <Navigation />
            <div className="header-controls">
              <div className="environment-pill"><span />Demo workspace</div>
              <div className="operator"><span className="avatar" aria-hidden="true">FO</span><span className="operator-copy"><strong>Finance Operations</strong><small><ShieldIcon />Controlled access</small></span></div>
            </div>
          </div>
        </header>
        <main className="app-main"><div className="page-content">{children}</div></main>
        <PinyAgent />
      </div>
    </PaymentRequestProvider>
  );
}
