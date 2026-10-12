/**
 * app/s/[codename]/page.tsx — the canonical share landing surface
 * `signalaf.com/s/<codename>` (Phase-2B WS-5).
 *
 * Canonical semantics (LOCKED, owner 2026-10-05 / PHASE2B plan):
 *   - /s/<codename> is the SOCIAL/OG surface — never a second indexable
 *     profile. It ALWAYS emits `robots: noindex, follow` and
 *     `rel=canonical → /user/<codename>` regardless of indexing-policy
 *     eligibility, so Google never sees two indexable operator pages.
 *   - og:url → the /s/ URL itself; og:image/twitter:image →
 *     /s/<codename>/card.png (the sibling ImageResponse route).
 *   - Slug = API codename verbatim — no normalization.
 *   - Index-ineligible operators still 200 + noindex (they're shareable);
 *     retired/privacy-suppressed operators follow the /user/ contract
 *     exactly: retired → redirect("/leaderboard"), unknown → notFound().
 *   - The verification mark binds to operators.verification_status —
 *     never emitted unconditionally (see signalCardData).
 *
 * The card itself renders as <img src="/s/<codename>/card.png"> — the same
 * bytes socials fetch — so the page preview can never diverge from the OG
 * image, and the PNG stays responsive for free. An HTML summary below the
 * card carries the same facts as selectable text.
 *
 * revalidate = 3600 matches the live-board cadence: the card is a board-state
 * snapshot, and /s/ is not in revalidateTouchedWindows()' bust set, so the
 * TTL is the freshness bound (data-layer caches still refresh at 90–300s).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  getIndexableOperatorRows,
  getOperator,
  getOperatorHistory,
  isOperatorRetired,
} from "@/lib/board";
import { decodeCodename } from "@/lib/route-params";
import { SITE_ORIGIN, withOG } from "@/lib/seo";
import { signalCardData } from "@/components/share/OperatorSignalCard";
import { ProfileShareCard } from "@/components/share/ProfileShareCard";

// ISR: share surfaces re-render at most once/hour per codename (see header).
export const revalidate = 3600;

/** On-demand ISR: no share pages prerendered at build; each is generated on
 *  first visit then cached for `revalidate` seconds (same contract as /user). */
export function generateStaticParams() {
  return [];
}

/** Live-field denominator for the rank line + description — claimed
 *  operators with at least one snapshot (the indexing-policy population).
 *  Non-fatal: a failure just drops the "/ N" fragment. */
