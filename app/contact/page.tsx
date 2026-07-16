import type { Metadata } from "next";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = withOG({
  title: "Contact",
  description:
    "Get in touch with the SigRank team — feedback, questions, partnerships, or bug reports.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <WaveHero
        eyebrow="Contact"
        title="Get in touch"
        subtitle="Feedback, questions, partnerships, or bug reports — we read everything."
      />
      <div className="mx-auto max-w-lg px-4 py-12">
        <ContactForm />
      </div>
    </>
  );
}
