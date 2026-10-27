import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

export const metadata: Metadata = withOG({
  title: "Contact",
  description:
    "Get in touch with the SigRank team — feedback, questions, partnerships, or bug reports.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <EditorialWorkspaceFrame
      topic="support"
      credit={false}
      title="CONTACT"
      hero={
        <WaveHero
          eyebrow="Contact"
          title="Get in touch"
          subtitle="Feedback, questions, partnerships, or bug reports — we read everything."
        />
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
      status={<>CONTACT · SIGNALAF × SIGRANK</>}
      pageContents={
        <nav className="ws-nav" aria-label="Sections on this page">
          <a href="#contact-form">Send a message</a>
        </nav>
      }
    >
      <div id="contact-form" className="mx-auto max-w-lg px-4 py-12">
        <ContactForm />
      </div>
    </EditorialWorkspaceFrame>
  );
}
