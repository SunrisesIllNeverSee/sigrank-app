"use client";

import { useState } from "react";

/**
 * Contact form client component. Posts to /api/v1/contact (Resend).
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong.");
        return;
      }

      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-gold/30 bg-gold/5 p-6 text-center">
        <p className="font-mono text-sm text-gold">
          ✓ Message sent. We&apos;ll get back to you at the email you provided.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 font-mono text-xs text-text-secondary transition-colors hover:text-text-primary"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="name"
          className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary"
        >
          Name <span className="text-text-muted">(optional)</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-sans text-sm text-text-primary outline-none transition-colors focus:border-gold/50"
          placeholder="Your name"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-sans text-sm text-text-primary outline-none transition-colors focus:border-gold/50"
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="message"
          className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary"
        >
          Message
        </label>
        <textarea
          id="message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={5000}
          rows={6}
          className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-sans text-sm text-text-primary outline-none transition-colors focus:border-gold/50"
          placeholder="What's on your mind?"
        />
      </div>

      {status === "error" && (
        <p className="font-mono text-xs text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md border border-gold/50 bg-gold/10 px-4 py-2.5 font-mono text-sm font-semibold text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
