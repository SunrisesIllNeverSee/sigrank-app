import type { ReactNode } from "react";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

/** Every page under this folder renders inside the editorial frame (guides topic). */
export default function GuidesLayout({ children }: { children: ReactNode }) {
  return <EditorialWorkspaceFrame topic="guides">{children}</EditorialWorkspaceFrame>;
}
