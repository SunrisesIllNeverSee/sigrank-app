/**
 * app/user/[codename]/ProfileBody.tsx — streaming body for the operator profile.
 *
 * V2 (2026-10-10): rebuilt to the approved profile-mock design. Eight tab
 * panels (Overview / Stats / Analysis / Report / Lab / Submissions / Social
 * / Badges) rendered by dedicated profile-v2 components. The 7 parallel
 * fetches are
 * unchanged — this component still streams inside the Suspense boundary in
 * page.tsx so the identity header renders on the critical path.
 *
 * Data map:
 *   overview    → OverviewView    (hero + cascade row + raw row + signal&token + heatmap + records)
 *   stats       → StatsView       (5 raw data tables — no charts)
 *   analysis    → AnalysisView    (scatter + archetype + vs-field + deltas + records)
 *   report      → ReportTabGate   (owner-only)
 *   lab         → LabTabGate      (owner-only)
 *   submissions → SubmissionsView (platform grid + history + timeline + windows)
 *   social      → SocialView      (identity + bio + links + badges + share)
 */

import Link from "next/link";

import {
  getOperatorHistory,
  getOperatorSubmissions,
  getOperatorSnapshotRecords,
  getOperatorWatchCount,
  getOperatorReport,
  getLeaderboard,
  getHallOfSignal,
} from "@/lib/board";
import type { HallRecord } from "@/lib/board";
import { computeFieldAverages } from "@/lib/analytics/field-average";
import { buildArchetypeOf } from "@/lib/analytics/build-archetypes";
import { computeTrophyCounts } from "@/lib/analytics/trophy-counts";
import { computeTierProgress } from "@/lib/analytics/tier-progress";
import type { Operator } from "@/lib/analytics/scoring-types";
import type { LeaderboardRow } from "@/lib/board";
import { JsonLd } from "@/components/seo/JsonLd";
import { operatorProfile } from "@/lib/jsonld";
import { ProfileAuthGate } from "@/components/profile/ProfileAuthGate";
import { ClaimTabGate, ReportTabGate, LabTabGate } from "@/components/profile/ProfileAuthGates";
import { DeferredSplitFlapCard } from "@/components/profile/DeferredSplitFlapCard";
import { ProfileTabsV2 } from "@/components/profile-v2/ProfileTabsV2";
import { OverviewView } from "@/components/profile-v2/OverviewView";
import StatsView from "@/components/profile-v2/StatsView";
import { AnalysisView } from "@/components/profile-v2/AnalysisView";
import { SubmissionsView } from "@/components/profile-v2/SubmissionsView";
import { SocialView } from "@/components/profile-v2/SocialView";
import { BadgesView } from "@/components/profile-v2/BadgesView";

function resolveName(operator: Operator): string {
  return operator.display_name ?? operator.codename;
}

