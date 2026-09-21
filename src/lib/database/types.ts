export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Account {
  id: string;
  account_name: string;
  account_type: string;
  currency: string;
  balance: number;
  status: string;
  created_at: string;
}

export interface Party {
  id: string;
  name: string;
  type: "customer" | "supplier";
  status: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  party_id: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  transaction_reference: string;
  account_id: string;
  party_id: string;
  invoice_id: string | null;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  provider_error_code: string | null;
  created_at: string;
}

export interface PaymentAttempt {
  id: string;
  transaction_id: string;
  attempt_number: number;
  status: string;
  provider_error_code: string | null;
  attempted_at: string;
}

export interface ProviderError {
  code: string;
  provider: string;
  title: string;
  description: string;
  recommended_action: string;
}

export type TransactionWithRelations = Transaction & {
  parties: Pick<Party, "name" | "type"> | null;
  accounts: Pick<Account, "account_name"> | null;
  invoices: Pick<Invoice, "invoice_number"> | null;
};
