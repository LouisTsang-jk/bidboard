"use client";

import { useState, type FormEvent } from "react";

export function BidForm({ suggestedAmount }: { suggestedAmount: number }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      url: form.get("url"),
      title: form.get("title"),
      description: form.get("description"),
      amount: form.get("amount"),
      idempotencyKey: crypto.randomUUID(),
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Checkout could not be created.");
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout could not be created.");
      setStatus("error");
    }
  }

  return (
    <form className="bid-console" onSubmit={submit}>
      <div className="bid-console__topline">
        <p><span>●</span> CLAIM A POSITION</p>
        <p>Minimum $1 · cumulative bids · secure checkout</p>
      </div>
      <div className="bid-console__fields">
        <label><span>Destination</span><input name="url" placeholder="https://yourproduct.com" required type="url" /></label>
        <label><span>Project name</span><input maxLength={80} name="title" placeholder="Your product" required /></label>
        <label className="field-description"><span>One-line pitch</span><input maxLength={240} minLength={10} name="description" placeholder="What makes it worth the click?" required /></label>
        <label className="field-amount"><span>Bid, USD</span><div><b>$</b><input defaultValue={suggestedAmount} min="1" name="amount" required step="1" type="number" /></div></label>
        <button disabled={status === "loading"} type="submit">{status === "loading" ? "Opening…" : "Claim position"}<span aria-hidden="true">↗</span></button>
      </div>
      {status === "error" ? <p className="form-error" role="alert">{message}</p> : null}
    </form>
  );
}
