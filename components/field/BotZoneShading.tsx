/**
 * BotZoneShading — overlay legend for bot exclusion zones.
 *
 * Not a standalone chart — a small legend component that explains the red
 * shaded exclusion regions visible on the distribution charts. Placed near
 * the bot detection section to contextualize the zone shading.
 */

export default function BotZoneShading() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
      <h4 className="font-sans text-sm font-bold text-text-primary">
        Bot Exclusion Zones
      </h4>
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-red-500/20 border border-red-500/40" />
          <span className="text-text-secondary">
            <span className="font-mono font-bold text-red-400">
              input/total &lt; 0.1%
            </span>{" "}
            - cache replay bots (zero fresh input)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-red-500/20 border border-red-500/40" />
          <span className="text-text-secondary">
            <span className="font-mono font-bold text-red-400">
              input/total &gt; 80%
            </span>{" "}
            - input dump bots (no cache reuse)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-500/10 border border-green-500/30" />
          <span className="text-text-secondary">
            <span className="font-mono font-bold text-green-400">
              1% - 80%
            </span>{" "}
            - Human Center of Mass (1,498 operators)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-yellow-500/10 border border-yellow-500/30" />
          <span className="text-text-secondary">
            <span className="font-mono font-bold text-yellow-400">
              0.1% - 1%
            </span>{" "}
            - gray zone (MOSES-like operators, case-by-case)
          </span>
        </div>
      </div>
      <p className="text-xs text-text-muted">
        Bots and outliers are not deleted. They get their own category and
        rank against each other. They just do not set the numbers for the
        Human Center of Mass.
      </p>
    </div>
  );
}
