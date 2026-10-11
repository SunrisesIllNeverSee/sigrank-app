import type { ReactNode } from "react";

export function CompareStage({ children }: { children: ReactNode }) {
  return <div className="ws-cmp-stage">{children}</div>;
}
