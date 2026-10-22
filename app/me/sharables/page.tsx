import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { getSessionOperator, getSessionUser } from "@/lib/infra/supabase/auth-server";

/**
 * Authenticated personal shareable resolver.
 *
 * Public /s/[codename] URLs are immutable identity-specific share links and
 * must NEVER redirect based on a visiting viewer's session. This self-link
 * resolves the verified owner instead, on every request (no ISR/caching).
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My Sharables | SignalAF",
  robots: { index: false, follow: false },
};

export default async function MySharablesPage() {
  const operator = await getSessionOperator();
  if (operator?.codename) {
    redirect(`/s/${encodeURIComponent(operator.codename)}#share-holocard`);
  }
  if (operator && !operator.codename) {
    redirect("/me/edit");
  }
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/me/sharables");

  // An authenticated but unlinked user has no legitimate operator card yet.
  // Do not default to a seed profile or silently impersonate another operator.
  return (
    <WorkspaceShell active="profile" title="MY SHARABLES" leftTitle="OPERATOR IDENTITY"
      left={<div className="mod"><h3><span className="sq" />ACCOUNT LINK</h3>
        <p className="ws-note">Signed in, but no operator identity is linked to this account.</p>
      </div>} leftWidth={228} rightWidth={252}>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-10">
        <h1 className="font-mono text-xl font-semibold text-text-primary">Link your operator to generate your cards</h1>
        <p className="text-sm text-text-secondary">
          You're signed in, but your account is not linked to a SignalAF operator.
          We won't substitute another person's profile, rank or artwork.
          Find your existing public operator on the leaderboard and use its claim flow.
        </p>
        <Link className="font-mono text-sm text-gold underline" href="/board/all">Find and claim my operator →</Link>
        <Link className="font-mono text-sm text-text-secondary underline" href="/settings">Account settings →</Link>
      </main>
    </WorkspaceShell>
  );
}
