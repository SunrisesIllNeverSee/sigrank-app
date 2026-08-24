import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import {
  CompanySignupForm,
  CompanyVerifyForm,
} from "@/components/exchange/ExchangeForms";

export const metadata: Metadata = withOG({
  title: "Configure a Company Exchange Domain",
  description:
    "Verify a company domain and choose its economic counterparty agent on the Contribution Exchange.",
  path: "/exchange/company",
});

export default function Page() {
  return (
    <main className="min-h-screen bg-bg-base px-5 py-14 text-text-primary">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/exchange"
          className="font-sans text-sm text-text-muted hover:text-text-primary"
        >
          ← Contribution Exchange
        </Link>
        <p className="mt-7 font-mono text-xs uppercase tracking-[0.2em] text-gold">
          Private-alpha onboarding
        </p>
        <h1 className="mt-3 font-mono text-4xl font-bold">
          Give your domain an economic agent.
        </h1>
        <p className="mt-4 font-sans leading-7 text-text-secondary">
          Verify the organization and domain, then choose the hosted Exchange
          Steward or bring your own counterparty agent. Human administrators and
          domain agents receive separate credentials. New domains can publish an
          Exchange Profile immediately; financial settlement remains
          operator-gated during private alpha.
        </p>
        <div className="mt-10 rounded-xl border border-bg-border bg-bg-surface p-6">
          <CompanySignupForm />
        </div>
        <div className="mt-10 rounded-xl border border-bg-border bg-bg-surface p-6">
          <h2 className="mb-4 font-mono text-xl font-semibold">
            Verify domain control
          </h2>
          <p className="mb-5 font-sans text-sm text-text-muted">
            Publish the returned{" "}
            <code className="font-mono text-gold">
              _contribution-exchange.yourdomain.com
            </code>{" "}
            TXT record, then verify.
          </p>
          <CompanyVerifyForm />
        </div>
        <div className="mt-8 rounded-xl border border-bg-border p-5 font-sans text-sm text-text-secondary">
          <strong className="text-text-primary">Already configured?</strong> Use{" "}
          <Link
            className="text-gold hover:text-text-primary"
            href="/exchange/control"
          >
            supervisory control
          </Link>{" "}
          for delegation policy, escalations, activity and economics.
        </div>
      </div>
    </main>
  );
}
