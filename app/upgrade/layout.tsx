import type { ReactNode } from "react";
import { EditorialWorkspaceFrame } from "@/components/live/EditorialWorkspaceFrame";

/** Every page under this folder renders inside the editorial frame (support topic). Checkout pages: no writing credit. */
export default function UpgradeLayout({ children }: { children: ReactNode }) {
  return <EditorialWorkspaceFrame topic="support" credit={false}>{children}</EditorialWorkspaceFrame>;
}
