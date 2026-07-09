"use client";

import { useState } from "react";

/**
 * components/profile/DnaCard.tsx — the operator's cascade DNA fingerprint.
 *
 * Derived from mode distribution + badge collection. Like a personality test
 * for AI coding style. Shareable on X/LinkedIn ("I'm a Sustained Burner with
 * a 14-day half-life. signalaf.com/user/myname").
 */

const ARCHETYPES: {
  name: string;
  condition: (dist: Record<string, number>) => boolean;
  meaning: string;
}[] = [
  {
    name: "Sustained Burner",
    condition: (d) => (d.MAINTAIN ?? 0) > 0.7,
    meaning:
      "Lives in the cascade. Efficient but may not start new things often.",
  },
  {
    name: "Greenfield Specialist",
    condition: (d) => (d.BUILD ?? 0) > 0.5,
    meaning: "Starts lots of things. May struggle to reach compounding.",
  },
  {
    name: "Editor",
    condition: (d) => (d.EDIT ?? 0) > 0.5,
    meaning: "Polishing-focused. High output, moderate reuse.",
  },
  {
    name: "Debugger",
    condition: (d) => (d.DEBUG ?? 0) > 0.3,
    meaning: "Investigative. High input, low output. May be stuck.",
  },
  {
    name: "Cycle Master",
    condition: (d) => {
      const b = d.BUILD ?? 0,
        e = d.EDIT ?? 0,
        m = d.MAINTAIN ?? 0;
      return b > 0.15 && e > 0.15 && m > 0.15 && b + e + m > 0.6;
    },
    meaning: "Full project arcs. Starts, finishes, repeats.",
  },
];

function classifyArchetype(dist: Record<string, number>): {
  name: string;
  meaning: string;
} {
  for (const a of ARCHETYPES) {
    if (a.condition(dist)) return { name: a.name, meaning: a.meaning };
  }
  return { name: "Operator", meaning: "Working across multiple modes." };
}

export function DnaCard({
  modeDistribution,
  badges,
}: {
  modeDistribution: Record<string, number>;
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
  const archetype = classifyArchetype(modeDistribution);
  const earnedCount = badges.collection.length;
  const inProgressCount = badges.in_progress.length;

  const distText = Object.entries(modeDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([mode, pct]) => `${Math.round(pct * 100)}% ${mode}`)
    .join(", ");

  const shareText = `I'm a ${archetype.name} on SigRank. ${distText}. signalaf.com`;

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
          <span className="text-text-muted">Distribution: </span>
          <span className="text-text-secondary">{distText}</span>
        </div>
        <div>
          <span className="text-text-muted">Badges: </span>
          <span className="text-text-secondary">
            {earnedCount} earned, {inProgressCount} in progress
          </span>
        </div>
        <p className="mt-1 text-xs text-text-muted">{archetype.meaning}</p>
      </div>
    </div>
  );
}
