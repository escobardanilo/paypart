"use client";

import { useEffect, useState } from "react";
import { ArrowIcon, CheckIcon, SearchIcon, ShieldIcon, SparkIcon } from "@/components/icons";

const STORAGE_KEY = "paypart:onboarding-complete:v1";

const steps = [
  { icon: SearchIcon, target: "guided-examples", title: "Start with a guided example", text: "Choose a prepared case to populate both the prompt and transaction reference." },
  { icon: SparkIcon, target: "investigation-command", title: "Give PayPart a command", text: "Edit the question if needed, then run the read-only investigation." },
  { icon: CheckIcon, target: "agent-execution", title: "Watch the agent use tools", text: "Every tool result becomes readable evidence in the execution trace." },
  { icon: ShieldIcon, target: "final-report", fallback: "investigation-context", title: "Review the controlled outcome", text: "The diagnosis, recommendation, action, and verification appear after completion." },
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setOpen(window.localStorage.getItem(STORAGE_KEY) !== "true");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!open) return;
    const current = steps[step];
    const target = document.getElementById(current.target) ?? (current.fallback ? document.getElementById(current.fallback) : null);
    target?.classList.add("tour-highlight");
    return () => target?.classList.remove("tour-highlight");
  }, [open, step]);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  if (!open) return null;
  const current = steps[step];
  const StepIcon = current.icon;

  return (
    <aside className={`onboarding-card step-${step}`} aria-label="PayPart introduction" aria-live="polite">
      <div className="onboarding-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((item, index) => <span key={item.title} className={index <= step ? "active" : ""} />)}
      </div>
      <div className="onboarding-heading"><span><StepIcon /></span><div><small>Quick tour · {step + 1} of {steps.length}</small><h2>{current.title}</h2></div></div>
      <p>{current.text}</p>
      <div className="onboarding-actions">
        <button type="button" className="text-button" onClick={dismiss}>Skip</button>
        <div>
          {step > 0 && <button type="button" className="button secondary compact" onClick={() => setStep((value) => value - 1)}>Back</button>}
          {step < steps.length - 1 ? <button type="button" className="button primary compact" onClick={() => setStep((value) => value + 1)}>Next<ArrowIcon /></button> : <button type="button" className="button primary compact" onClick={dismiss}>Finish<CheckIcon /></button>}
        </div>
      </div>
    </aside>
  );
}
