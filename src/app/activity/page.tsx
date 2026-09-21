import type { Metadata } from "next";
import { ActivityIcon, FilterIcon, ShieldIcon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { activity } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return <><PageHeader eyebrow="Audit history" title="Activity" description="A workspace-wide record of decisions, status changes and operational actions." action={<button className="filter-button" type="button"><FilterIcon />Filter activity</button>} /><div className="audit-banner"><ShieldIcon /><div><strong>Complete operational traceability</strong><p>Events are presented as an auditable history for the demo workspace, with clear actors, objects and timestamps.</p></div></div><section className="panel activity-log"><header><div><span><ActivityIcon /></span><div><h2>Today</h2><p>Finance Operations workspace</p></div></div><span>{activity.length} events</span></header><div className="activity-feed">{activity.map((item) => <article key={`${item.object}-${item.timestamp}`}><span className={`activity-avatar ${item.tone}`}>{item.initials}</span><div><p><strong>{item.actor}</strong> {item.event} <b className="mono">{item.object}</b></p><small>{item.detail}</small></div><time>{item.timestamp}</time></article>)}</div></section></>;
}
