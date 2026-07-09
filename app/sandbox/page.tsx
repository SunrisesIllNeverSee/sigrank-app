import type { Metadata } from "next";
import { withOG } from "@/lib/seo";
import { SandboxClient } from "@/components/sandbox/SandboxClient";

export const metadata: Metadata = withOG({
  title: "Cascade Lab",
  description:
    "Interactive sandbox for the SigRank cascade metrics. Adjust token pillars, see live Yield, SignaRate, class assignment, and the full Core 5 radar.",
  path: "/sandbox",
});

export default function SandboxPage() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
            Cascade Lab
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Adjust the four token pillars and session context. Cascade metrics
            (Υ, SNR, Leverage, Velocity, 10xDEV) compute live. SignaRate and
            class assignment are scored server-side using the real RS.xx
            weights.
          </p>
        </header>
        <SandboxClient />
      </div>
    </div>
  );
}
