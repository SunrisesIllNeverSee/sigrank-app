import React from "react";
import Link from "next/link";
import { Placeholder } from "@/components/ui/Placeholder";

interface Tier {
  badge: string;
  name: string;
  /** Price node (placeholder — real amounts are env-driven Stripe prices). */
  price: React.ReactNode;
  priceSuffix: string;
  features: string[];
  cta: string;
  ctaHref: string;
  featured?: boolean;
}

/**
 * PricingCards — the launch pitch: Operator (free, always) + Support the build.
 *
 * Owner directive 2026-07-19: no paid tiers, no subscriptions, no "precision
 * tier" promises. The second card is a one-time "pay what helps" donation via
 * Stripe. Server component, static copy. Free-tier features are the REAL
 * launched cascade product.
 */
const TIERS: Tier[] = [
  {
    badge: "FREE",
    name: "Operator",
    price: <Placeholder value="$0" title="Free tier — always free" />,
    priceSuffix: " · always free",
    features: [
      "Submit token telemetry, get ranked instantly",
      "Full cascade layer — Υ Yield, SNR, Leverage, Velocity, 10xDEV",
      "Cascade species + class assignment",
      "Public leaderboard with platform filters",
      "Head-to-head compare on the cascade metrics",
      "Operator profile with the cascade fingerprint",
      "MCP server for Claude Code, Cursor, and any MCP-compatible client",
    ],
    cta: "Start free",
    ctaHref: "/score",
  },
  {
    badge: "SUPPORT",
    name: "Back the build",
    price: (
      <Placeholder
        value="Pay what helps"
        title="One-time contribution via Stripe"
      />
    ),
    priceSuffix: " · one-time, no subscription",
    features: [
      "Support the ongoing build if you find SigRank useful",
      "Help cover server costs and data infrastructure",
      "Keep the corpus verified + independent",
      "No subscriptions, no tiers, no paywalls",
      "The free board stays free — this funds the build",
    ],
    cta: "Support the build",
    ctaHref: "/upgrade",
    featured: true,
  },
];

export function PricingCards() {
  return (
    <section className="my-16">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        ⊙ Tiers
      </div>
      <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
        Free for ranking. Back the build for what&apos;s next.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
        The leaderboard is free and stays free — your cascade metrics, your
        class, your rank, no paywall. If you find SigRank useful, consider a
        one-time contribution to support the build.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={
              "rounded-2xl border p-9 " +
              (t.featured
                ? "border-gold/25 bg-gradient-to-b from-gold/5 to-bg-surface"
                : "border-bg-border-subtle bg-bg-surface")
            }
          >
            <span
              className={
                "inline-block rounded-full px-2.5 py-1 font-mono text-xs font-semibold " +
                (t.featured
                  ? "border border-gold/25 bg-gold/10 text-gold"
                  : "bg-bg-elevated text-text-secondary")
              }
            >
              {t.badge}
            </span>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-text-primary">
              {t.name}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              <strong className="text-base font-semibold text-text-primary">
                {t.price}
              </strong>
              {t.priceSuffix}
            </p>

            <ul className="my-7">
              {t.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 border-b border-bg-border-subtle py-2 text-sm text-text-secondary last:border-b-0"
                >
                  <span className="shrink-0 font-mono text-gold">→</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={t.ctaHref}
              className={
                "block w-full rounded-md py-2.5 text-center text-sm font-semibold transition-colors " +
                (t.featured
                  ? "bg-gold text-bg-base hover:bg-gold/90"
                  : "border border-bg-border text-text-secondary hover:border-bg-border hover:text-text-primary")
              }
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
