import Link from "next/link";
import { ArrowIcon } from "@/components/icons";

export default function NotFound() {
  return <div className="standalone-state"><span>404</span><h1>Investigation not found</h1><p>The requested audit record does not exist or is no longer available.</p><Link href="/investigations" className="button primary">Return to investigations<ArrowIcon /></Link></div>;
}

