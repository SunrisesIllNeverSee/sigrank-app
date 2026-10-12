"use client";

import { useEffect, useState } from "react";
import { useProfileAuth } from "./ProfileAuthGate";
import { ClaimTab } from "./ClaimTab";
import { ReportTab } from "./ReportTab";
import { LabTab } from "./LabTab";
import type { OperatorReport } from "@/lib/board";
import type { BuildArchetype } from "@/lib/analytics/build-archetypes";

/**
 * Client-side wrappers that consume the ProfileAuthContext and pass the
 * resolved auth state to the auth-dependent profile components.
 *
 * These exist because the server component cannot pass functions (render
 * props) to client components — functions aren't serializable across the
 * server/client boundary. Instead, the server wraps these gates in
 * <ProfileAuthGate>, and each gate reads the auth state from context.
 */

export function ClaimTabGate({ codename }: { codename: string }) {
  const { isSignedIn, hasOperator, loaded } = useProfileAuth();
  if (!loaded) return null;
  return (
    <ClaimTab
      codename={codename}
      isSignedIn={isSignedIn}
      hasOperator={hasOperator}
    />
  );
}

export function ReportTabGate({
  report,
  codename,
  archetype,
}: {
  /** Serialized report — only ever the PUBLIC (report_visible) report. A
   *  private report is never in the flight payload; the owner fetches it
   *  through the authenticated route once auth resolves client-side. */
  report: OperatorReport | null;
  codename: string;
  archetype: BuildArchetype | null;
}) {
  const { isOwner, loaded } = useProfileAuth();
  const [fetched, setFetched] = useState<OperatorReport | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (report || !loaded || !isOwner || tried) return;
    setTried(true);
    fetch(`/api/v1/operators/${encodeURIComponent(codename)}/report`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) =>
        setFetched((d?.report as OperatorReport | undefined) ?? null),
      )
      .catch(() => setFetched(null));
  }, [report, loaded, isOwner, tried, codename]);

  const resolved = report ?? fetched;
  if (resolved) {
    return <ReportTab report={resolved} isOwner={isOwner} archetype={archetype} />;
  }
  if (!loaded || (isOwner && !tried)) {
    return (
      <div className="rounded-lg border border-bg-border p-6 text-center">
        <p className="font-mono text-sm text-text-muted">Resolving access…</p>
      </div>
    );
  }
  if (!isOwner) {
    return (
      <div className="rounded-lg border border-bg-border p-6 text-center">
        <p className="font-mono text-sm text-text-muted">
          This report is private — visible to the operator only.
        </p>
      </div>
    );
  }
  return <ReportTab report={null} isOwner archetype={archetype} />;
}

export function LabTabGate({
  pillars,
}: {
  pillars: {
    input: number;
    output: number;
    cacheCreate: number;
    cacheRead: number;
  };
}) {
  const { isOwner } = useProfileAuth();
  return <LabTab pillars={pillars} isOwner={isOwner} />;
}
