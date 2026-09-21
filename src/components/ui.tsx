import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { titleCase } from "@/lib/format";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>{action && <div className="page-action">{action}</div>}</header>;
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = ["completed", "successful", "success", "active", "verified", "approved", "resolved", "scheduled"].includes(normalized) ? "success" : ["failed", "error", "blocked", "rejected", "exception"].includes(normalized) ? "danger" : ["running", "pending", "open", "processing", "awaiting approval", "review required", "under review", "in review", "information requested"].includes(normalized) ? "warning" : "neutral";
  return <span className={`status-badge ${tone}`}><span />{titleCase(status)}</span>;
}

export function SectionHeading({ title, detail, href, linkLabel = "View all" }: { title: string; detail?: string; href?: string; linkLabel?: string }) {
  return <div className="section-heading"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{href && <Link href={href} className="text-link">{linkLabel}<ArrowIcon /></Link>}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span className="empty-symbol">·</span><h3>{title}</h3><p>{description}</p></div>;
}

export function DataError({ message = "We could not load operational data. Check the server connection and try again." }: { message?: string }) {
  return <div className="data-error" role="alert"><strong>Data temporarily unavailable</strong><p>{message}</p></div>;
}
