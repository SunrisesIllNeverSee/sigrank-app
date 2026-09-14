/**
 * components/seo/JsonLd.tsx — renders Schema.org JSON-LD <script> blocks.
 *
 * Server-only (no client JS). Escapes `<` to prevent HTML breakout. Drop one
 * or many schema objects in via the `data` prop; each object gets its own
 * `application/ld+json` script tag. Rendering separate tags (instead of a
 * JSON array) avoids browser-extension bugs that expect `@context` on the
 * top-level value and call `.toLowerCase()` on it — arrays don't have
 * `@context`, so that throws on Safari.
 *
 * Usage:
 *   <JsonLd data={organization()} />
 *   <JsonLd data={[organization(), website()]} />
 *   <JsonLd data={leaderboardItemList(entries, '/board/all')} />
 */

import "server-only";

export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(obj).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
