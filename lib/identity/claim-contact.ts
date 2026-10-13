/**
 * Seeded-profile claims are handled by hand (owner 2026-10-13): only operators
 * from the original board can claim, and they do it by email. Signing up is
 * the only way onto the current board.
 */
export const CLAIM_CONTACT_EMAIL = "hello@signalaf.com";

export function claimMailto(codename?: string): string {
  const subject = codename ? `Profile claim: ${codename}` : "Profile claim";
  const body =
    "Hi SignalAF — I'd like to claim my profile from the original board.\n\n" +
    `Codename: ${codename ?? ""}\n` +
    "GitHub (or the account you contacted me on): \n";
  return `mailto:${CLAIM_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
