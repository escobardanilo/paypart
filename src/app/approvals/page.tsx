import type { Metadata } from "next";
import { ApprovalWorkspace } from "@/components/approval-workspace";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return <><PageHeader eyebrow="Controlled authorization" title="Approvals" description="Review payment context, apply the right authority and preserve every decision in the operational record." /><ApprovalWorkspace /></>;
}
