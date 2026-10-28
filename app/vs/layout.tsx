import type { ReactNode } from "react";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

/** Every page under this folder renders inside the editorial frame (compare topic). */
export default function CompareLayout({ children }: { children: ReactNode }) {
  return <EditorialWorkspaceFrame topic="compare">{children}</EditorialWorkspaceFrame>;
}
