import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginContent } from "@/components/auth/LoginContent";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { withOG } from "@/lib/seo";

/**
 * app/signup/page.tsx — create an operator profile.
 *
 * Same OAuth / magic-link providers as /login (the first sign-in creates the
 * account), with sign-up copy and the early-operator offer. Static + ISR like
 * /login; ?next= and ?error= are read on the client by LoginContent.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  ...withOG({
    title: "Create your operator profile",
    description:
      "Claim a handle, put your AI token stats on the SigRank board, and see where you rank. The first 1,000 operators get permanent free access.",
    path: "/signup",
  }),
  // Auth surface — not a search landing page.
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <WorkspaceShell active="profile" title="JOIN THE BOARD" leftTitle="SIGN UP"
      left={<div className="mod"><h3><span className="sq" />EARLY OPERATORS</h3><p className="ws-note">The first 1,000 operators get permanent free access. Your signup position is locked the moment you join.</p></div>}
      rightTitle="SCORE FIRST" right={<div className="mod"><h3><span className="sq" />NO ACCOUNT NEEDED</h3><p className="ws-note">Run <code>npx sigrank</code> to score your local usage. It reads token counts only, never prompts or conversation content.</p></div>}
      leftWidth={228} rightWidth={252}>
      <Suspense
        fallback={
          <div className="account-access-content mx-auto flex max-w-md flex-col gap-6 py-12">
            <header className="flex flex-col items-center gap-2 text-center">
              <span className="font-mono text-3xl font-bold tracking-[0.1em] text-gold">SIGRANK</span>
              <h1 className="font-mono text-lg font-bold tracking-wide text-text-primary">Create your operator profile</h1>
            </header>
          </div>
        }
      >
        <LoginContent mode="signup" />
      </Suspense>
    </WorkspaceShell>
  );
}
