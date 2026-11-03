import type { ReactNode } from "react";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

/**
 * app/vercel/layout.tsx — the Vercel integration pages render inside the
 * editorial frame (docs topic). The Docs branch of the nav tree lists every
 * page in the integration surface; legal and support live in their own topics.
 */
export default function VercelLayout({ children }: { children: ReactNode }) {
  return (
    <EditorialWorkspaceFrame
      topic="docs"
      rightTitle="VERCEL"
      right={
        <div className="mod">
          <div className="mini-h"><span className="sq" />SIGRANK × VERCEL</div>
          <nav className="ws-nav" aria-label="Vercel integration">
            <a href="https://vercel.com/integrations" target="_blank" rel="noopener noreferrer">
              Vercel Marketplace ↗
            </a>
          </nav>
        </div>
      }
    >
      {children}
    </EditorialWorkspaceFrame>
  );
}
