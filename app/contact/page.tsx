import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";

export const metadata: Metadata = withOG({
  title: "Contact",
  description:
    "Get in touch with the SigRank team — feedback, questions, partnerships, or bug reports.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <WorkspaceShell
      active="home"
      title="CONTACT"
      bareTitle
      hero={
        <WaveHero
          eyebrow="Contact"
          title="Get in touch"
          subtitle="Feedback, questions, partnerships, or bug reports — we read everything."
        />
      }
      leftTitle="MORE"
      left={
        <>
          <div className="mod">
            <div className="mini-h"><span className="sq" />HELP</div>
            <nav className="ws-nav">
              <Link href="/faq">FAQ</Link>
              <Link href="/support">Support</Link>
              <Link href="/methodology">Methodology</Link>
            </nav>
          </div>
        </>
      }
      rightTitle="CHANNELS"
      right={
        <>
          <div className="mod">
            <div className="mini-h"><span className="sq" />RESPONSE</div>
            <p className="ws-note">
              Feedback, questions, partnerships, or bug reports — we read
              everything.
            </p>
          </div>
          <div className="mod">
            <div className="mini-h"><span className="sq" />SELF-SERVE</div>
            <nav className="ws-nav">
              <Link href="/settings">Settings</Link>
              <Link href="/privacy">Privacy policy</Link>
              <Link href="/terms">Terms of service</Link>
            </nav>
          </div>
        </>
      }
      leftWidth={228}
      rightWidth={252}
      status={<>CONTACT · SIGNALAF × SIGRANK</>}
    >
      <div className="mx-auto max-w-lg px-4 py-12">
        <ContactForm />
      </div>
    </WorkspaceShell>
  );
}
