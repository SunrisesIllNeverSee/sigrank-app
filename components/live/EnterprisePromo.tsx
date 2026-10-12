/**
 * components/live/EnterprisePromo.tsx — ENTERPRISE · UPSILON promo card
 * for the live-board icon rail (owner directive 2026-10-06: /enterprise
 * doesn't exist — the ENTERPRISE rail entry pops this card instead of a
 * dead route; the CTA lands on /upsilon, the enterprise product surface).
 *
 * Presentational only. EnterprisePromoCard renders a styled .epromo panel
 * (acctpop/rtip chrome: panel bg, line border, radius, shadow) — it is
 * never positioned. The caller mounts it inside .epromo-pop, the absolute
 * panel styled in rail-extras.css that anchors just right of the icon
 * rail; .snav and .sfoot are made position:relative there, so drop the
 * pop at the end of .snav (just under the ENTERPRISE sbtn) or beside
 * .sacct (already relative via .acctpop). EnterprisePromoPop is a
 * ready-made pop+card wrapper — toggle with the `hidden` attribute.
 *
 * This module also carries the rail-polish stylesheet: the
 * `import "./rail-extras.css"` here loads the enlarged per-icon hues and
 * the .epromo chrome so they travel with the card (same pattern as
 * proto-scoped.css on the workspace).
 */
import Link from "next/link";
import "./rail-extras.css";

/** MO§ES "EKG" product demo — verified live per LIVE_BOARD_DESIGN_NOTES. */
const PROMO_SRC = "https://mos2es.com/assets/physical-product-brief.mp4";

export function EnterprisePromoCard() {
  return (
    <div className="epromo">
      <video
        className="epromo-vid"
        src={PROMO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Upsilon product demo"
        // SSR emits the muted attribute, but autoplay policy reads the IDL
        // property — pin it on mount so client-side mounts still autoplay.
        ref={(el) => {
          if (el) el.muted = true;
        }}
      />
      <div className="epromo-body">
        <div className="epromo-eyebrow">
          <span className="sq" aria-hidden="true" />
          ENTERPRISE · UPSILON
        </div>
        <p className="epromo-blurb">
          Upsilon is the measurement engine behind SignalAF — the EKG for AI
          processing: governed, signed token telemetry for teams.
        </p>
        <Link className="epromo-cta" href="/upsilon">
          ENTERPRISE →
        </Link>
      </div>
    </div>
  );
}

/**
 * Card pre-wrapped in the .epromo-pop absolute panel. Mount inside a
 * relative rail box (.snav / .sfoot / .sacct) and show/hide via `hidden`
 * or a conditional render — anchoring is handled by rail-extras.css.
 */
export function EnterprisePromoPop({ hidden }: { hidden?: boolean }) {
  return (
    <div className="epromo-pop" hidden={hidden}>
      <EnterprisePromoCard />
    </div>
  );
}
