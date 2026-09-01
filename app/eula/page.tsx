import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "End User License Agreement",
  description:
    "End User License Agreement for the SigRank Vercel Marketplace integration — license grant, restrictions, acceptance, termination, and disclaimers.",
  path: "/eula",
});

export default function EulaPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">Legal</p>
      <h1 className="mt-3 font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
        End User License Agreement
      </h1>
      <p className="mt-2 font-mono text-[11px] text-text-dim">
        Last updated 2026-09-01
      </p>

      <div className="mt-8 flex flex-col gap-6 font-sans text-sm leading-relaxed text-text-secondary">

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">1. Agreement to terms</h2>
          <p>
            This End User License Agreement (&ldquo;EULA&rdquo;, &ldquo;Agreement&rdquo;) is a
            legal agreement between you (&ldquo;you&rdquo;, &ldquo;Licensee&rdquo;) and Ello Cello
            LLC (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;Licensor&rdquo;, operating under the
            MO§ES™ mark) governing your installation and use of the SigRank Vercel Marketplace
            integration (the &ldquo;Integration&rdquo;).
          </p>
          <p>
            By installing, connecting, or otherwise using the Integration, you acknowledge that
            you have read, understood, and agree to be bound by this EULA. If you do not agree,
            do not install or use the Integration.
          </p>
          <p>
            This EULA is distinct from and supplements the general{" "}
            <Link href="/terms" className="text-text-muted underline hover:text-text-secondary">
              Terms of Service
            </Link>{" "}
            that govern use of signalaf.com. Where this EULA and the Terms of Service conflict
            regarding the Integration, this EULA controls.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">2. License grant</h2>
          <p>
            Subject to your compliance with this EULA, we grant you a limited, non-exclusive,
            non-transferable, revocable license to:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>Install and connect the Integration to your Vercel projects;</li>
            <li>Use the Integration to connect MCP-compatible clients to the SigRank MCP endpoint;</li>
            <li>Deploy the project-owned MCP relay starter kit in your own Vercel projects;</li>
            <li>Import your existing SigRank resources (operator identity, exchange signals, wiki contributions) into your Vercel project environment.</li>
          </ul>
          <p>
            This license is granted for the purpose of evaluating AI operators, accessing
            SigRank&apos;s metric tools, and participating in the Contribution Exchange. It is
            not a license to resell, repackage, or redistribute SigRank&apos;s tools or metrics.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">3. Restrictions</h2>
          <p>You may not:</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>Reverse engineer, decompile, or disassemble the Integration or the SigRank MCP endpoint;</li>
            <li>Modify, adapt, or create derivative works of the Integration;</li>
            <li>Redistribute, sublicense, or resell access to the Integration or the SigRank MCP endpoint;</li>
            <li>Use the Integration to scrape, crawl, or bulk-extract data from signalaf.com beyond what the MCP tools explicitly return;</li>
            <li>Use the Integration to violate the{" "}
              <Link href="/terms" className="text-text-muted underline hover:text-text-secondary">
                Terms of Service
              </Link>{" "}
              or any applicable law;
            </li>
            <li>Use the Integration to build a competing leaderboard, metric system, or evaluation service;</li>
            <li>Remove, alter, or obscure any proprietary notices or labels.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">4. The Integration</h2>
          <p>
            The Integration consists of:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>An OAuth callback that handles installation redirects from Vercel;</li>
            <li>A configuration page that displays installation status and MCP connection details;</li>
            <li>Environment variable management that adds the MCP endpoint URL to your project;</li>
            <li>The canonical MCP endpoint at <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">https://signalaf.com/api/mcp</code>;</li>
            <li>An optional project-owned relay starter kit available in the sigrank-mcp repository.</li>
          </ul>
          <p>
            The Integration is provided as a service. We may update, modify, or discontinue
            features at any time without prior notice. We will use commercially reasonable
            efforts to notify you of material changes via the configuration page or email.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">5. Acceptable use</h2>
          <p>
            You agree to use the Integration only for lawful purposes and in accordance with
            this EULA and the{" "}
            <Link href="/terms" className="text-text-muted underline hover:text-text-secondary">
              Terms of Service
            </Link>. You are responsible for all activity that occurs under your Vercel account
            in connection with the Integration.
          </p>
          <p>
            You agree not to:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>Use the Integration to transmit viruses, malware, or harmful code;</li>
            <li>Attempt to overload, crash, or disrupt the SigRank MCP endpoint;</li>
            <li>Use the Integration to harvest data about other operators without their consent;</li>
            <li>Use the Integration to submit fraudulent or manipulated telemetry data;</li>
            <li>Share your OAuth credentials or access token with third parties.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">6. Intellectual property</h2>
          <p>
            The Integration, the SigRank MCP endpoint, all metrics (Yield, Leverage, Velocity,
            SNR, 10xDEV, Construction), the SigRank taxonomy (archetypes, classes, ranks), and
            all associated documentation are the intellectual property of Ello Cello LLC and are
            protected by applicable copyright, trademark, and other laws.
          </p>
          <p>
            The MO§ES™ mark and all related branding are trademarks of Ello Cello LLC. This
            EULA does not grant you any right to use the MO§ES™ mark or SigRank branding except
            as necessary to describe the Integration&apos;s origin.
          </p>
          <p>
            The project-owned relay starter kit is open-source software licensed under the terms
            specified in the sigrank-mcp repository. This EULA governs the Integration service;
            the open-source license governs the relay code.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">7. Data and privacy</h2>
          <p>
            The Integration processes the following data:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li><strong className="text-text-primary">OAuth credentials</strong> — your Vercel access token, stored server-side with Row-Level Security, used to read project and deployment metadata;</li>
            <li><strong className="text-text-primary">Installation metadata</strong> — configuration ID, team ID, user ID, installation status;</li>
            <li><strong className="text-text-primary">MCP tool calls</strong> — the requests and responses exchanged with the MCP endpoint (operator lookups, signal queries, board data).</li>
          </ul>
          <p>
            The Integration does <strong className="text-text-primary">not</strong> process your
            source code, build logs, deployment secrets, environment variables (beyond those it
            creates), or any content from your Vercel projects.
          </p>
          <p>
            Your use of the Integration is also governed by our{" "}
            <Link href="/privacy" className="text-text-muted underline hover:text-text-secondary">
              Privacy Policy
            </Link>, which describes how we collect, use, and protect data across signalaf.com.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">8. Disclaimer of warranties</h2>
          <p>
            THE INTEGRATION IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
            WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT
            LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
            AND NON-INFRINGEMENT.
          </p>
          <p>
            WE DO NOT WARRANT THAT THE INTEGRATION WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE,
            THAT THE MCP ENDPOINT WILL BE AVAILABLE AT ALL TIMES, OR THAT RESULTS OBTAINED THROUGH
            THE INTEGRATION WILL BE ACCURATE OR RELIABLE.
          </p>
          <p>
            YOUR USE OF THE INTEGRATION IS AT YOUR SOLE RISK.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">9. Limitation of liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ELLO CELLO LLC
            BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
            OR ANY LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR
            USE OF THE INTEGRATION, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING
            NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE
            POSSIBILITY OF SUCH DAMAGE.
          </p>
          <p>
            OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS EULA SHALL NOT EXCEED
            THE GREATER OF (A) THE AMOUNTS YOU HAVE PAID FOR THE INTEGRATION IN THE TWELVE MONTHS
            PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100).
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">10. Termination</h2>
          <p>
            You may terminate this EULA at any time by uninstalling the Integration from your
            Vercel dashboard. Upon uninstall:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>Your OAuth access token is revoked;</li>
            <li>The Integration stops receiving Vercel API access for your projects;</li>
            <li>Environment variables added by the Integration remain until you manually remove them;</li>
            <li>Your SigRank account and data are unaffected.</li>
          </ul>
          <p>
            We may suspend or terminate your access to the Integration at any time, with or
            without cause, including if you violate this EULA or the Terms of Service.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">11. Changes to this EULA</h2>
          <p>
            We may update this EULA from time to time. Material changes will be reflected by the
            &ldquo;Last updated&rdquo; date above. Continued use of the Integration after a
            change constitutes acceptance of the updated EULA.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">12. Governing law</h2>
          <p>
            This EULA is governed by the laws of the State of California, without regard to its
            conflict of law provisions. Any disputes arising under this EULA shall be resolved
            in the state or federal courts located in California.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text-primary">13. Contact</h2>
          <p>
            Questions about this EULA:{" "}
            <a href="mailto:hello@signalaf.com" className="text-text-muted underline hover:text-text-secondary">
              hello@signalaf.com
            </a>
          </p>
          <p>
            Support:{" "}
            <Link href="/support" className="text-text-muted underline hover:text-text-secondary">
              signalaf.com/support
            </Link>
          </p>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-bg-border pt-6">
        <Link href="/terms" className="font-mono text-xs text-text-muted hover:text-text-primary">Terms of Service</Link>
        <Link href="/privacy" className="font-mono text-xs text-text-muted hover:text-text-primary">Privacy Policy</Link>
        <Link href="/docs/integrations/vercel" className="font-mono text-xs text-text-muted hover:text-text-primary">Integration Docs</Link>
        <Link href="/support" className="font-mono text-xs text-text-muted hover:text-text-primary">Support</Link>
      </div>
    </main>
  );
}
