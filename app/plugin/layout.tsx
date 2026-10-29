import type { ReactNode } from "react";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

/** Every page under this folder renders inside the editorial frame (docs topic). */
export default function PluginLayout({ children }: { children: ReactNode }) {
  return <EditorialWorkspaceFrame topic="docs">{children}</EditorialWorkspaceFrame>;
}
