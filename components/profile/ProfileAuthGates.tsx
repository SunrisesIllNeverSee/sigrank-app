"use client";

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
  archetype,
}: {
  report: OperatorReport;
  archetype: BuildArchetype | null;
}) {
  const { isOwner } = useProfileAuth();
  return <ReportTab report={report} isOwner={isOwner} archetype={archetype} />;
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
