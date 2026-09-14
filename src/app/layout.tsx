import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PayPart Core", template: "%s · PayPart" },
  description: "AI-assisted payment operations investigations with controlled human follow-up.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
