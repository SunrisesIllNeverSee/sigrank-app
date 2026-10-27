import type { ReactNode } from "react";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

/** Every page under this folder renders inside the editorial frame (alternatives topic). */
export default function AlternativesLayout({ children }: { children: ReactNode }) {
  return <EditorialWorkspaceFrame topic="alternatives">{children}</EditorialWorkspaceFrame>;
}
