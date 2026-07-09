/**
 * lib/challenges/types.ts — shared challenge data types.
 *
 * Used by: ChallengeBar, /compare page, API routes, arena page.
 */

export type ChallengeFormat =
  "throwdown" | "signal_drop" | "bracket_match" | "circle_war";
export type ChallengeStatus =
  "pending" | "active" | "complete" | "expired" | "cancelled";

/** Minimal shape used by the compare page and ChallengeBar. */
export interface ActiveChallenge {
  challenge_id: string;
  status: ChallengeStatus;
  format: ChallengeFormat;
  prompt_brief: string;
  window_open: string; // ISO timestamp
  window_close: string; // ISO timestamp
  challenger_codename: string | null;
  challenged_codename: string | null;
  winner_codename: string | null;
  challenger_score: number | null;
  challenged_score: number | null;
  margin: number | null;
}

/** Five-pillar scores from signal-Areana. */
export interface SignalPillars {
  density: number; // 0–100
  clarity: number;
  fidelity: number;
  brevity: number;
  impact: number;
}

/** Composite = density×0.30 + clarity×0.20 + fidelity×0.20 + brevity×0.15 + impact×0.15 */
export function computeComposite(p: SignalPillars): number {
  return (
    Math.round(
      (p.density * 0.3 +
        p.clarity * 0.2 +
        p.fidelity * 0.2 +
        p.brevity * 0.15 +
        p.impact * 0.15) *
        100,
    ) / 100
  );
}
