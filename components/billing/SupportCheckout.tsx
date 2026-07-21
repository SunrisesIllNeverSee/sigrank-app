"use client";

import React, { useEffect, useState } from "react";
import { startCheckout } from "./CheckoutRedirect";
import { track } from "@/lib/infra/posthog/events";

/**
 * components/billing/SupportCheckout.tsx — the "Support the Build" checkout.
 *
 * Two ways to back SigRank (owner 2026-06-27):
 *   - ONE-TIME, pay-what-you-want: the supporter types any amount ($1–$10,000);
 *     POSTs { kind:'donation', amount_cents } → one-time Stripe Checkout.
 *   - MONTHLY: a preset recurring amount ($5/$10/$25); POSTs
 *     { kind:'subscription', price } against a server-allowlisted price id.
 *
 * Thin island over startCheckout(): on a 503 (stripe_not_configured /
 * donation_not_configured / invalid_price) it shows an honest "not live yet"
 * note and NEVER falsely completes a sale.
 *
 * The monthly price ids come from NEXT_PUBLIC_STRIPE_SUPPORT_PRICES (a JSON map
 * { "5": priceId, ... }); when unset, only the one-time path renders so the UI
 * never offers a button that can't resolve.
 */

type Mode = "once" | "monthly";

/** Monthly presets → publishable price ids (server re-checks the allowlist). */
function monthlyPrices(): { usd: number; price: string }[] {
  try {
    const raw = process.env.NEXT_PUBLIC_STRIPE_SUPPORT_PRICES;
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string>;
    return Object.entries(map)
      .map(([usd, price]) => ({ usd: Number(usd), price }))
      .filter((p) => Number.isFinite(p.usd) && p.price)
      .sort((a, b) => a.usd - b.usd);
  } catch {
    return [];
  }
}

const PRESET_ONCE = [5, 10, 25, 50];

export function SupportCheckout() {
  const monthly = monthlyPrices();
  const [mode, setMode] = useState<Mode>("once");
  const [amount, setAmount] = useState<string>("10");
  const [selectedMonthly, setSelectedMonthly] = useState<string>(
    monthly[0]?.price ?? "",
  );
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // Logged-in operator (codename), if any — threaded into checkout so revenue events
  // key to a person instead of the anon bucket. Same source + key the server events use
  // (/api/v1/profile → operator.codename; matches metadata.operator_id server-side). (salvaged from PR #16)
  const [operatorId, setOperatorId] = useState<string | null>(null);

  // upgrade_viewed — SupportCheckout always renders on /upgrade, so its mount = page view.
  useEffect(() => {
    track.upgradeViewed();
    fetch("/api/v1/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const codename: string | undefined = d?.operator?.codename;
        if (codename) setOperatorId(codename);
      })
      .catch(() => {});
  }, []);

  async function go() {
    setPending(true);
    setNote(null);
    let payload: Record<string, unknown>;
    if (mode === "once") {
      const dollars = Number(amount);
      if (!Number.isFinite(dollars) || dollars < 1) {
        setPending(false);
        setNote("Enter an amount of $1 or more.");
        return;
      }
      payload = {
        kind: "donation",
        amount_cents: Math.round(dollars * 100),
        ...(operatorId ? { operator_id: operatorId } : {}),
      };
    } else {
      if (!selectedMonthly) {
        setPending(false);
        setNote("Pick a monthly amount.");
        return;
      }
      payload = {
        kind: "subscription",
        price: selectedMonthly,
        ...(operatorId ? { operator_id: operatorId } : {}),
      };
    }

    track.checkoutClicked(
      mode === "once"
        ? { kind: "donation", amount_usd: Number(amount) }
        : { kind: "subscription", price: selectedMonthly },
    );
    const outcome = await startCheckout(
      "/api/v1/billing/create-checkout-session",
      payload,
    );
    if (!outcome.ok) {
      setPending(false);
      setNote(
        outcome.reason === "not_configured"
          ? "Backing isn't live just yet — checkout opens soon. Thanks for the support; check back shortly."
          : "Something went wrong starting checkout. Please try again.",
      );
    }
    // ok: the browser is navigating to Stripe — leave pending true.
  }

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={
        "flex-1 rounded-md px-3 py-2 text-center font-mono text-sm transition-colors " +
        (mode === m
          ? "bg-gold/15 text-text-primary"
          : "text-text-muted hover:bg-bg-elevated")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gold/25 bg-gradient-to-b from-gold/5 to-bg-surface p-5">
      {/* mode toggle — monthly tab only when prices are configured */}
      <div className="flex gap-1 rounded-md border border-bg-border p-1">
        {tab("once", "One-time")}
        {monthly.length > 0 && tab("monthly", "Monthly")}
      </div>

      {mode === "once" ? (
        <div className="flex flex-col gap-2">
          <label className="font-sans text-[11px] uppercase tracking-wider text-text-muted">
            Pay what you want
          </label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-text-secondary">$</span>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-bg-border bg-bg-base px-3 py-2 font-mono text-lg text-text-primary outline-none focus:border-gold/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_ONCE.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className={
                  "rounded-md border px-3 py-1.5 font-mono text-sm transition-colors " +
                  (amount === String(v)
                    ? "border-gold/50 bg-gold/10 text-text-primary"
                    : "border-bg-border text-text-muted hover:bg-bg-elevated")
                }
              >
                ${v}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="font-sans text-[11px] uppercase tracking-wider text-text-muted">
            Monthly support
          </label>
          <div className="flex flex-wrap gap-2">
            {monthly.map((m) => (
              <button
                key={m.price}
                type="button"
                onClick={() => setSelectedMonthly(m.price)}
                className={
                  "rounded-md border px-4 py-2 font-mono text-sm transition-colors " +
                  (selectedMonthly === m.price
                    ? "border-gold/50 bg-gold/10 text-text-primary"
                    : "border-bg-border text-text-muted hover:bg-bg-elevated")
                }
              >
                ${m.usd}/mo
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="w-full rounded-md bg-gold py-2.5 text-center font-semibold text-bg-base transition-colors hover:bg-gold/90 disabled:opacity-60"
      >
        {pending ? "Opening checkout…" : "Support the build →"}
      </button>

      {note && (
        <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2 text-center font-sans text-xs text-text-secondary">
          {note}
        </p>
      )}
    </div>
  );
}
