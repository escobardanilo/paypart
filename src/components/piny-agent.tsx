"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowIcon, CloseIcon, PaperclipIcon, PinyIcon } from "@/components/icons";
import { usePaymentRequest } from "@/components/new-payment-request";
import type { PinyDraft, PinyResponse } from "@/lib/piny-schema";

const suggestedPrompts = [
  "What needs my attention today?",
  "Summarize pending approvals.",
  "Which exceptions are still open?",
  "Help me prepare a payment request.",
  "Analyze a business situation.",
];

interface ConversationMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  attachment?: string;
  draft?: PinyDraft | null;
}

function displayValue(value: string | null) {
  return value ?? "Not provided";
}

function displayAmount(draft: PinyDraft) {
  if (draft.amount === null) return "Not provided";
  if (!draft.currency) return draft.amount.toLocaleString("en-IE", { maximumFractionDigits: 2 });
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: draft.currency }).format(draft.amount);
}

function DraftSummary({ draft, onUse }: { draft: PinyDraft; onUse: () => void }) {
  return (
    <div className="piny-draft">
      <section><span>Detected request type</span><strong>{draft.requestType ?? "Not provided"}</strong></section>
      <section>
        <span>Extracted information</span>
        <dl>
          <div><dt>Counterparty</dt><dd>{displayValue(draft.counterparty)}</dd></div>
          <div><dt>Amount</dt><dd>{displayAmount(draft)}</dd></div>
          <div><dt>Purpose</dt><dd>{displayValue(draft.description)}</dd></div>
          <div><dt>Due date</dt><dd>{displayValue(draft.dueDate)}</dd></div>
          <div><dt>Reference</dt><dd>{displayValue(draft.reference)}</dd></div>
        </dl>
      </section>
      <section><span>Missing information</span><p>{draft.missingFields.length > 0 ? draft.missingFields.join(" · ") : "None"}</p></section>
      <button className="button primary piny-use-draft" type="button" onClick={onUse}>Use in New Payment Request<ArrowIcon /></button>
    </div>
  );
}

export function PinyAgent() {
  const { openRequest } = usePaymentRequest();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageId = useRef(0);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  function nextId() {
    messageId.current += 1;
    return messageId.current;
  }

  function chooseFile(selected: File | undefined) {
    setError(null);
    if (!selected) return;
    if (selected.type !== "application/pdf" || !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please attach a PDF file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("The PDF must be no larger than 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(selected);
  }

  function removeFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function sendMessage(suggested?: string) {
    const message = (suggested ?? input).trim();
    if (busy || (!message && !file)) return;
    if (!consent) {
      setError("Confirm processing before sending information to Piny.");
      return;
    }

    setError(null);
    setMessages((current) => [...current, {
      id: nextId(),
      role: "user",
      content: message || "Analyze this document.",
      attachment: file?.name,
    }]);
    setBusy(true);

    const body = new FormData();
    body.set("message", message);
    body.set("consent", "true");
    if (file) body.set("file", file);

    try {
      const response = await fetch("/api/piny", { method: "POST", body });
      const payload = await response.json() as Partial<PinyResponse> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Piny is temporarily unavailable.");

      setMessages((current) => [...current, {
        id: nextId(),
        role: "assistant",
        content: payload.message || "I don't have enough information to determine that.",
        draft: payload.draft ?? null,
      }]);
      setInput("");
      removeFile();
    } catch (requestError) {
      setMessages((current) => [...current, {
        id: nextId(),
        role: "assistant",
        content: requestError instanceof Error ? requestError.message : "Piny is temporarily unavailable.",
      }]);
    } finally {
      setBusy(false);
    }
  }

  function handleUseDraft(draft: PinyDraft) {
    setOpen(false);
    openRequest(draft);
  }

  return (
    <>
      <button className="piny-launch" type="button" onClick={() => setOpen(true)} aria-label="Open Piny Payment Operations Agent"><PinyIcon /><span>Piny</span></button>
      {open && <div className="piny-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <aside className="piny-drawer" role="dialog" aria-modal="true" aria-labelledby="piny-title">
          <header className="piny-header">
            <div className="piny-identity"><span><PinyIcon /></span><div><h2 id="piny-title">Piny</h2><p>Payment Operations Agent</p></div></div>
            <div className="piny-header-actions"><span><i />Read-only assistant</span><button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close Piny"><CloseIcon /></button></div>
          </header>

          <div className="piny-conversation" aria-live="polite">
            {messages.length === 0 ? <div className="piny-empty">
              <span><PinyIcon /></span>
              <h3>How can I help with your payment operations?</h3>
              <p>Ask about this demo workspace or provide business context for a request draft.</p>
              <div>{suggestedPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => void sendMessage(prompt)}>{prompt}<ArrowIcon /></button>)}</div>
            </div> : <div className="piny-messages">
              {messages.map((message) => <article className={`piny-message ${message.role}`} key={message.id}>
                <span>{message.role === "assistant" ? "Piny" : "You"}</span>
                <div><p>{message.content}</p>{message.attachment && <small><PaperclipIcon />{message.attachment}</small>}{message.draft && <DraftSummary draft={message.draft} onUse={() => handleUseDraft(message.draft!)} />}</div>
              </article>)}
              {busy && <article className="piny-message assistant"><span>Piny</span><div className="piny-thinking"><i /><i /><i /></div></article>}
            </div>}
          </div>

          <form className="piny-composer" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
            {file && <div className="piny-file"><PaperclipIcon /><span><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(1)} MB · PDF</small></span><button type="button" onClick={removeFile} aria-label="Remove attachment"><CloseIcon /></button></div>}
            {error && <p className="piny-error" role="alert">{error}</p>}
            <div className="piny-input-row">
              <button className="piny-attach" type="button" onClick={() => fileInputRef.current?.click()} disabled={busy} aria-label="Attach PDF"><PaperclipIcon /></button>
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => chooseFile(event.target.files?.[0])} />
              <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Piny or describe a payment situation..." rows={2} maxLength={4000} disabled={busy} />
              <button className="piny-send" type="submit" disabled={busy || (!input.trim() && !file)} aria-label="Send to Piny"><ArrowIcon /></button>
            </div>
            <label className="piny-consent"><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setError(null); }} /><span>Allow this message and selected PDF text to be processed by Groq for this demo. Files are not stored.</span></label>
          </form>
        </aside>
      </div>}
    </>
  );
}
