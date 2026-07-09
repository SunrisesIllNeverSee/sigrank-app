import "server-only";

/**
 * lib/challenges/server.ts — server-side challenge data fetchers.
 *
 * Called from RSC page components (compare, operator profile).
 * Returns null / empty gracefully when Supabase is not configured.
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import type { ActiveChallenge } from "./types";

/**
 * getChallengeBetween — fetch the most recent active or complete challenge
 * between two operators (by codename). Returns null if none found.
 */
export async function getChallengeBetween(
  codeA: string,
  codeB: string,
): Promise<ActiveChallenge | null> {
  const sb = getSupabaseServer();
  if (!sb) return null;

  // Resolve operator IDs
  const { data: ops } = await sb
    .from("operators")
    .select("operator_id, codename")
    .in("codename", [codeA, codeB]);

  if (!ops || ops.length < 2) return null;

  const opA = ops.find((o) => o.codename === codeA);
  const opB = ops.find((o) => o.codename === codeB);
  if (!opA || !opB) return null;

  const { data } = await sb
    .from("challenges")
    .select(
      `
      challenge_id, status, format, prompt_brief,
      window_open, window_close,
      challenger_score, challenged_score, margin,
      challenger:challenger_id(codename),
      challenged:challenged_id(codename),
      winner:winner_id(codename)
    `,
    )
    .in("status", ["active", "complete"])
    .or(
      `and(challenger_id.eq.${opA.operator_id},challenged_id.eq.${opB.operator_id}),` +
        `and(challenger_id.eq.${opB.operator_id},challenged_id.eq.${opA.operator_id})`,
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  // Normalise: make sure challenger/challenged match codeA/codeB order
  // Supabase returns foreign-key joins as arrays when not using .single() on the join.
  type MaybeCodename = { codename: string } | { codename: string }[] | null;
  function firstCodename(v: MaybeCodename): string | null {
    if (!v) return null;
    if (Array.isArray(v)) return v[0]?.codename ?? null;
    return (v as { codename: string }).codename;
  }
  const challCode = firstCodename(data.challenger as MaybeCodename);
  const challdCode = firstCodename(data.challenged as MaybeCodename);
  const winnerCode = firstCodename(data.winner as MaybeCodename);

  // Swap scores if the DB challenger is actually codeB
  const swapped = challCode === codeB;
  return {
    challenge_id: data.challenge_id,
    status: data.status,
    format: data.format,
    prompt_brief: data.prompt_brief,
    window_open: data.window_open,
    window_close: data.window_close,
    challenger_codename: swapped ? challdCode : challCode,
    challenged_codename: swapped ? challCode : challdCode,
    winner_codename: winnerCode,
    challenger_score: swapped ? data.challenged_score : data.challenger_score,
    challenged_score: swapped ? data.challenger_score : data.challenged_score,
    margin: data.margin,
  };
}
