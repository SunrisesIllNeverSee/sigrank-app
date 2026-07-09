"use client";

import React, { useState } from "react";

/**
 * components/billing/ManageSubscription.tsx — "Manage subscription" button that
 * opens the Stripe Billing Portal.
 *
 * POSTs to /api/v1/billing/portal and redirects to the returned portal url.
 * On a 503 (stripe_not_configured) shows "Try again later" — never pretends a
 * portal opened. The portal route resolves the Stripe customer from the
 * operator id (or an explicit customer id).
 */

interface Props {
  operatorId?: string;
  customerId?: string;
}

export function ManageSubscription({ operatorId, customerId }: Props) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onManage() {
    setPending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/v1/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator_id: operatorId,
          customer_id: customerId,
        }),
      });
      if (res.status === 503) {
        setNotice("Try again later");
        setPending(false);
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setNotice("Could not open the billing portal.");
      setPending(false);
    } catch {
      setNotice("Try again later");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onManage}
        disabled={pending}
        className="rounded-md border border-bg-border bg-bg-elevated px-4 py-2 font-sans text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Opening…" : "Manage subscription"}
      </button>
      {notice ? (
        <span className="font-sans text-[11px] text-text-muted">{notice}</span>
      ) : null}
    </div>
  );
}
