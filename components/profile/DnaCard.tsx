"use client";

import { useState } from "react";
import type { BuildArchetype } from "@/lib/analytics/build-archetypes";

/**
 * components/profile/DnaCard.tsx — the operator's cascade DNA fingerprint.
 *
 * Derived from the canonical 10-archetype classifier (buildArchetypeOf).
 * Shareable on X/LinkedIn ("I'm a CONVERGENT on SigRank. signalaf.com/user/myname").
 */

export function DnaCard({
  archetype,
  badges,
}: {
  archetype: BuildArchetype;
  badges: {
    earned_this_week: string[];
    in_progress: Array<{
      id: string;
      label: string;
      icon: string;
      progress: number;
      target: number;
      display: string;
    }>;
    collection: string[];
  };
}) {
  const [copied, setCopied] = useState(false);
  const earnedCount = badges.collection.length;
  const inProgressCount = badges.in_progress.length;

  const shareText = `I'm a ${archetype.name} on SigRank. ${archetype.blurb} signalaf.com`;

  const handleShare = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-lg border border-bg-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-[0.06em] text-text-muted">
          Operator DNA
        </h3>
        <button
          type="button"
          onClick={handleShare}
          className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted hover:text-gold transition-colors"
        >
          {copied ? "Copied!" : "Share DNA"}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 font-mono text-sm">
        <div>
          <span className="text-text-muted">Archetype: </span>
          <span className="text-gold">{archetype.name}</span>
        </div>
        <div>
          <span className="text-text-muted">Family: </span>
          <span className="text-text-secondary">{archetype.familyLabel}</span>
        </div>
        <div>
          <span className="text-text-muted">Badges: </span>
          <span className="text-text-secondary">
            {earnedCount} earned, {inProgressCount} in progress
          </span>
        </div>
        <p className="mt-1 text-xs text-text-muted">{archetype.blurb}</p>
      </div>
    </div>
  );
}
