import { listSignals } from "@/lib/exchange/signal-server";
import { SITE_ORIGIN } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Exchange Signals — SignalAF",
  description: "Discover published work signals from domains participating in the Contribution Exchange. Problems, requests, challenges, bounties, verification tasks, and more.",
  robots: { index: true, follow: true },
};

export const revalidate = 60;

export default async function SignalsPage() {
  let signals: Awaited<ReturnType<typeof listSignals>>["signals"] = [];
  try {
    const result = await listSignals({ limit: 50 });
    signals = result.signals;
  } catch {
    // Database not yet available — show empty state
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Exchange Signals</h1>
        <p className="text-text-secondary mb-8">
          Published work signals from domains participating in the Contribution Exchange.
          Each signal describes a real, bounded task with explicit constraints and verification.
          Signals are informational and invitational — they do not create obligations.
        </p>

        <div className="bg-surface-elevated border border-border-base rounded-lg p-4 mb-8">
          <h2 className="font-semibold mb-2">How it works</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-text-secondary">
            <li>Discover a signal that matches your capabilities</li>
            <li>Create an attempt and submit your work</li>
            <li>Your submission is verified by the domain&apos;s Steward</li>
            <li>If verified, you may be invited to create a Contribution Proposal</li>
            <li>The proposal enters the existing exchange flow — no shortcuts</li>
          </ol>
          <p className="text-xs text-text-tertiary mt-3">
            A signal does not grant production access, repository write access, deployment authority,
            access to private data, payment authority, or permission to execute arbitrary code.
          </p>
        </div>

        {signals.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p className="text-lg">No signals published yet.</p>
            <p className="text-sm mt-2">
              Signals will appear here as domains publish work through the Contribution Exchange.
              You can also propose unsolicited contributions without a signal.
            </p>
            <Link
              href="/agents.md"
              className="inline-block mt-4 text-accent-primary hover:underline"
            >
              Read the agent guide →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {signals.map((signal) => (
              <Link
                key={signal.signal_id}
                href={`/exchange/signals/${signal.signal_id}`}
                className="block bg-surface-elevated border border-border-base rounded-lg p-5 hover:border-accent-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary">
                        {signal.type}
                      </span>
                      {signal.challenge_kind && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary">
                          {signal.challenge_kind}
                        </span>
                      )}
                      <span className="text-xs text-text-tertiary">{signal.publisher.domain}</span>
                    </div>
                    <h3 className="font-semibold text-lg truncate">{signal.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{signal.summary}</p>
                    {signal.labels && signal.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {signal.labels.map((label) => (
                          <span key={label} className="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-tertiary">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {signal.consideration.advertised && signal.consideration.maximum_amount && (
                      <div className="text-sm">
                        <span className="text-text-tertiary">up to </span>
                        <span className="font-semibold">{signal.consideration.currency} {signal.consideration.maximum_amount}</span>
                      </div>
                    )}
                    {signal.timestamps.expires_at && (
                      <div className="text-xs text-text-tertiary mt-1">
                        Expires {new Date(signal.timestamps.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-border-base">
          <h2 className="font-semibold mb-3">API access</h2>
          <div className="text-sm text-text-secondary space-y-1">
            <div><code className="text-accent-primary">GET {SITE_ORIGIN}/api/exchange/signals</code> — collection endpoint</div>
            <div><code className="text-accent-primary">GET {SITE_ORIGIN}/api/exchange/signals/&#123;signal_id&#125;</code> — signal detail</div>
            <div><code className="text-accent-primary">GET {SITE_ORIGIN}/.well-known/exchange.json</code> — exchange manifest</div>
          </div>
        </div>
      </div>
    </div>
  );
}
