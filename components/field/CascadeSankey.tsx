/**
 * CascadeSankey — the hero cascade flow diagram.
 *
 * Shows the median operator's token cascade: Input -> Output -> Cache Write
 * -> Cache Read, with token counts + percentages. Uses the pre-generated PNG
 * from article-charts/ (08-cascade-sankey.png) rendered responsive.
 *
 * Pure static image — no client-side interactivity. The Python-generated
 * chart is higher quality than anything we can render in SVG at this
 * complexity level.
 */

import Image from "next/image";

export default function CascadeSankey() {
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-bg-border bg-bg-surface">
      <Image
        src="/article-charts/08-cascade-sankey.png"
        alt="Token cascade flow: Input (238M) to Output (24M) to Cache Write (72M) to Cache Read (4.77B). Operating ratio C:I:O = 19:1:0.09. Leverage 20.5x."
        width={1600}
        height={800}
        className="h-auto w-full"
        priority
      />
    </div>
  );
}
