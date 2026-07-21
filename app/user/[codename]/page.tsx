/**
 * app/user/[codename]/page.tsx — the operator profile page (was /operators/[codename], owner 2026-06-22).
 *
 * "The single most important page after the homepage" (site_architecture.md
 * §Operator profile). AUTH_LAUNCH_DIRECTIVES D6: a GitHub-style multi-tab workspace —
 * a persistent identity header (avatar / name / class / rank) over three tabs:
 *
 *   • Stats        — view-only cascade dashboard (KPIs, radars, op-ratio, heat, trend)
 *   • Submissions  — manual project/build showcase (D9 — not yet built; empty state)
 *   • Social       — self-promo identity: handle, location, bio, links
 *
 * RSC: reads the operator + history through the @/lib/data facade (mock fallback when
 * Supabase is unset). The three panels are server-rendered here and handed to the
 * ProfileTabs client island, which only mounts the active one. ScoreBreakdown-style
 * client islands receive plain serializable props resolved here, so RS.xx weights never
 * reach the client.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  getLeaderboard,
  getOperator,
  getOperatorHistory,
  getOperatorSubmissions,
  getOperatorReport,
  getHallOfSignal,
  isOperatorRetired,
} from "@/lib/board";
import type { HallRecord } from "@/lib/board";
import { computeFieldAverages } from "@/lib/analytics/field-average";
import { isOutlierRow } from "@/lib/analytics/outlier-classify";
import { getSessionOperator, getSessionUser } from "@/lib/infra/supabase/auth-server";
import { decodeCodename } from "@/lib/route-params";
import { withOG } from "@/lib/seo";
import type { Operator } from "@/lib/analytics/scoring-types";
import { SignalClassBadge } from "@/components/sigrank";
import { OperatorAvatar } from "@/components/sigrank/OperatorAvatar";
import { CanonId } from "@/components/ui/CanonId";
import { CascadePanel } from "@/components/profile/CascadePanel";
import { SubmissionsGrid } from "@/components/profile/SubmissionsGrid";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { OperatorRecords } from "@/components/profile/OperatorRecords";
import { ClaimTab } from "@/components/profile/ClaimTab";
import { ReportTab } from "@/components/profile/ReportTab";
import dynamic from "next/dynamic";
const LabTab = dynamic(() => import("@/components/profile/LabTab").then((m) => m.LabTab));
const SplitFlapCard = dynamic(() => import("@/components/signature/SplitFlapCard").then((m) => m.SplitFlapCard), {
  loading: () => <div className="h-48 animate-pulse rounded-lg border border-bg-border bg-bg-base/40" />,
});
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ClaimedBadge } from "@/components/claim/ClaimedBadge";
import CascadeRadar from "@/components/charts/CascadeRadar";
import OperatingRatioBar from "@/components/charts/OperatingRatioBar";
import EvolutionLine from "@/components/charts/EvolutionLine";
import KpiTile from "@/components/charts/KpiTile";
import { JsonLd } from "@/components/seo/JsonLd";
import { operatorProfile } from "@/lib/jsonld";
import HeatBar from "@/components/charts/HeatBar";
import { TrackProfileView } from "@/components/analytics/TrackProfileView";

// ISR: revalidate every hour so profile data stays current. The page reads
// no cookies/searchParams (pure public profile), so it's ISR-eligible. The
// data-layer cache (unstable_cache on getOperator etc.) provides the first-tier
// cache; this export makes the CDN hold the rendered page too. On-demand
// revalidation via revalidateTouchedWindows fires on snapshot submit, so the
// 3600s ISR is just a safety net — 600s was over-validating.
export const revalidate = 3600;

/**
 * Resolve the display name for an operator. display_name now carries both the
 * claimed operator's chosen name AND the seed's real handle (public tokscale
 * footprints, migrated from SEED_IDENTITY → Supabase 2026-06-20); otherwise the
 * codename. This mirrors the board's cell so profile and board agree on who is who.
 */
