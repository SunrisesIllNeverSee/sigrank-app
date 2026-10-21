/**
 * lib/live/earned-marks.ts — everything an operator has earned, as one flat
 * list for the board's AWARDS & BADGES module (owner 2026-10-21: "not all of
 * my awards and badges show up").
 *
 * Mirrors the derivation behind the profile Badges tab
 * (components/profile-v2/BadgesView.tsx): pixel standing, platform token
 * ladders, ranked metric medals, Hall records, class, identity and the
 * snapshot milestone. The board module used to render only six fixed pixel
 * badges plus three rotating slides, so platform pixels, Hall records and the
 * snapshot milestone never appeared. Pure — no I/O.
 */
import { earnedPixelMarks } from "@/lib/profile/pixel-eligibility";
import { BOARD_SIGIL, hallSigil } from "@/lib/profile/record-artwork";

export interface EarnedMark {
  id: string;
  label: string;
  group: "Pixel badges" | "Records & medals" | "Standing & milestones";
  /** Short qualifier shown beside the label (rank, value, tier). */
  detail: string;
  /** Pixel pattern ("LL./LGK/GGL") for pixel badges. */
  pattern?: string;
  /** Glyph for medal / milestone marks. */
  sigil?: string;
  /** Metal rank 1/2/3 for ranked metric medals. */
  rank?: number;
}

export interface EarnedMarksInput {
  pct: number;
  totalTokens: number;
  verif?: string;
  klass?: string;
  pending?: boolean;
  /** Ranked metric medals (top-3 on a metric board). */
  medals?: { canonId: string; name: string; rank: number; value: string }[];
  hall?: { title: string; value: string; date: string; placeholder?: boolean }[];
  /** Platform token-ladder pixels computed server-side (needs submissions). */
  platformMarks?: { id: string; label: string; detail: string; pattern: string }[];
  scoredSnapshots?: number;
}

export function selectEarnedMarks(i: EarnedMarksInput): EarnedMark[] {
  if (i.pending) return [];
  const out: EarnedMark[] = [];
  /* standing / verified / 10M pixels — same rules as the Badges tab; the
     platform ladder arrives pre-computed (it needs the submissions feed). */
  for (const m of earnedPixelMarks({
    percentile: i.pct,
    processedTokens: i.totalTokens,
    verificationStatus: i.verif,
  })) {
    out.push({ id: m.id, label: m.label, group: "Pixel badges", detail: m.detail, pattern: m.pattern });
  }
  for (const m of i.platformMarks ?? []) {
    out.push({ id: m.id, label: m.label, group: "Pixel badges", detail: m.detail, pattern: m.pattern });
  }
  /* ranked metric records — top-3 only (the API already trims to rank 1-3) */
  for (const r of i.medals ?? []) {
    if (r.rank < 1 || r.rank > 3) continue;
    out.push({
      id: `medal:${r.canonId}:${r.rank}`,
      label: r.name,
      group: "Records & medals",
      detail: `#${r.rank} all-time · ${r.value}`,
      sigil: BOARD_SIGIL[r.canonId]?.s ?? "◆",
      rank: r.rank,
    });
  }
  for (const [k, h] of (i.hall ?? []).filter((x) => !x.placeholder).entries()) {
    out.push({
      id: `hall:${k}:${h.title}`,
      label: h.title,
      group: "Records & medals",
      detail: `Hall record · ${h.value}${h.date ? ` · ${h.date.slice(0, 10)}` : ""}`,
      sigil: hallSigil(h.title),
    });
  }
  if (i.klass) {
    out.push({ id: "class", label: "Class", group: "Standing & milestones", detail: i.klass, sigil: "⬡" });
  }
  if (i.verif === "verified" || i.verif === "audited") {
    out.push({
      id: "identity",
      label: "Identity",
      group: "Standing & milestones",
      detail: i.verif === "audited" ? "AUDITED" : "VERIFIED",
      sigil: "✓",
    });
  }
  if ((i.scoredSnapshots ?? 0) >= 500) {
    out.push({ id: "snapshots500", label: "Snapshot", group: "Standing & milestones", detail: "500TH", sigil: "⌗" });
  }
  return out;
}

/** Compact module summary: per-group counts plus the few most notable marks
 *  (metal medals first, then pixels, then the rest). */
export function summarizeEarnedMarks(marks: EarnedMark[], top = 4) {
  const count = (g: EarnedMark["group"]) => marks.filter((m) => m.group === g).length;
  const weight = (m: EarnedMark) =>
    m.rank ? m.rank : m.group === "Pixel badges" ? 4 : m.group === "Records & medals" ? 5 : 6;
  return {
    total: marks.length,
    pixels: count("Pixel badges"),
    records: count("Records & medals"),
    standing: count("Standing & milestones"),
    top: [...marks].sort((a, b) => weight(a) - weight(b)).slice(0, top),
  };
}
