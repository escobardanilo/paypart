"use client";

import { useState } from "react";
import { CalendarIcon, CloseIcon, DocumentIcon, PlusIcon } from "@/components/icons";

export function NewPaymentRequest() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function close() {
    setOpen(false);
    setSubmitted(false);
  }

  return (
    <>
      <button type="button" className="button primary" onClick={() => setOpen(true)}><PlusIcon />New payment request</button>
      {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
        <section className="request-modal" role="dialog" aria-modal="true" aria-labelledby="new-request-title">
          <header className="modal-heading">
            <div><span className="eyebrow">Payment request</span><h2 id="new-request-title">Create a new request</h2><p>Capture the context reviewers need before a payment can move forward.</p></div>
            <button type="button" className="icon-button" onClick={close} aria-label="Close"><CloseIcon /></button>
          </header>
          {submitted ? <div className="request-success"><span><DocumentIcon /></span><h3>Request prepared</h3><p>This portfolio demo validates the workflow without creating or moving real funds.</p><button type="button" className="button primary" onClick={close}>Return to requests</button></div> :
            <form className="request-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
              <div className="form-grid">
                <label><span>Request type</span><select required defaultValue=""><option value="" disabled>Select a type</option><option>Supplier invoice</option><option>Software subscription</option><option>Customer refund</option><option>Contractor payment</option><option>Expense reimbursement</option></select></label>
                <label><span>Counterparty</span><input required placeholder="Company or recipient" /></label>
                <label><span>Amount</span><input required inputMode="decimal" placeholder="0.00" /></label>
                <label><span>Currency</span><select defaultValue="EUR"><option>EUR</option><option>GBP</option><option>USD</option></select></label>
                <label className="full"><span>Description</span><textarea required placeholder="What is this payment for?" rows={3} /></label>
                <label><span>Due date</span><span className="input-with-icon"><CalendarIcon /><input required type="date" /></span></label>
                <label><span>Reference / invoice</span><input placeholder="Optional reference" /></label>
                <label className="full upload-placeholder"><span>Supporting document</span><button type="button"><DocumentIcon /><strong>Attach a document</strong><small>PDF, PNG or JPG · demo placeholder</small></button></label>
              </div>
              <footer className="modal-footer"><button type="button" className="button secondary" onClick={close}>Cancel</button><button className="button primary" type="submit">Create request</button></footer>
            </form>}
        </section>
      </div>}
    </>
  );
}
