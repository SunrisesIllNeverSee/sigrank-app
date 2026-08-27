import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/schema+json": "/standard/sigrank-operator-record-v0.1.schema.json",
      "text/plain": "/standard/llms.txt",
    },
  },
};

export default function StandardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav
        aria-label="SigRank Standard"
        className="mx-auto mb-4 flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 border-b border-bg-border py-3 font-mono text-xs"
      >
        <Link href="/standard" className="font-bold text-gold hover:underline">
          SigRank Standard
        </Link>
        <Link
          href="/standard/open-vs-proprietary"
          className="text-text-secondary hover:text-gold hover:underline"
        >
          Open vs proprietary
        </Link>
        <Link
          href="/standard/sigrank-operator-record-v0.1.schema.json"
          className="text-text-secondary hover:text-gold hover:underline"
        >
          JSON Schema
        </Link>
        <Link
          href="/standard/llms.txt"
          className="text-text-secondary hover:text-gold hover:underline"
        >
          Agent reference
        </Link>
      </nav>
      {children}
    </>
  );
}
