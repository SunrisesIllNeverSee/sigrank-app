import { JsonLd } from "@/components/seo/JsonLd";
import { contributionExchangeService } from "@/lib/jsonld";

/**
 * Contribution Exchange structured data is intentionally scoped to /exchange.
 * It must never be emitted site-wide, where crawlers could mistake this
 * optional capability for SignalAF / SigRank's primary product identity.
 */
export default function ExchangeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={contributionExchangeService()} />
      {children}
    </>
  );
}
