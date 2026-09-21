export type PaymentRequestStatus = "Draft" | "Under review" | "Awaiting approval" | "Approved" | "Scheduled" | "Completed" | "Rejected";

export interface PaymentRequest {
  id: string;
  title: string;
  type: string;
  requester: string;
  counterparty: string;
  amount: number;
  currency: "EUR";
  reason: string;
  created: string;
  due: string;
  status: PaymentRequestStatus;
  owner: string;
  approval: string;
  reference: string;
}

export const paymentRequests: PaymentRequest[] = [
  { id: "REQ-1048", title: "Infrastructure invoice", type: "Supplier invoice", requester: "Maria Costa", counterparty: "Cloud Infrastructure Ltd.", amount: 3240, currency: "EUR", reason: "September cloud infrastructure services", created: "2026-09-21T08:32:00Z", due: "26 Sep 2026", status: "Awaiting approval", owner: "Finance", approval: "Finance lead", reference: "CI-2026-0918" },
  { id: "REQ-1047", title: "Customer service refund", type: "Customer refund", requester: "Daniel Moreira", counterparty: "Customer refund · Order 4821", amount: 428, currency: "EUR", reason: "Approved service credit", created: "2026-09-21T07:50:00Z", due: "23 Sep 2026", status: "Under review", owner: "Operations", approval: "Review required", reference: "RF-188" },
  { id: "REQ-1046", title: "Annual platform renewal", type: "Software subscription", requester: "Inês Almeida", counterparty: "Northstar Software", amount: 1890, currency: "EUR", reason: "Annual analytics platform renewal", created: "2026-09-20T15:14:00Z", due: "27 Sep 2026", status: "Scheduled", owner: "Treasury", approval: "Approved", reference: "NS-ANNUAL-26" },
  { id: "REQ-1045", title: "Freight settlement", type: "Supplier invoice", requester: "Rui Santos", counterparty: "Acme Logistics", amount: 760, currency: "EUR", reason: "International freight settlement", created: "2026-09-20T11:06:00Z", due: "22 Sep 2026", status: "Approved", owner: "Payments", approval: "Approved", reference: "AL-7742" },
  { id: "REQ-1044", title: "Campaign production", type: "Contractor payment", requester: "Sofia Martins", counterparty: "Brightline Media", amount: 2450, currency: "EUR", reason: "Q3 campaign production milestone", created: "2026-09-19T16:22:00Z", due: "30 Sep 2026", status: "Completed", owner: "Finance", approval: "Approved", reference: "BLM-320" },
  { id: "REQ-1043", title: "Advisory retainer", type: "Supplier invoice", requester: "Miguel Ferreira", counterparty: "Atlas Consulting", amount: 5100, currency: "EUR", reason: "September operating model advisory", created: "2026-09-19T09:11:00Z", due: "25 Sep 2026", status: "Rejected", owner: "Finance", approval: "Rejected", reference: "ATL-0926" },
];

export const approvals = [
  { requestId: "REQ-1048", counterparty: "Cloud Infrastructure Ltd.", amount: 3240, title: "Infrastructure invoice", requestedBy: "Operations", requiredApproval: "Finance", submitted: "Today, 09:32", risk: "Normal", note: "Amount matches the attached invoice and approved infrastructure budget.", history: ["Created by Operations", "Reviewed by Finance Analyst", "Awaiting Finance Lead"] },
  { requestId: "REQ-1042", counterparty: "Atlas Consulting", amount: 5100, title: "Advisory services", requestedBy: "Strategy", requiredApproval: "Finance + Director", submitted: "Yesterday, 16:10", risk: "Elevated", note: "Second approval required because the request exceeds €5,000.", history: ["Created by Strategy", "Reviewed by Finance Analyst", "Awaiting Finance Director"] },
  { requestId: "REQ-1039", counterparty: "Northstar Software", amount: 980, title: "Usage overage", requestedBy: "Engineering", requiredApproval: "Budget owner", submitted: "19 Sep, 14:22", risk: "Normal", note: "Usage overage is within the quarterly software budget.", history: ["Created by Engineering", "Budget evidence attached", "Awaiting Budget Owner"] },
];

