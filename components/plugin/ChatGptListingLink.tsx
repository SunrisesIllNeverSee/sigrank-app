"use client";

import { track } from "@/lib/infra/posthog/events";

// Official ChatGPT directory listing: "SigRank | SignalAF Analyst".
export const CHATGPT_LISTING_URL =
  "https://chatgpt.com/plugins/plugin_asdk_app_6ac9daab15288191aaeb6847cb6264ee";

/** Button-style link to the ChatGPT listing; fires chatgpt_listing_click (no-ops when PostHog is off). */
export function ChatGptListingLink() {
  return (
    <a
      className="mt-4 inline-flex min-h-11 items-center justify-center rounded border border-gold px-4 py-2 text-center font-mono text-xs font-semibold text-gold hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      href={CHATGPT_LISTING_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track.chatgptListingClicked({ source: "plugin_page" })}
    >
      Open in ChatGPT
    </a>
  );
}
