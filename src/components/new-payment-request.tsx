"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CalendarIcon, CloseIcon, DocumentIcon, PlusIcon } from "@/components/icons";
import type { PinyDraft } from "@/lib/piny-schema";

interface RequestFormValues {
  requestType: string;
  counterparty: string;
  amount: string;
  currency: string;
  description: string;
  dueDate: string;
  reference: string;
}

interface PaymentRequestContextValue {
  openRequest: (draft?: PinyDraft | null) => void;
}

const emptyForm: RequestFormValues = {
  requestType: "",
  counterparty: "",
  amount: "",
  currency: "EUR",
  description: "",
  dueDate: "",
  reference: "",
};

const PaymentRequestContext = createContext<PaymentRequestContextValue | null>(null);

export function usePaymentRequest() {
  const context = useContext(PaymentRequestContext);
  if (!context) throw new Error("usePaymentRequest must be used inside PaymentRequestProvider");
  return context;
}

function dateForInput(value: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const dayFirst = value.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i);
  const monthFirst = value.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  const day = Number(dayFirst?.[1] ?? monthFirst?.[2]);
  const monthName = (dayFirst?.[2] ?? monthFirst?.[1] ?? "").toLowerCase();
  const year = Number(dayFirst?.[3] ?? monthFirst?.[3]);
  const month = months.findIndex((name) => name === monthName || name.startsWith(monthName.slice(0, 3))) + 1;

  if (!day || !month || !year) return "";
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formFromDraft(draft: PinyDraft): RequestFormValues {
  return {
    requestType: draft.requestType ?? "",
    counterparty: draft.counterparty ?? "",
    amount: draft.amount === null ? "" : String(draft.amount),
    currency: draft.currency ?? "",
    description: draft.description ?? "",
    dueDate: dateForInput(draft.dueDate),
    reference: draft.reference ?? "",
  };
}

export function PaymentRequestProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<RequestFormValues>(emptyForm);

  const openRequest = useCallback((draft?: PinyDraft | null) => {
    setValues(draft ? formFromDraft(draft) : emptyForm);
    setSubmitted(false);
    setOpen(true);
  }, []);

  function close() {
    setOpen(false);
    setSubmitted(false);
  }

  function updateField(field: keyof RequestFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <PaymentRequestContext.Provider value={{ openRequest }}>
      {children}
      {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
        <section className="request-modal" role="dialog" aria-modal="true" aria-labelledby="new-request-title">
          <header className="modal-heading">
            <div><span className="eyebrow">Payment request</span><h2 id="new-request-title">Create a new request</h2><p>Capture the context reviewers need before a payment can move forward.</p></div>
            <button type="button" className="icon-button" onClick={close} aria-label="Close"><CloseIcon /></button>
          </header>
          {submitted ? <div className="request-success"><span><DocumentIcon /></span><h3>Request prepared</h3><p>This portfolio demo validates the workflow without creating or moving real funds.</p><button type="button" className="button primary" onClick={close}>Return to requests</button></div> :
            <form className="request-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
              <div className="form-grid">
                <label><span>Request type</span><select required value={values.requestType} onChange={(event) => updateField("requestType", event.target.value)}><option value="" disabled>Select a type</option><option>Supplier invoice</option><option>Software subscription</option><option>Customer refund</option><option>Contractor payment</option><option>Expense reimbursement</option></select></label>
                <label><span>Counterparty</span><input required value={values.counterparty} onChange={(event) => updateField("counterparty", event.target.value)} placeholder="Company or recipient" /></label>
                <label><span>Amount</span><input required inputMode="decimal" value={values.amount} onChange={(event) => updateField("amount", event.target.value)} placeholder="0.00" /></label>
                <label><span>Currency</span><select value={values.currency} onChange={(event) => updateField("currency", event.target.value)}><option value="" disabled>Select currency</option><option>EUR</option><option>GBP</option><option>USD</option></select></label>
                <label className="full"><span>Description</span><textarea required value={values.description} onChange={(event) => updateField("description", event.target.value)} placeholder="What is this payment for?" rows={3} /></label>
                <label><span>Due date</span><span className="input-with-icon"><CalendarIcon /><input required type="date" value={values.dueDate} onChange={(event) => updateField("dueDate", event.target.value)} /></span></label>
                <label><span>Reference / invoice</span><input value={values.reference} onChange={(event) => updateField("reference", event.target.value)} placeholder="Optional reference" /></label>
                <label className="full upload-placeholder"><span>Supporting document</span><button type="button"><DocumentIcon /><strong>Attach a document</strong><small>PDF, PNG or JPG · demo placeholder</small></button></label>
              </div>
              <footer className="modal-footer"><button type="button" className="button secondary" onClick={close}>Cancel</button><button className="button primary" type="submit">Create request</button></footer>
            </form>}
        </section>
      </div>}
    </PaymentRequestContext.Provider>
  );
}

export function NewPaymentRequest() {
  const { openRequest } = usePaymentRequest();
  return <button type="button" className="button primary" onClick={() => openRequest()}><PlusIcon />New payment request</button>;
}
