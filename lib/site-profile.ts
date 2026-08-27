/**
 * lib/site-profile.ts — Domain-based profile selection for multi-domain
 * deployments from the same sigrank-app codebase.
 *
 * signalaf.com and sigeconomy.com are both deployed from this repo. They
 * share the same canonical entity identities (Ello Cello LLC, SigRank,
 * MO\u00A7ES, Deric J. McHenry) but have different site-specific values
 * (domain, site name, SEO tagline, alternate names).
 *
 * The profile is selected at build time based on SITE_ORIGIN (which is
 * set from NEXT_PUBLIC_SITE_URL). Canon-backed values come from
 * lib/canon-entities.ts and are identical across profiles.
 */

import { SITE_ORIGIN } from "@/lib/seo";

export type SiteProfileId = "signalaf" | "sigeconomy";

export interface SiteProfile {
  profileId: SiteProfileId;
  domain: string;
  /** Site-specific name for WebSite schema and OG metadata. NOT canon-backed. */
  siteName: string;
  /** Site-specific alternate names for SEO. NOT canon-backed. */
  alternateNames: string[];
  /** Site-specific tagline for WebSite.description. NOT canon-backed. */
  siteTagline: string;
  /** Site-specific description for the SoftwareApplication product block.
   *  When null, the canon description from canon-entities.ts is used. */
  productSeoDescription: string | null;
}

const PROFILES: Record<SiteProfileId, SiteProfile> = {
  signalaf: {
    profileId: "signalaf",
    domain: "https://signalaf.com",
    siteName: "SigRank SignalAF",
    alternateNames: ["SigRank", "SignalAF", "signalaf", "SigRank SignalAF"],
    siteTagline:
      "SigRank SignalAF ranks AI operators by Yield (\u03A5 = cache_read \u00D7 output / input\u00B2) \u2014 " +
      "token-cascade efficiency, not raw spend. Privacy-preserving: token counts only, never prompts.",
    productSeoDescription:
      "Leaderboard measuring AI users (operators) by token cascade efficiency " +
      "(\u03A5 Yield, C:I:O) and operator classes. Privacy-preserving, on-device telemetry " +
      "with ed25519-signed submissions.",
  },
  sigeconomy: {
    profileId: "sigeconomy",
    domain: "https://sigeconomy.com",
    siteName: "SigEconomy",
    alternateNames: ["SigEconomy", "sigeconomy", "SigRank SigEconomy"],
    siteTagline:
      "SigEconomy \u2014 the competitive operator-ranking arena. AI operators ranked by " +
      "token cascade efficiency. Satellite leaderboard from the SigRank methodology.",
    productSeoDescription: null, // use canon description
  },
};

function detectProfile(): SiteProfileId {
  if (SITE_ORIGIN.includes("sigeconomy.com")) return "sigeconomy";
  return "signalaf";
}

/** Active site profile, selected by domain. */
export const activeProfile: SiteProfile = PROFILES[detectProfile()];
