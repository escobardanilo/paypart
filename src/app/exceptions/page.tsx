import type { Metadata } from "next";
import { ExceptionsWorkspace } from "@/components/exceptions-workspace";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Exceptions" };

export default function ExceptionsPage() {
  return <><PageHeader eyebrow="Operational attention" title="Exceptions" description="Review payment and request issues that need human ownership, a clear next action and a traceable resolution." /><ExceptionsWorkspace /></>;
}
