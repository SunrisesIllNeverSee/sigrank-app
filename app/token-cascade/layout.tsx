import type { ReactNode } from "react";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

/** Every page under this folder renders inside the editorial frame (concepts topic). */
export default function TokenCascadeLayout({ children }: { children: ReactNode }) {
  return <EditorialWorkspaceFrame topic="concepts">{children}</EditorialWorkspaceFrame>;
}