async function liveFieldCount(): Promise<number | null> {
  try {
    const rows = await getIndexableOperatorRows();
    const n = rows.filter((r) => r.has_metric_snapshot).length;
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}

function sharePath(codename: string): string {
  // encodeURIComponent matches the sitemap/profile canonical encoding — the
  // og:url and canonical link stay byte-identical to how /user/ self-canonicals.
  return `/s/${encodeURIComponent(codename)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codename: string }>;
}): Promise<Metadata> {
  const { codename: rawCodename } = await params;
  const codename = decodeCodename(rawCodename); // pages get the encoded segment — see lib/route-params
  // Retired operators (opt-out): no share metadata — matches /user/.
  if (await isOperatorRetired(codename)) return { title: "SigRank Leaderboard" };
  const row = await getOperator(codename);
  if (!row)
    return {
      title: "Operator not found",
      robots: { index: false, follow: true },
    };

  const population = await liveFieldCount();
  const d = signalCardData(row, null, population);
  const sPath = sharePath(row.operator.codename);

  const title = d.topPct != null
    ? `${d.name} — TOP ${d.topPct}% OF AI OPERATORS`
    : `${d.name} — AI OPERATOR ON SIGRANK`;

  const trust =
    row.operator.verification_status === "audited"
      ? "audit-verified token telemetry"
      : row.operator.verification_status === "verified"
        ? "verified signed telemetry"
        : "token-cascade telemetry";
  const rankDesc = d.rankLine.replace(/^SIGNAL RANK/, "Signal Rank");
  const description = d.topPct != null
    ? `${rankDesc} · Υ ${d.rows[0].value} · ${d.archetype ?? d.classTier} · ${trust}`
    : `${d.name} — an AI operator on SigRank. Token-cascade telemetry; rank pending.`;

  const meta = withOG({
    title,
    description,
    path: sPath,
    ogImage: {
      url: `${sPath}/card.png`,
      width: 1200,
      height: 630,
      alt: `${d.name} — SigRank operator signal card`,
    },
  });
  return {
    ...meta,
    // LOCKED: /s/ is the social surface — canonical identity stays /user/.
    alternates: { canonical: `/user/${encodeURIComponent(row.operator.codename)}` },
    // LOCKED: always noindex,follow — regardless of indexing-policy eligibility.
    robots: { index: false, follow: true },
  };
}

export default async function ShareOperatorPage({
  params,
}: {
  params: Promise<{ codename: string }>;
}) {
  const { codename: rawCodename } = await params;
  const codename = decodeCodename(rawCodename);

  // Same parallel fetch + opt-out contract as /user/[codename].
  const [retired, row] = await Promise.all([
    isOperatorRetired(codename),
    getOperator(codename),
  ]);
  // Retired operators (opt-out): no share page — match /user/ exactly.
  if (retired) redirect("/leaderboard");
  if (!row) notFound();

  const [history, population] = await Promise.all([
    getOperatorHistory(codename, { limit: 12 }).catch(() => null),
    liveFieldCount(),
  ]);
  const d = signalCardData(row, history, population);
  const sPath = sharePath(row.operator.codename);
  const shareUrl = `${SITE_ORIGIN}${sPath}`;
  const profilePath = `/user/${encodeURIComponent(row.operator.codename)}`;
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  /* Owner 2026-10-06: GENERATE SHARE CARD opens a PAGE OF CARDS — three
     distinct designs + a share target per platform (LinkedIn, X,
     Facebook, Gmail/email, GitHub embed). The CONNECTED slot gates on a
     linked platform account — board-side TODO notes the wiring. */
  const xShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${d.name} — ${d.rankLine}`)}`;
  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const mailShare = `mailto:?subject=${encodeURIComponent(`${d.name} — SigRank signal`)}&body=${encodeURIComponent(shareUrl)}`;
  const rankMatch = d.rankLine.match(/#([\d,]+)/);
  const rankNum = rankMatch ? parseInt(rankMatch[1].replace(/,/g, ""), 10) : null;
  const ghEmbed = `[![${d.name} — SigRank signal](${SITE_ORIGIN}${sPath}/card.png)](${shareUrl})`;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] flex-col justify-center py-10">
      {/* Provenance caption — mirrors the card footer (same builder). */}
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
        {d.provenance}
        {d.pending ? "" : " · LIVE FIELD"}
      </p>

      {/* The share card — the actual card.png bytes, so what you see is what
          LinkedIn/X/Slack render. */}
      <img
        src={`${sPath}/card.png`}
        width={1200}
        height={630}
        alt={`${d.name} — SigRank operator signal card: ${d.rankLine}`}
        className="h-auto w-full rounded-[14px] border border-bg-border"
      />

      {/* --- Card set (owner 2026-10-07: use the REAL designed cards) ---
          1 FLAGSHIP — the OG card.png above (what socials unfurl)
          2 OUTREACH — /api/outreach-card PNG (gold/black + hall medals)
          3 INTERACTIVE — ProfileShareCard: share / preview / download
          4 CONNECTED — platform badge cards gate on a linked account */}
      <div className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          Card 02 · Outreach — GitHub issues / DMs
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element --
            API-rendered PNG card; shows exactly the bytes it serves */}
        <img
          src={`/api/outreach-card/${encodeURIComponent(row.operator.codename)}`}
          width={1200}
          height={630}
          alt={`${d.name} — SigRank outreach card`}
          className="mt-2 h-auto w-full rounded-[14px] border border-bg-border"
        />
      </div>

      <div className="mt-6 rounded-[14px] border border-bg-border bg-bg-surface p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          Card 03 · Interactive — copy link / preview / download PNG
        </p>
        <div className="mt-3">
          <ProfileShareCard
            codename={row.operator.codename}
            name={d.name}
            handle={d.handleOrPlatform}
            signalClass={d.classTier}
            rank={rankNum}
            topPct={d.topPct}
            metrics={d.rows.slice(0, 3).map((r) => ({
              label: r.label,
              value: r.value,
              share:
                r.spark && r.spark.length > 1
                  ? Math.min(
                      1,
                      (r.spark[r.spark.length - 1] ?? 0) /
                        Math.max(...r.spark, 1),
                    )
                  : 0.5,
            }))}
          />
        </div>
      </div>

      <div className="mt-4 rounded-[14px] border border-dashed border-bg-border p-4 opacity-70">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          Card 04 · Platform badges — connect an account to unlock
        </p>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-text-secondary">
          GitHub / X / LinkedIn / Facebook / email badge cards render here
          once a platform account is linked.
        </p>
      </div>

      {/* Platform share targets — one row per surface. GitHub gets the
          embed snippet (card.png into a README), Gmail goes through
          mailto, X/Facebook through their share intents. */}
      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <a href={linkedInShare} target="_blank" rel="noopener noreferrer" className="rounded-md border border-bg-border px-3 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary">LinkedIn ↗</a>
        <a href={xShare} target="_blank" rel="noopener noreferrer" className="rounded-md border border-bg-border px-3 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary">X ↗</a>
        <a href={fbShare} target="_blank" rel="noopener noreferrer" className="rounded-md border border-bg-border px-3 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary">Facebook ↗</a>
        <a href={mailShare} className="rounded-md border border-bg-border px-3 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary">Email ↗</a>
        <code className="rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 text-[10px] text-text-muted">
          github: {ghEmbed}
        </code>
      </div>

      {/* Identity caption + canonical pointer (mirrors share-live/*.html). */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
        <span>
          {d.name}
          {d.handleOrPlatform ? ` · @${d.handleOrPlatform}` : ""}
        </span>
        <span>og:image → {sPath}/card.png</span>
      </div>

      {/* Selectable summary of the card facts — the image above carries the
          design, this carries the data for anyone who needs it as text. */}
      <p className="mt-6 font-mono text-xs leading-relaxed tracking-[0.08em] text-text-secondary">
        {d.rankLine}
        {d.movement7d != null && d.movement7d !== 0 && (
          // prototype --up/--dn (#34d399/#f87171); no Tailwind token exists.
          <span style={{ color: d.movement7d > 0 ? "#34d399" : "#f87171" }}>
            {` · ${d.movement7d > 0 ? "▲" : "▼"} ${Math.abs(d.movement7d)} 7D`}
          </span>
        )}
        {" · "}
        {d.classTier}
        {d.archetype ? ` · ${d.archetype}` : ""}
        {" · Υ "}
        {d.rows[0].value}
      </p>

      {/* Actions — the canonical profile is the real identity surface; the
          share URL is for posting. */}
      <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs">
        <Link
          href={profilePath}
          className="rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 text-text-primary transition-colors hover:bg-bg-hover hover:border-gold/50"
        >
          View full operator profile →
        </Link>
        <a
          href={linkedInShare}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-bg-border px-3 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          Share on LinkedIn ↗
        </a>
        <Link
          href="/board/all"
          className="px-1.5 py-1.5 text-text-muted transition-colors hover:text-text-secondary"
        >
          ← Leaderboard
        </Link>
      </div>
    </div>
  );
}
