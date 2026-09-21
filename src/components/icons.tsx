import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
}

export function GridIcon(props: IconProps) { return <Icon {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Icon>; }
export function SparkIcon(props: IconProps) { return <Icon {...props}><path d="m12 3 1.25 4.15a5.1 5.1 0 0 0 3.6 3.6L21 12l-4.15 1.25a5.1 5.1 0 0 0-3.6 3.6L12 21l-1.25-4.15a5.1 5.1 0 0 0-3.6-3.6L3 12l4.15-1.25a5.1 5.1 0 0 0 3.6-3.6L12 3Z" /></Icon>; }
export function SearchIcon(props: IconProps) { return <Icon {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Icon>; }
export function TransferIcon(props: IconProps) { return <Icon {...props}><path d="M4 7h14m0 0-3-3m3 3-3 3M20 17H6m0 0 3 3m-3-3 3-3" /></Icon>; }
export function ClipboardIcon(props: IconProps) { return <Icon {...props}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h4" /></Icon>; }
export function BoltIcon(props: IconProps) { return <Icon {...props}><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" /></Icon>; }
export function ArrowIcon(props: IconProps) { return <Icon {...props}><path d="M5 12h14m-5-5 5 5-5 5" /></Icon>; }
export function CheckIcon(props: IconProps) { return <Icon {...props}><path d="m5 12 4 4L19 6" /></Icon>; }
export function AlertIcon(props: IconProps) { return <Icon {...props}><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4m0 3h.01" /></Icon>; }
export function ClockIcon(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>; }
export function ShieldIcon(props: IconProps) { return <Icon {...props}><path d="M12 3 5 6v5c0 4.5 2.7 8.2 7 10 4.3-1.8 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Icon>; }
export function WalletIcon(props: IconProps) { return <Icon {...props}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" /><path d="M4 8h15m-5 4h5" /></Icon>; }
export function ChevronIcon(props: IconProps) { return <Icon {...props}><path d="m9 18 6-6-6-6" /></Icon>; }
export function PlusIcon(props: IconProps) { return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>; }
export function RequestIcon(props: IconProps) { return <Icon {...props}><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4M9 11h6M9 15h6" /></Icon>; }
export function ApprovalIcon(props: IconProps) { return <Icon {...props}><path d="M8 12.5 11 15l5-6" /><path d="M12 3 5 6v5c0 4.5 2.7 8.2 7 10 4.3-1.8 7-5.5 7-10V6l-7-3Z" /></Icon>; }
export function ActivityIcon(props: IconProps) { return <Icon {...props}><path d="M4 12h3l2-6 4 12 2-6h5" /></Icon>; }
export function UserIcon(props: IconProps) { return <Icon {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6" /></Icon>; }
export function CalendarIcon(props: IconProps) { return <Icon {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></Icon>; }
export function DocumentIcon(props: IconProps) { return <Icon {...props}><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4M9 12h6M9 16h4" /></Icon>; }
export function CloseIcon(props: IconProps) { return <Icon {...props}><path d="m6 6 12 12M18 6 6 18" /></Icon>; }
export function FilterIcon(props: IconProps) { return <Icon {...props}><path d="M4 6h16M7 12h10M10 18h4" /></Icon>; }
export function MoreIcon(props: IconProps) { return <Icon {...props}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></Icon>; }
export function PinyIcon(props: IconProps) { return <Icon {...props}><path d="M5 5h14v11H9l-4 4V5Z" /><path d="M8 9h8M8 12h5" /></Icon>; }
export function PaperclipIcon(props: IconProps) { return <Icon {...props}><path d="m8.5 12.5 5.7-5.7a3 3 0 0 1 4.2 4.2l-7.8 7.8a5 5 0 0 1-7.1-7.1l7.5-7.5" /><path d="m7.8 15.3 7.1-7.1" /></Icon>; }
