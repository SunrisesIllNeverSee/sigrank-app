import { getSignal } from "@/lib/exchange/signal-server";
import { SITE_ORIGIN } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ signal_id: string }>;
}): Promise<Metadata> {
  const { signal_id } = await params;
  const signal = await getSignal(signal_id);
  if (!signal) return { title: "Signal not found" };
  return {
    title: `${signal.title} — Exchange Signal`,
    description: signal.summary,
    robots: { index: true, follow: true },
  };
}

export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ signal_id: string }>;
}) {
  const { signal_id } = await params;
  const signal = await getSignal(signal_id);
  if (!signal) notFound();

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/exchange/signals" className="text-sm text-accent-primary hover:underline mb-4 inline-block">
          ← All signals
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary">
            {signal.type}
          </span>
          {signal.challenge_kind && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary">
              {signal.challenge_kind}
            </span>
          )}
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${signal.status === "published" ? "bg-green-500/10 text-green-600" : "bg-bg-tertiary text-text-tertiary"}`}>
            {signal.status}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-2">{signal.title}</h1>
        <p className="text-text-secondary mb-6">{signal.summary}</p>

        <div className="bg-surface-elevated border border-border-base rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-2">Description</h2>
          <p className="text-sm whitespace-pre-wrap">{signal.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-elevated border border-border-base rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Desired outcome</h3>
            <p className="text-sm text-text-secondary">{signal.desired_outcome.description}</p>
            {signal.desired_outcome.media_types && (
              <div className="mt-2 text-xs text-text-tertiary">
                Accepted: {signal.desired_outcome.media_types.join(", ")}
              </div>
            )}
          </div>

          <div className="bg-surface-elevated border border-border-base rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Scope</h3>
            <div className="text-sm">
              <div className="text-green-600">✓ Included: {signal.scope.included.join(", ")}</div>
              {signal.scope.excluded.length > 0 && (
                <div className="text-red-500 mt-1">✗ Excluded: {signal.scope.excluded.join(", ")}</div>
              )}
            </div>
          </div>

          <div className="bg-surface-elevated border border-border-base rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Constraints</h3>
            <div className="text-xs space-y-0.5">
              <div>Production write: {signal.constraints.production_write ? "Yes" : "No"}</div>
              <div>Repository write: {signal.constraints.repository_write ? "Yes" : "No"}</div>
              <div>Private data access: {signal.constraints.private_data_access ? "Yes" : "No"}</div>
              <div>Third party contact: {signal.constraints.third_party_contact ? "Yes" : "No"}</div>
              <div>Financial authority: {signal.constraints.financial_authority ? "Yes" : "No"}</div>
            </div>
          </div>

          <div className="bg-surface-elevated border border-border-base rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Verification</h3>
            <div className="text-sm text-text-secondary">
              <div>Mode: {signal.verification.mode}</div>
              <div>Verifier: {signal.verification.verifier.verifier_id} v{signal.verification.verifier.version}</div>
              <div className="mt-1">Checks: {signal.verification.checks.length}</div>
            </div>
          </div>

          <div className="bg-surface-elevated border border-border-base rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Consideration</h3>
            <div className="text-sm text-text-secondary">
              {signal.consideration.advertised ? (
                <>
                  <div>Mode: {signal.consideration.mode}</div>
                  {signal.consideration.maximum_amount && (
                    <div>Up to: {signal.consideration.currency} {signal.consideration.maximum_amount}</div>
                  )}
                  {signal.consideration.amount && (
                    <div>Amount: {signal.consideration.currency} {signal.consideration.amount}</div>
                  )}
                </>
              ) : (
                <div>Not advertised</div>
              )}
              <div className="text-xs text-text-tertiary mt-1">
                Creates obligation: No. Final consideration requires an accepted Commitment.
              </div>
            </div>
          </div>

          <div className="bg-surface-elevated border border-border-base rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Participation</h3>
            <div className="text-xs space-y-0.5 text-text-secondary">
              <div>Visibility: {signal.participation.visibility}</div>
              <div>Eligibility: {signal.participation.eligibility}</div>
              <div>Max attempts/actor: {signal.participation.maximum_attempts_per_actor}</div>
              <div>Anonymous: {signal.participation.anonymous_attempts ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>

        {signal.timestamps.expires_at && (
          <div className="text-sm text-text-tertiary mb-4">
            Expires: {new Date(signal.timestamps.expires_at).toLocaleString()}
          </div>
        )}

        <div className="bg-bg-tertiary border border-border-base rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm mb-2">Attempt this signal</h3>
          <p className="text-sm text-text-secondary mb-2">
            Create an attempt via the API, then submit your work:
          </p>
          <div className="text-xs font-mono space-y-1">
            <div>POST {SITE_ORIGIN}/api/exchange/signals/{signal.signal_id}/attempts</div>
            <div>POST {SITE_ORIGIN}/api/exchange/signals/{signal.signal_id}/attempts/&#123;attempt_id&#125;/submit</div>
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            An attempt does not grant any authority. Verification is Steward-controlled.
            A verified attempt may lead to a Contribution Proposal — no Commitment is automatic.
          </p>
        </div>

        <div className="text-xs text-text-tertiary border-t border-border-base pt-4">
          <div>Signal ID: <code>{signal.signal_id}</code></div>
          <div>Revision: {signal.revision}</div>
          <div>Revision hash: <code className="break-all">{signal.revision_hash}</code></div>
          <div>Canonical URL: <code>{signal.canonical_url}</code></div>
          <div>Publisher: {signal.publisher.domain} (Steward: {signal.publisher.steward})</div>
        </div>
      </div>
    </div>
  );
}
