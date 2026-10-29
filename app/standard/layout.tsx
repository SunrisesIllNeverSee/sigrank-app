import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/schema+json": "/standard/sigrank-operator-record-v0.1.schema.json",
      "text/plain": "/standard/llms.txt",
    },
  },
};

/** /standard and /standard/* render inside the editorial frame (docs topic);
 *  the machine-readable files sit in the right rail. */
export default function StandardLayout({ children }: { children: ReactNode }) {
  return (
    <EditorialWorkspaceFrame
      topic="docs"
      rightTitle="FILES"
      right={
        <div className="mod">
          <div className="mini-h"><span className="sq" />TTEOP STANDARD</div>
          <nav className="ws-nav" aria-label="TTEOP Standard files">
            <Link href="/standard/sigrank-operator-record-v0.1.schema.json">JSON Schema</Link>
            <Link href="/standard/llms.txt">Agent reference</Link>
          </nav>
        </div>
      }
    >
      {children}
    </EditorialWorkspaceFrame>
  );
}