function resolveName(operator: Operator): string {
  // display_name now carries the seed's real handle too (migrated to Supabase
  // 2026-06-20) — one rule covers claimed + seed.
  return operator.display_name ?? operator.codename;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codename: string }>;
}): Promise<Metadata> {
  const { codename: rawCodename } = await params;
  const codename = decodeCodename(rawCodename);
  // Retired operators (opt-out): no metadata (they redirect to the leaderboard).
  if (await isOperatorRetired(codename)) return { title: "SigRank Leaderboard" };
  const row = await getOperator(codename);
  if (!row) return { title: "Operator not found" };
  const name = resolveName(row.operator);
  const c = row.snapshot.cascade;
  const yieldLabel =
    c && !c.nonCompounding
      ? ` · Υ ${c.yield_ >= 1000 ? `${(c.yield_ / 1000).toFixed(1)}K` : c.yield_.toFixed(0)}`
      : "";
  const title = `${name}${yieldLabel}`;
  const description = row.pending
    ? `${name} — an operator on SigRank (not ranked yet).`
    : `${name} — ${row.snapshot.class_tier}, rank #${row.global_rank} on the SigRank leaderboard.`;
  return withOG({
    title,
    description,
    path: `/user/${rawCodename}`,
  });
}

/** One labeled row in the identity / stats rail. */
function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
        {label}
      </span>
      <span className="font-mono text-sm text-text-primary">{children}</span>
    </div>
  );
}

