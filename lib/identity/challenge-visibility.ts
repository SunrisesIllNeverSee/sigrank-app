import "server-only";

/**
 * Challenge routes read through a service-capable client, so codenames of
 * non-public operators must be filtered explicitly (the operators_public view
 * still returns codename for private rows; only profile_visibility gates it).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolve a codename to an operator_id only if the operator is public. */
export async function resolvePublicOperatorId(
  sb: SupabaseClient,
  codename: string,
): Promise<string | null> {
  const { data } = await sb
    .from("operators_public")
    .select("operator_id")
    .eq("codename", codename)
    .eq("profile_visibility", "public")
    .maybeSingle();
  return (data as { operator_id?: string } | null)?.operator_id ?? null;
}

/** Subset of `codenames` belonging to public operators. */
export async function publicCodenameSet(
  sb: SupabaseClient,
  codenames: Array<string | null | undefined>,
): Promise<Set<string>> {
  const uniq = [...new Set(codenames.filter((c): c is string => !!c))];
  if (uniq.length === 0) return new Set();
  const { data } = await sb
    .from("operators_public")
    .select("codename")
    .in("codename", uniq)
    .eq("profile_visibility", "public");
  return new Set(((data ?? []) as Array<{ codename: string }>).map((r) => r.codename));
}

type Embed =
  | { codename?: string | null }
  | Array<{ codename?: string | null }>
  | null
  | undefined;

export function embedCodename(e: Embed): string | null {
  const o = Array.isArray(e) ? e[0] : e;
  return (o && typeof o === "object" ? o.codename : null) ?? null;
}

/**
 * Redact an operator embed: keep only a public codename, never operator_id
 * or other columns. Non-public → null.
 */
export function redactEmbed(e: Embed, pub: Set<string>): { codename: string } | null {
  const c = embedCodename(e);
  return c && pub.has(c) ? { codename: c } : null;
}