export async function ProfileBody({
  row,
  rawCodename,
}: {
  row: LeaderboardRow;
  rawCodename: string;
}) {
  const { operator, snapshot, telemetry } = row;
  const pending = row.pending ?? false;
  const codename = operator.codename;

  // 7 parallel fetches — all independent after getOperator.
  // getLeaderboard is the heaviest (~2.5MB, memo-cached 3600s).
  // getHallOfSignal is unstable_cache'd at 300s. The rest are operator-scoped.
  const [
    history,
    submissions,
    snapshotRecords,
    operatorReport,
    boardRows,
    hallRecords,
    watchCount,
  ] = await Promise.all([
    getOperatorHistory(codename),
    getOperatorSubmissions(codename),
    getOperatorSnapshotRecords(codename),
    getOperatorReport(operator.operator_id),
    getLeaderboard({ window: "all_time", operatorTotal: true, claimedOnly: true, mode: "all" }),
    getHallOfSignal(),
    getOperatorWatchCount(codename),
  ]);

  // Auth state resolved client-side so this stays ISR-cached.
  const isOwner = false;

  const topPct = Math.max(0, 100 - row.percentile);
  const c = snapshot.cascade;

  const fieldAvg = computeFieldAverages(boardRows);
  const operatorHallNames = new Set<string>([operator.codename]);
  if (operator.display_name) operatorHallNames.add(operator.display_name);
  const operatorRecords: HallRecord[] = hallRecords.filter((r) =>
    operatorHallNames.has(r.operator_codename),
  );

  const ranked = !pending && c && !c.nonCompounding;

  const name = resolveName(operator);

  const isPrivate = operator.profile_visibility === "private";
  const viewerRedacted = isPrivate && !isOwner;
  const displayName = viewerRedacted ? null : operator.display_name;

  const archetype =
    c && !c.nonCompounding
      ? buildArchetypeOf({
          leverage: c.leverage,
          velocity: c.velocity,
          construction: c.construction,
        })
      : null;

  const trophyCounts = ranked
    ? await computeTrophyCounts(
        codename,
        displayName ?? undefined,
        boardRows,
        hallRecords,
      )
    : null;
  const totalTokens = ranked
    ? telemetry.fresh_input + telemetry.output + telemetry.cache_read + telemetry.cache_create
    : 0;
  const tierProgress = ranked
    ? computeTierProgress(snapshot.class_tier, totalTokens)
    : null;

  // ── Pending state panels ──────────────────────────────────────────────────
  const pendingPanel = (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-bg-border bg-bg-surface px-6 py-12 text-center">
      <span className="font-mono text-2xl text-text-dim">Υ</span>
      <p className="font-mono text-sm text-text-primary">Not ranked yet</p>
      <p className="max-w-sm font-sans text-xs leading-relaxed text-text-secondary">
        Your profile is live, but you&rsquo;re not on the board until a verified
        cascade lands. Connect the local agent to submit your token cascade and
        earn a Υ Yield and class.
      </p>
    </div>
  );

  return (
    <>
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



      <ProfileAuthGate codename={operator.codename}>
        {!operator.claimed && <ClaimTabGate codename={operator.codename} />}

        <ProfileTabsV2
          overview={
            <OverviewView
              operator={operator}
              snapshot={snapshot}
              telemetry={telemetry}
              globalRank={row.global_rank}
              topPct={topPct}
              pending={pending}
              ranked={!!ranked}
              archetype={archetype}
              tierProgress={tierProgress}
              trophyCounts={trophyCounts}
              records={operatorRecords}
              watchCount={watchCount}
              boardRows={boardRows}
              history={history}
              fieldAvg={fieldAvg}
            />
          }
          stats={
            pending ? (
              pendingPanel
            ) : (
              <StatsView
                operator={operator}
                snapshot={snapshot}
                telemetry={telemetry}
                globalRank={row.global_rank}
                topPct={topPct}
                ranked={!!ranked}
                history={history}
                fieldAvg={fieldAvg}
                boardRows={boardRows}
                watchCount={watchCount}
              />
            )
          }
          analysis={
            ranked ? (
              <AnalysisView
                operator={operator}
                snapshot={snapshot}
                telemetry={telemetry}
                globalRank={row.global_rank}
                topPct={topPct}
                ranked={!!ranked}
                archetype={archetype}
                fieldAvg={fieldAvg}
                boardRows={boardRows}
                history={history}
                records={operatorRecords}
              />
            ) : undefined
          }
          report={operatorReport ? (
            // Only a public report is serialized into the flight payload —
            // a private report never leaves the server; the owner fetches it
            // through the authenticated route after the auth gate resolves.
            <ReportTabGate
              report={operatorReport.report_visible ? operatorReport : null}
              codename={operator.codename}
              archetype={archetype}
            />
          ) : undefined}
          lab={
            ranked && c ? (
              <LabTabGate
                pillars={{
                  input: telemetry.fresh_input,
                  output: telemetry.output,
                  cacheCreate: telemetry.cache_create,
                  cacheRead: telemetry.cache_read,
                }}
              />
            ) : undefined
          }
          submissions={
            <SubmissionsView
              operator={operator}
              submissions={submissions}
              history={history}
              snapshotRecords={snapshotRecords}
            />
          }
          social={
            <SocialView
              operator={operator}
              snapshot={snapshot}
              isOwner={isOwner}
              records={operatorRecords}
              trophyCounts={trophyCounts}
              scoredSnapshots={snapshotRecords.length}
            />
          }
          badges={
            <BadgesView
              operator={operator}
              snapshot={snapshot}
              records={operatorRecords}
              trophyCounts={trophyCounts}
              tierProgress={tierProgress}
              scoredSnapshots={snapshotRecords.length}
            />
          }
        />
      </ProfileAuthGate>
      {ranked && c && !c.nonCompounding && (
        <details className="ws-profile-share-card"><summary>Operator signature · share card</summary>
        <DeferredSplitFlapCard
          codename={operator.codename}
          name={name}
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
          radarAxes={[]}
          fieldAvg={fieldAvg}
        />
        </details>
      )}

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
    </>
  );
}
