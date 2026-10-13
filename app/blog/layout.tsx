import type { ReactNode } from "react";
import { UnifiedShare } from "@/components/share/UnifiedShare";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <div>
    <div className="mx-auto flex max-w-5xl justify-end px-5 pt-3">
      <UnifiedShare title="SignalAF · Article" markdown editorial compact />
    </div>
    {children}
    <div className="mx-auto flex max-w-5xl justify-end px-5 pb-8 pt-3">
      <UnifiedShare title="SignalAF · Article" markdown editorial compact />
    </div>
  </div>;
}
