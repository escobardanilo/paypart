"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityIcon, AlertIcon, ApprovalIcon, GridIcon, RequestIcon, TransferIcon } from "@/components/icons";

const items = [
  { href: "/dashboard", label: "Overview", icon: GridIcon },
  { href: "/requests", label: "Requests", icon: RequestIcon },
  { href: "/approvals", label: "Approvals", icon: ApprovalIcon },
  { href: "/transactions", label: "Transactions", icon: TransferIcon },
  { href: "/exceptions", label: "Exceptions", icon: AlertIcon },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="main-nav" aria-label="Primary navigation">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const ItemIcon = item.icon;
        return <Link key={item.href} href={item.href} className={`nav-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined}><ItemIcon className="nav-icon" /><span>{item.label}</span></Link>;
      })}
    </nav>
  );
}