export const transactions = [
  { reference: "TX-8921", counterparty: "Brightline Media", amount: 2450, type: "Supplier payment", status: "Completed", provider: "Stripe", created: "2026-09-21T08:48:00Z", updated: "2026-09-21T08:51:00Z", request: "REQ-1044", approval: "Approved by Finance", note: "Settled against campaign milestone BLM-320." },
  { reference: "TX-8920", counterparty: "Northstar Software", amount: 1890, type: "Subscription", status: "Processing", provider: "Adyen", created: "2026-09-21T08:15:00Z", updated: "2026-09-21T08:46:00Z", request: "REQ-1046", approval: "Approved by Finance", note: "Scheduled payment currently processing." },
  { reference: "TX-8919", counterparty: "Customer refund · Order 4821", amount: 428, type: "Refund", status: "Pending", provider: "Mollie", created: "2026-09-21T07:54:00Z", updated: "2026-09-21T08:12:00Z", request: "REQ-1047", approval: "Review pending", note: "Waiting for operational review before submission." },
  { reference: "TX-8918", counterparty: "Acme Logistics", amount: 760, type: "Supplier payment", status: "Failed", provider: "Adyen", created: "2026-09-20T15:30:00Z", updated: "2026-09-20T15:31:00Z", request: "REQ-1045", approval: "Approved by Finance", note: "Provider declined the payment method. Exception EXC-203 created." },
  { reference: "TX-8917", counterparty: "Cloud Infrastructure Ltd.", amount: 3105, type: "Supplier payment", status: "Completed", provider: "Stripe", created: "2026-09-19T12:08:00Z", updated: "2026-09-19T12:11:00Z", request: "REQ-1037", approval: "Approved by Finance", note: "Previous monthly infrastructure invoice." },
  { reference: "TX-8916", counterparty: "Atlas Consulting", amount: 1200, type: "Supplier payment", status: "Refunded", provider: "Mollie", created: "2026-09-18T10:03:00Z", updated: "2026-09-20T09:42:00Z", request: "REQ-1032", approval: "Approved by Finance", note: "Refund completed after duplicate invoice confirmation." },
];

export const exceptions = [
  { id: "EXC-203", title: "Supplier payment failed", object: "TX-8918", counterparty: "Acme Logistics", amount: 760, provider: "Adyen", type: "Payment failed", status: "Open", owner: "Payments", reason: "Provider declined the payment.", nextStep: "Review the payment method before retrying.", updated: "12 min ago", priority: "High" },
  { id: "EXC-202", title: "Approval window expired", object: "REQ-1038", counterparty: "Northstar Software", amount: 1420, provider: "—", type: "Approval expired", status: "Assigned", owner: "Finance", reason: "The request was not approved before its due date.", nextStep: "Confirm the business need and restart approval.", updated: "46 min ago", priority: "Medium" },
  { id: "EXC-201", title: "Invoice amount mismatch", object: "REQ-1041", counterparty: "Atlas Consulting", amount: 6800, provider: "—", type: "Amount mismatch", status: "In review", owner: "Operations", reason: "The request amount differs from the attached invoice by €450.", nextStep: "Request a corrected invoice or update the request.", updated: "2 hr ago", priority: "High" },
  { id: "EXC-199", title: "Potential duplicate request", object: "REQ-1036", counterparty: "Brightline Media", amount: 2450, provider: "—", type: "Duplicate request", status: "Open", owner: "Unassigned", reason: "A similar request exists for the same reference and amount.", nextStep: "Compare both requests before approval.", updated: "Yesterday", priority: "Medium" },
];

export const activity = [
  { actor: "Maria Costa", initials: "MC", event: "approved", object: "REQ-1048", detail: "Cloud Infrastructure Ltd. · €3,240", timestamp: "09:42", tone: "green" },
  { actor: "Payment service", initials: "PS", event: "completed", object: "TX-8921", detail: "Brightline Media · €2,450", timestamp: "08:51", tone: "blue" },
  { actor: "Daniel Moreira", initials: "DM", event: "requested additional information on", object: "REQ-1047", detail: "Customer refund · €428", timestamp: "08:12", tone: "amber" },
  { actor: "Exception monitor", initials: "EM", event: "created", object: "EXC-203", detail: "Failed supplier payment · €760", timestamp: "Yesterday, 15:31", tone: "red" },
  { actor: "Sofia Martins", initials: "SM", event: "submitted", object: "REQ-1044", detail: "Campaign production · €2,450", timestamp: "Yesterday, 14:08", tone: "violet" },
  { actor: "Finance Lead", initials: "FL", event: "approved", object: "RF-188", detail: "Customer refund · €428", timestamp: "19 Sep, 16:24", tone: "green" },
];

export const actionRequired = [
  { item: "Vendor invoice", counterparty: "Cloud Infrastructure Ltd.", type: "Approval", amount: 3240, status: "Awaiting approval", owner: "Finance", updated: "10 min ago", priority: "High" },
  { item: "Customer refund", counterparty: "Order 4821", type: "Review", amount: 428, status: "Review required", owner: "Operations", updated: "28 min ago", priority: "Normal" },
  { item: "Infrastructure provider", counterparty: "Northstar Software", type: "Payment", amount: 1890, status: "Scheduled", owner: "Treasury", updated: "1 hr ago", priority: "Normal" },
  { item: "Failed supplier payment", counterparty: "Acme Logistics", type: "Exception", amount: 760, status: "Exception", owner: "Payments", updated: "2 hr ago", priority: "High" },
];
