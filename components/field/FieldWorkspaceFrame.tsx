import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { EditorialNav as FieldFamilyNav } from "@/components/live/EditorialSidebar";

/** One canonical navigation implementation for all editorial families. */
export { EditorialNav as FieldFamilyNav } from "@/components/live/EditorialSidebar";
export type { TextPage } from "@/components/live/EditorialSidebar";

interface Props {
  title: string;
  children: ReactNode;
  status?: ReactNode;
  right?: ReactNode;
  rightTitle?: string;
  rightDefaultOpen?: boolean;
  /** Which family page this is — marks the active banner in the rail. */
  current?: "fieldhub" | "field" | "research" | "about" | "science";
  /** Vertically centers short stage content (landings) — kills dead space. */
  center?: boolean;
  /** Full-stage-width hero rendered above the doc column. When present the
   *  shell's title strip renders sr-only — the hero IS the visible title. */
  hero?: ReactNode;
}

/**
 * Shared workspace frame for the Field research family.
 *
 * /field keeps its richer analysis-specific rails. This frame handles the
 * Field Hub and State-of-the-Index/data surfaces so the family shares one
 * global shell without flattening their page-specific content.
 */
export function FieldWorkspaceFrame({
  title,
  children,
  status,
  right,
  rightTitle = "RESEARCH",
  rightDefaultOpen = true,
  current,
  center = false,
  hero,
}: Props) {
  return (
    <WorkspaceShell
      active="field"
      editorialStage
      title={title}
      bareTitle
      leftTitle="RESEARCH"
      topic="field"
      left={<FieldFamilyNav current={current} />}
      rightTitle={rightTitle}
      right={right}
      rightDefaultOpen={rightDefaultOpen}
      leftWidth={280}
      rightWidth={240}
      status={status ?? <>FIELD RESEARCH · SIGNALAF × SIGRANK · MO§ES™</>}
    >
      {hero && <div className="ws-hero">{hero}</div>}
      <div className={`ws-doc ws-doc-wide${center ? " ws-center" : ""}`}>{children}</div>
    </WorkspaceShell>
  );
}
