import type { ReactNode } from "react";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

/** Every page under this folder renders inside the editorial frame (tools topic). */
export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <EditorialWorkspaceFrame topic="tools">{children}</EditorialWorkspaceFrame>;
}