export default async function OperatorProfilePage({
  params,
}: {
  params: Promise<{ codename: string }>;
}) {
  const { codename: rawCodename } = await params;
  const codename = decodeCodename(rawCodename); // see decodeCodename — fixes "·"/space seed codenames 404
  // Retired operators (opt-out): redirect to the leaderboard. No profile page,
  // no 404 — they stay on the board with their tokens but aren't clickable.
  if (await isOperatorRetired(codename)) redirect("/leaderboard");
  const row = await getOperator(codename);
  if (!row) notFound();

  const { operator, snapshot, telemetry } = row;
  const pending = row.pending ?? false;
  const history = await getOperatorHistory(codename);
  // FIX I3: every (platform × window) submission for the Submissions-tab grid.
  const submissions = await getOperatorSubmissions(codename);
  // Cascade Report System Phase 1: fetch the operator's latest report block.
  // Returns null if no report exists (operator hasn't submitted with sigrank@0.16.0+).
  const operatorReport = await getOperatorReport(operator.operator_id);

  // Owner check: is the signed-in user viewing their own profile?
  // Used to show the privacy toggle on the Report tab and interactive sliders on the Lab tab.
  const session = await getSessionOperator();
  const isOwner = !!(session && session.codename === operator.codename);
  // For the ClaimTab: is the viewer signed in (auth user exists), and do they
  // already have a linked operator? getSessionOperator returns null both when
  // not signed in AND when signed in but not linked — so we check getSessionUser
  // separately to distinguish the two states.
  const sessionUser = await getSessionUser();

  const topPct = Math.max(0, 100 - row.percentile);

  // ── Chart-kit data, all derived from real telemetry + cascade fields ──────
  const c = snapshot.cascade;

  // Field averages for the share card: every "average operator" reference on
  // the card (AVG USER column, radar field polygon, op-ratio footer) comes
  // from the live board, so they always agree and move with the field.
  // (owner 2026-07-14: filtered to Human Center of Mass — outliers/bots excluded.)
  const boardRows = await getLeaderboard();
  const humanRows = boardRows.filter((r) => !isOutlierRow(r));
  const fieldAvg = computeFieldAverages(humanRows);

  // Hall of Signal records for this operator — fed to the profile JSON-LD
  // (achievement schema). OperatorRecords fetches the Hall again internally
  // (it's cached via unstable_cache), so no duplicate DB hit.
  const hallRecords = await getHallOfSignal();
  const operatorHallNames = new Set<string>([operator.codename]);
  if (operator.display_name) operatorHallNames.add(operator.display_name);
  const operatorRecords: HallRecord[] = hallRecords.filter((r) =>
    operatorHallNames.has(r.operator_codename),
  );

  // Competitive deltas (SHARED_DESIGN_DECISIONS §3): delta from field average
  // + delta from top operator. Turns the metric into a race, not just a score.
  const topOperator = humanRows.find(
    (r) => r.snapshot.cascade && !r.snapshot.cascade.nonCompounding,
  );
  const opYield = c && !c.nonCompounding ? c.yield_ : null;
  const fieldAvgYield = fieldAvg.yield_;
  const topYield = topOperator?.snapshot.cascade?.yield_ ?? null;
  const deltaFromAvg =
    opYield != null && fieldAvgYield != null && fieldAvgYield > 0
      ? ((opYield - fieldAvgYield) / fieldAvgYield) * 100
      : null;
  const deltaFromTop =
    opYield != null && topYield != null && topYield > 0
      ? ((topYield - opYield) / topYield) * 100
      : null;

  const ranked = !pending && c && !c.nonCompounding;

  // Score trajectory: real history points only. When a single snapshot exists
  // we render a one-point series and label it honestly (no fabricated trend).
  // history is ascending-by-date from getOperatorHistory. (SIGNA is parked for
  // launch — labeled neutrally as the score trajectory rather than SIGNA RATE.)
  const evolutionPoints = history.map((h) => ({
    date: h.date.slice(5), // MM-DD
    value: h.signa_rate,
  }));
  const evolutionLabel =
    evolutionPoints.length > 1
      ? "Score trajectory"
      : "Score trajectory (single snapshot — no trend yet)";

  // Cascade fingerprint radar: 6 axes from the Υ-layer, each scaled to a
  // sensible display max (matches the species-classification thresholds).
  const radarAxes = c
    ? [
        { label: "SNR", value: c.snr, max: 1 },
        { label: "Velocity", value: c.velocity, max: 50 },
        { label: "Leverage", value: c.leverage, max: 200 },
        { label: "10xDEV", value: c.dev10x ?? 0, max: 5 },
        { label: "Scale V", value: c.scaleV, max: 9 },
        { label: "Efficiency", value: c.efficiency, max: 5 },
      ]
    : [];

  // Raw-data radar (owner 2026-06-24): the four raw pillars + total, each self-normalized
  // by the max across them so the SHAPE of the fuel reads at a glance (input-heavy vs
  // output-heavy vs cache-heavy) — the companion to the derived-cascade radar above.
  const rawMax = Math.max(
    telemetry.fresh_input,
    telemetry.output,
    telemetry.cache_read,
    telemetry.cache_create,
    1,
  );
  const rawRadarAxes = [
    { label: "Input", value: telemetry.fresh_input, max: rawMax },
    { label: "Output", value: telemetry.output, max: rawMax },
    { label: "Cache R", value: telemetry.cache_read, max: rawMax },
    { label: "Cache W", value: telemetry.cache_create, max: rawMax },
  ];

  // Per-window Υ-layer heat rows: each cascade ratio as a width (vs its display
  // ceiling) with heat tracking how "hot" the operator runs on that axis. The
  // `display` field carries the human-readable raw value for the row formatter.
  type HeatRow = {
    label: string;
    width: number;
    heat: number;
    display: string;
  };
  const heatRows: HeatRow[] = c
    ? [
        {
          label: "SNR",
          width: c.snr,
          heat: c.snr,
          display: `${(c.snr * 100).toFixed(0)}%`,
        },
        {
          label: "Velocity",
          width: Math.min(1, c.velocity / 50),
          heat: Math.min(1, c.velocity / 50),
          display: c.velocity.toFixed(1),
        },
        {
          label: "Leverage",
          width: Math.min(1, c.leverage / 200),
          heat: Math.min(1, c.leverage / 200),
          display: c.leverage.toFixed(1),
        },
        {
          label: "Efficiency",
          width: Math.min(1, c.efficiency / 5),
          heat: Math.min(1, c.efficiency / 5),
          display: c.efficiency.toFixed(2),
        },
      ]
    : [];

  const name = resolveName(operator);
  const hasDisplayName = name !== operator.codename;
  // Outlier detection (owner 2026-07-14): red asterisk on profile header.
  const outlier = !pending && c && !c.nonCompounding ? isOutlierRow(row) : false;

  // Profile visibility gate (migration 0021, owner 2026-07-16: "private user
  // name... control who sees your profile"). When the operator has set their
  // profile to 'private' AND the viewer is NOT the owner, redact the identity
  // fields — only codename + computed metrics (rank, yield, class) remain
  // visible. The owner always sees their own full profile.
  const isPrivate = operator.profile_visibility === "private";
  const viewerRedacted = isPrivate && !isOwner;
  const displayName = viewerRedacted ? null : operator.display_name;
  const handle_ = viewerRedacted ? null : operator.handle;
  const avatarUrl = viewerRedacted ? null : operator.avatar_url;
  const bio_ = viewerRedacted ? null : operator.bio;
  const location_ = viewerRedacted ? null : operator.location;
  const links_ = viewerRedacted ? null : operator.links;
  const nameShown = viewerRedacted ? operator.codename : name;

  const hasLinks = Boolean(
    links_ && (links_.github || links_.site || links_.x),
  );
  const hasSocial = Boolean(
    location_ || bio_ || hasLinks || handle_,
  );

  // ── Stats tab: a "not ranked yet" notice when there's no cascade data, else
  //    the operational stats + full cascade dashboard. ────────────────────────
  const pendingPanel = (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-bg-border bg-bg-surface px-6 py-12 text-center">
      <span className="font-mono text-2xl text-text-dim">Υ</span>
      <p className="font-mono text-sm text-text-primary">Not ranked yet</p>
      <p className="max-w-sm font-sans text-xs leading-relaxed text-text-secondary">
        Your profile is live, but you’re not on the board until a verified
        cascade lands. Connect the local agent to submit your token cascade and
        earn a Υ Yield and class.
      </p>
    </div>
  );

  const rankedStatsPanel = (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-bg-border bg-bg-surface p-4 sm:grid-cols-4">
        <Stat label="Global rank">#{row.global_rank}</Stat>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
            Percentile
          </span>
          <span className="font-mono text-sm text-text-primary">
            Top {topPct.toFixed(2)}%
          </span>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${topPct}%` }}
            />
          </div>
        </div>
        <Stat label="Platform">{operator.primary_domain}</Stat>
        <Stat label="Account age">{operator.account_age_days} days</Stat>
        {/* "turns" not "messages" — token-era vocab (a turn = one exchange).
            DB column stays total_messages_lifetime; label only (owner 2026-06-19). */}
        <Stat label="Lifetime turns">
          {operator.total_messages_lifetime.toLocaleString("en-US")}
        </Stat>
      </div>

      {/* Competitive deltas (SHARED_DESIGN_DECISIONS §2-3): "rank, compare,
          win, improve" language. Shows how the operator stacks up against
          the field average and the top operator — turns the metric into a race. */}
      {ranked && (deltaFromAvg != null || deltaFromTop != null) && (
        <div className="flex flex-wrap gap-4 rounded-lg border border-bg-border bg-bg-surface p-4">
          {deltaFromAvg != null && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
                vs. field average
              </span>
              <span
                className={`font-mono text-sm ${deltaFromAvg >= 0 ? "text-gold" : "text-text-secondary"}`}
              >
                {deltaFromAvg >= 0 ? "▲" : "▼"} {Math.abs(deltaFromAvg).toFixed(1)}%{" "}
                {deltaFromAvg >= 0 ? "above" : "below"} average
              </span>
            </div>
          )}
          {deltaFromTop != null && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
                vs. top operator
              </span>
              <span className="font-mono text-sm text-text-secondary">
                {deltaFromTop > 0 ? "▼" : "▲"} {Math.abs(deltaFromTop).toFixed(1)}%{" "}
                {deltaFromTop > 0 ? "below" : "at"} top
              </span>
            </div>
          )}
        </div>
      )}

      <CascadePanel cascade={snapshot.cascade ?? null} />

      {/* Cascade fingerprint dashboard — chart-kit, locked theme. All values
          derived from the operator's real cascade (Υ-layer) + four token
          pillars. Renders only when cascade telemetry exists (Claude path);
          non-compounding operators get the CascadePanel notice above instead. */}
      {c && !c.nonCompounding && (
        <section className="flex flex-col gap-4 rounded-lg border border-bg-border bg-bg-surface p-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
            Cascade fingerprint
            <CanonId id="Y.01" title="Yield metric — CANON §IV" />
          </h3>

          {/* KPI strip — the cascade pillars as headline tiles. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiTile
              label="Υ Yield"
              glyph="Υ"
              value={
                c.yield_ >= 1_000
                  ? `${(c.yield_ / 1_000).toFixed(1)}K`
                  : c.yield_.toFixed(1)
              }
              accent
            />
            <KpiTile label="SNR" value={`${(c.snr * 100).toFixed(1)}%`} />
            <KpiTile
              label="Velocity"
              value={
                c.velocity >= 10 ? c.velocity.toFixed(1) : c.velocity.toFixed(2)
              }
            />
            <KpiTile
              label="Leverage"
              value={
                c.leverage >= 1_000
                  ? `${(c.leverage / 1_000).toFixed(1)}K`
                  : c.leverage.toFixed(1)
              }
            />
            <KpiTile
              label="10xDEV"
              glyph="⚡"
              value={c.dev10x !== null ? c.dev10x.toFixed(2) : "—"}
              accent={c.dev10x !== null && c.dev10x >= 3.0}
            />
            <KpiTile label="Scale V" value={c.scaleV.toFixed(2)} />
            <KpiTile label="$ / 1M" value={`$${c.costPerMillion.toFixed(2)}`} />
            <KpiTile label="Efficiency" value={`${c.efficiency.toFixed(2)}×`} />
            {/* Op Ratio (Y.09) — completes the canonical METRICS-9 display set (owner 2026-06-22). */}
            <KpiTile label="Op Ratio" value={c.opRatio} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Two radars: derived cascade shape + raw-pillar shape (owner 2026-06-24). */}
            <div className="flex flex-col items-center gap-5">
              <div className="flex flex-col items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
                  Cascade fingerprint
                </span>
                <CascadeRadar values={radarAxes} size={260} />
                <p className="text-center font-sans text-[11px] leading-snug text-text-muted">
                  The derived Υ-layer shape, each axis scaled to its display
                  range.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
                  Raw fuel
                </span>
                <CascadeRadar values={rawRadarAxes} size={260} />
                <p className="text-center font-sans text-[11px] leading-snug text-text-muted">
                  The four raw pillars, normalized to the largest — the shape of
                  the fuel.
                </p>
              </div>
            </div>

            {/* Operating ratio + per-axis heat. */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
                  Operating ratio · {c.opRatio}
                </span>
                <OperatingRatioBar
                  cacheRead={telemetry.cache_read}
                  cacheCreate={telemetry.cache_create}
                  input={telemetry.fresh_input}
                  output={telemetry.output}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
                  Υ-layer intensity
                </span>
                <HeatBar rows={heatRows} />
              </div>
            </div>
          </div>

          {/* SIGNA RATE evolution — real history only, honestly labeled. */}
          <div className="flex flex-col gap-2">
            <EvolutionLine
              points={evolutionPoints}
              label={evolutionLabel}
              width={720}
              height={180}
            />
          </div>
        </section>
      )}
    </div>
  );

  // ── Submissions tab: every verified (platform × window) submission (FIX I3) ──
  // The grid renders once the operator has any verified submission; until then the
  // dashed placeholder explains where they'll appear.
  const submissionsPanel =
    submissions.length > 0 ? (
      <SubmissionsGrid submissions={submissions} />
    ) : (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-bg-border bg-bg-surface px-6 py-12 text-center">
        <span className="font-mono text-2xl text-text-dim">◈</span>
        <p className="font-mono text-sm text-text-primary">
          No submissions yet
        </p>
        <p className="max-w-sm font-sans text-xs leading-relaxed text-text-secondary">
          Verified cascade submissions feed the leaderboard via the local agent.
          Once you submit, every platform × window you run will appear here as a
          grid.
        </p>
      </div>
    );

  // ── Social tab: the self-promo identity surface ────────────────────────────
  const socialPanel = (
    <div className="flex flex-col gap-5 rounded-lg border border-bg-border bg-bg-surface p-5">
      {viewerRedacted ? (
        <p className="font-sans text-sm text-text-secondary">
          This operator&apos;s profile is private. Only their codename, rank,
          and computed metrics are visible.
        </p>
      ) : hasSocial ? (
        <>
          {handle_ && <Stat label="Handle">@{handle_}</Stat>}
          {location_ && (
            <Stat label="Location">{location_}</Stat>
          )}
          {bio_ && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
                About
              </span>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                {bio_}
              </p>
            </div>
          )}
          {hasLinks && links_ && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
                Links
              </span>
              <div className="flex flex-wrap gap-3">
                {links_.github && (
                  <a
                    href={`https://github.com/${links_.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-text-secondary transition-colors hover:text-text-primary"
                  >
                    github
                  </a>
                )}
                {links_.x && (
                  <a
                    href={`https://x.com/${links_.x}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-text-secondary transition-colors hover:text-text-primary"
                  >
                    x.com
                  </a>
                )}
                {links_.site && (
                  <a
                    href={links_.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-text-secondary transition-colors hover:text-text-primary"
                  >
                    site
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="font-sans text-sm text-text-secondary">
          {operator.claimed
            ? "No profile details yet — add a handle, location, bio, and links from your profile editor."
            : "This operator hasn’t added a bio, location, or links."}
        </p>
      )}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <JsonLd
        data={operatorProfile({
          codename: operator.codename,
          display_name: displayName,
          path: `/user/${rawCodename}`,
          classTier: snapshot.class_tier,
          globalRank: row.global_rank,
          pending,
          records: operatorRecords,
        })}
      />
      <TrackProfileView codename={operator.codename} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/board/all"
          className="font-mono text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          ← Leaderboard
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/compare?a=${encodeURIComponent(operator.codename)}`}
            className="rounded-md border border-bg-border px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            Compare →
          </a>
          {/* "Compare against me" — shows when a signed-in operator is viewing
              someone else's profile (owner 2026-07-16: "on every profile show be a
              compare again me butten"). Links to /compare with the viewer as A and
              the profile operator as B. Hidden when viewing your own profile. */}
          {session && session.codename !== operator.codename && (
            <a
              href={`/compare?a=${encodeURIComponent(session.codename)}&b=${encodeURIComponent(operator.codename)}`}
              className="rounded-md border border-text-accent/40 bg-text-accent/10 px-3 py-1.5 font-mono text-xs text-text-accent transition-colors hover:bg-text-accent/20"
            >
              ⚔ Compare against me
            </a>
          )}
          {/* Claimed operators show a badge. The old pay-to-claim CTA was removed
              (HARDENING_0625 §2): claiming is free + automatic on login, and seed
              operators are never user-claimable (identity-takeover risk). */}
          {operator.claimed && <ClaimedBadge claimed={operator.claimed} />}
          {/* Owner-only "Edit profile" modal — renders nothing for other viewers. */}
          <ProfileEditModal codename={operator.codename} />
        </div>
      </div>

      {/* Persistent identity header (GitHub-profile-style banner). */}
      <header className="flex flex-col gap-4 rounded-lg border border-bg-border bg-bg-surface p-5 sm:flex-row sm:items-center sm:gap-5 sm:w-fit">
        <OperatorAvatar src={avatarUrl} alt={nameShown} size={64} />
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
              {nameShown}
              {outlier && (
                <span
                  title="Outlier — excluded from Human Center of Mass"
                  className="ml-1 text-red-500"
                >
                  *
                </span>
              )}
            </h1>
            {pending ? (
              <span className="rounded-md border border-bg-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-text-muted">
                Unranked
              </span>
            ) : outlier ? (
              <span className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-red-400">
                Outlier
              </span>
            ) : (
              <SignalClassBadge signalClass={snapshot.class_tier} />
            )}
            {viewerRedacted && (
              <span className="rounded-md border border-bg-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-text-muted">
                🔒 Private
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-xs text-text-muted">
            {hasDisplayName && !viewerRedacted && <span>{operator.codename}</span>}
            {handle_ && (
              <span className="text-text-secondary">@{handle_}</span>
            )}
            {pending ? (
              <span>No cascade data yet</span>
            ) : (
              <>
                <span>Rank #{row.global_rank}</span>
                <span>Top {topPct.toFixed(2)}% of the field</span>
                <span>{snapshot.class_tier}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Split-flap departures board — the operator's stats as a Solari board.
          Each character flips through glyphs and lands on its value. Loops.
          Only shown for ranked operators with cascade data. */}
      {ranked && c && !c.nonCompounding && (
        <SplitFlapCard
          codename={operator.codename}
          name={nameShown}
          yieldValue={c.yield_}
          classTier={snapshot.class_tier}
          platform={operator.primary_domain}
          inputTokens={telemetry.fresh_input}
          outputTokens={telemetry.output}
          cacheRead={telemetry.cache_read}
          cacheCreate={telemetry.cache_create}
          snr={c.snr}
          leverage={c.leverage}
          velocity={c.velocity}
          dev10x={c.dev10x}
          scaleV={c.scaleV}
          efficiency={c.efficiency}
          costPerMillion={c.costPerMillion}
          opRatio={c.opRatio}
          cascadeStr={c.cascadeStr}
          radarAxes={radarAxes}
          fieldAvg={fieldAvg}
        />
      )}

      {/* Hall of Signal — where this operator ranks on every board. Renders
          only if the operator is in the top 10 on at least one metric. Uses
          the same boardRows already fetched for field averages — no extra DB
          call. Placed above the tabs so prestige is visible immediately. */}
      <OperatorRecords
        codename={operator.codename}
        display_name={displayName ?? undefined}
        boardRows={boardRows}
      />

      {/* Claim this profile — shown only on unclaimed seeded profiles. Lets
          the real operator verify ownership (via exact tokscale token count)
          and take over the profile. Hidden once claimed. */}
      {!operator.claimed && (
        <ClaimTab
          codename={operator.codename}
          isSignedIn={!!sessionUser}
          hasOperator={!!session}
        />
      )}

      <ProfileTabs
        stats={pending ? pendingPanel : rankedStatsPanel}
        report={<ReportTab report={operatorReport} isOwner={isOwner} />}
        lab={
          ranked && c ? (
            <LabTab
              pillars={{
                input: telemetry.fresh_input,
                output: telemetry.output,
                cacheCreate: telemetry.cache_create,
                cacheRead: telemetry.cache_read,
              }}
              isOwner={isOwner}
            />
          ) : undefined
        }
        submissions={submissionsPanel}
        social={socialPanel}
      />

      {/* ── Cross-links to SEO/AEO/GEO pages ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Learn more:{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield (Υ) Metric
          </Link>
          {" · "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-improve-your-yield"
            className="text-gold underline underline-offset-2"
          >
            How to Improve Your Yield
          </Link>
        </p>
      </section>
    </div>
  );
}
