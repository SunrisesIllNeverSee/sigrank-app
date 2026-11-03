import type { ReactNode } from "react";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

/** Every page under this folder renders inside the editorial frame (evaluation topic). */
export default function ConfirmationHackingLayout({ children }: { children: ReactNode }) {
  return <EditorialWorkspaceFrame topic="evaluation">{children}</EditorialWorkspaceFrame>;
}
