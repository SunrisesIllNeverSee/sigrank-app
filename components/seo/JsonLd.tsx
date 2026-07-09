/**
 * components/seo/JsonLd.tsx — renders Schema.org JSON-LD <script> blocks.
 *
 * Server-only (no client JS). Escapes `<` to prevent HTML breakout. Drop one
 * or many schema objects in via the `data` prop; the component serializes
 * them into a single `application/ld+json` script tag.
 *
 * Usage:
 *   <JsonLd data={organization()} />
 *   <JsonLd data={[organization(), website()]} />
 *   <JsonLd data={leaderboardItemList(entries, '/board/all')} />
 */

import "server-only";

export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
