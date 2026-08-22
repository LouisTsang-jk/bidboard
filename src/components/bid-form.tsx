"use client";

import { useRef, useState, type FormEvent } from "react";

type BidChoice = "minimum" | "first" | "custom";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatAmount(value: number | string): string {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? usd.format(amount) : "$1";
}

export function BidForm({
  leaderAmount,
  takeFirstAmount,
}: {
  leaderAmount: number;
  takeFirstAmount: number;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [choice, setChoice] = useState<BidChoice>("minimum");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("1");
  const [customAmount, setCustomAmount] = useState("1");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const idempotencyKey = useRef<string | null>(null);
  const canTakeFirst = takeFirstAmount <= 100_000;

  function editDraft() {
    idempotencyKey.current = null;
    if (status === "error") setStatus("idle");
    setMessage("");
  }

  function chooseAmount(nextChoice: BidChoice, nextAmount?: number) {
    editDraft();
    setChoice(nextChoice);
    if (nextChoice === "custom") {
      setAmount(customAmount);
    } else if (nextAmount !== undefined) {
      setAmount(String(nextAmount));
    }
  }

  function showStep(nextStep: 1 | 2) {
    setStep(nextStep);
    setStatus("idle");
    setMessage("");
    if (nextStep === 1) idempotencyKey.current = null;
    requestAnimationFrame(() => stepHeading.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (step === 1) {
      showStep(2);
      return;
    }

    setStatus("loading");
    idempotencyKey.current ??= crypto.randomUUID();

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          title,
          description,
          amount,
          idempotencyKey: idempotencyKey.current,
        }),
      });
      const result = (await response.json().catch(() => ({
        error: "Checkout could not be created. Try again.",
      }))) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Checkout could not be created.");
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout could not be created.");
      setStatus("error");
    }
  }

  const formattedAmount = formatAmount(amount);

  return (
    <form className="bid-console" onSubmit={submit}>
      <div className="bid-console__header">
        <div className="bid-console__meta">
          <p><span>●</span> PLACE A BID</p>
          <p>STEP {step} OF 2</p>
        </div>
        <h2 ref={stepHeading} tabIndex={-1}>
          {step === 1 ? "Add your site to the board" : "Describe your project"}
        </h2>
        <p className="bid-console__intro">
          {step === 1
            ? "Choose what you want to spend. $1 joins the board; a higher confirmed total moves you up."
            : "This is what people will see before they click. You will review the exact payment amount before paying."}
        </p>
        <div className="bid-progress" aria-label={`Step ${step} of 2`}>
          <span className="is-active" />
          <span className={step === 2 ? "is-active" : undefined} />
        </div>
      </div>

      {step === 1 ? (
        <div className="bid-step bid-step--amount">
          <label className="bid-field bid-field--url">
            <span className="bid-field__label">Website URL</span>
            <input
              autoComplete="url"
              name="url"
              onChange={(event) => {
                editDraft();
                setUrl(event.target.value);
              }}
              placeholder="https://yourproduct.com"
              required
              type="url"
              value={url}
            />
            <small>Already listed? Use the same URL to add this payment to its total.</small>
          </label>

          <fieldset className="bid-amount">
            <legend>Choose your bid</legend>
            <div className="bid-options">
              <button
                aria-pressed={choice === "minimum"}
                className={choice === "minimum" ? "is-selected" : undefined}
                onClick={() => chooseAmount("minimum", 1)}
                type="button"
              >
                <span>Join the board</span>
                <strong>$1</strong>
                <small>Minimum bid</small>
              </button>
              {leaderAmount > 0 ? (
                <button
                  aria-pressed={choice === "first"}
                  className={choice === "first" ? "is-selected" : undefined}
                  disabled={!canTakeFirst}
                  onClick={() => chooseAmount("first", takeFirstAmount)}
                  type="button"
                >
                  <span>Take #1</span>
                  <strong>{formatAmount(takeFirstAmount)}</strong>
                  <small>{canTakeFirst ? `Current #1: ${formatAmount(leaderAmount)}` : "Requires multiple payments"}</small>
                </button>
              ) : null}
              <button
                aria-pressed={choice === "custom"}
                className={choice === "custom" ? "is-selected" : undefined}
                onClick={() => chooseAmount("custom")}
                type="button"
              >
                <span>Your budget</span>
                <strong>Custom</strong>
                <small>Enter any amount</small>
              </button>
            </div>
            {choice === "custom" ? (
              <label className="bid-field bid-field--custom">
                <span className="bid-field__label">Custom bid in USD</span>
                <span className="money-input">
                  <b>$</b>
                  <input
                    autoFocus
                    max="100000"
                    min="1"
                    onChange={(event) => {
                      editDraft();
                      setCustomAmount(event.target.value);
                      setAmount(event.target.value);
                    }}
                    required
                    step="0.01"
                    type="number"
                    value={customAmount}
                  />
                </span>
              </label>
            ) : null}
          </fieldset>

          <div className="bid-actions">
            <p>Stripe-hosted checkout. Your rank updates only after payment is confirmed.</p>
            <button className="bid-primary" type="submit">Continue <span aria-hidden="true">→</span></button>
          </div>
        </div>
      ) : (
        <div className="bid-step bid-step--details">
          <div className="bid-summary">
            <div><span>Website</span><strong>{url}</strong></div>
            <div><span>Your bid</span><strong>{formattedAmount}</strong></div>
            <button onClick={() => showStep(1)} type="button">Change</button>
          </div>

          <div className="bid-details-grid">
            <label className="bid-field">
              <span className="bid-field__label">Project name</span>
              <input autoFocus maxLength={80} name="title" onChange={(event) => {
                editDraft();
                setTitle(event.target.value);
              }} placeholder="Your product" required value={title} />
              <small>Use the name visitors will recognize.</small>
            </label>
            <label className="bid-field">
              <span className="bid-field__label">One-line description</span>
              <input maxLength={240} minLength={10} name="description" onChange={(event) => {
                editDraft();
                setDescription(event.target.value);
              }} placeholder="What makes it worth the click?" required value={description} />
              <small>10–240 characters. Keep it clear and specific.</small>
            </label>
          </div>

          {status === "error" ? <p className="form-error" role="alert">{message}</p> : null}

          <div className="bid-actions">
            <button className="bid-back" disabled={status === "loading"} onClick={() => showStep(1)} type="button">← Back</button>
            <p>Next: review and pay securely on Stripe.</p>
            <button className="bid-primary" disabled={status === "loading"} type="submit">
              {status === "loading" ? "Opening Stripe…" : `Continue to Stripe · ${formattedAmount}`}
              {status === "loading" ? null : <span aria-hidden="true">↗</span>}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
