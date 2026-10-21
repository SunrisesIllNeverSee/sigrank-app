/**
 * lib/search/match.ts — pure matcher for the title-bar global search
 * (owner 2026-10-21). Dependency-free so node:test can import it directly.
 *
 * Every whitespace-separated query token must appear somewhere in the
 * haystack; prefix-of-a-word hits and title hits rank higher.
 */

export interface SearchOperator {
  codename: string;
  name: string;
  handle: string;
  klass: string;
}

export interface SearchPage {
  path: string;
  title: string;
  section: string;
  description?: string;
}

function tokens(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

function score(fields: string[], toks: string[]): number {
  // fields[0] is the primary label (name / title); the rest are secondary.
  const lower = fields.map((f) => f.toLowerCase());
  let total = 0;
  for (const t of toks) {
    let best = 0;
    lower.forEach((f, i) => {
      const at = f.indexOf(t);
      if (at < 0) return;
      const wordStart = at === 0 || /[^a-z0-9]/.test(f[at - 1]);
      const s = (i === 0 ? 4 : 2) + (wordStart ? 2 : 0) + (at === 0 ? 1 : 0);
      if (s > best) best = s;
    });
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export function matchOperators(
  ops: SearchOperator[],
  query: string,
  limit = 6,
): SearchOperator[] {
  const toks = tokens(query);
  if (!toks.length) return [];
  const hits: { o: SearchOperator; s: number; i: number }[] = [];
  ops.forEach((o, i) => {
    const s = score([o.name, o.codename, o.handle], toks);
    if (s > 0) hits.push({ o, s, i });
  });
  // ops arrive rank-ordered; the index keeps ties in board order.
  hits.sort((a, b) => b.s - a.s || a.i - b.i);
  return hits.slice(0, limit).map((h) => h.o);
}

export function matchPages(
  pages: SearchPage[],
  query: string,
  limit = 8,
): SearchPage[] {
  const toks = tokens(query);
  if (!toks.length) return [];
  const hits: { p: SearchPage; s: number; i: number }[] = [];
  pages.forEach((p, i) => {
    const s = score([p.title, p.path, p.section, p.description ?? ""], toks);
    if (s > 0) hits.push({ p, s, i });
  });
  hits.sort((a, b) => b.s - a.s || a.i - b.i);
  return hits.slice(0, limit).map((h) => h.p);
}
