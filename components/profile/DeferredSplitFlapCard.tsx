"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import type { SplitFlapCard as SplitFlapCardComponent } from "@/components/signature/SplitFlapCard";

const SplitFlapCard = dynamic(
  () => import("@/components/signature/SplitFlapCard").then((module) => module.SplitFlapCard),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse rounded-lg border border-bg-border bg-bg-base/40" />
    ),
  },
);

type Props = ComponentProps<typeof SplitFlapCardComponent>;

/**
 * Keep the profile identity and core metrics on the critical path. The animated
 * departures board is decorative, so hydrate it only when it nears the viewport.
 */
export function DeferredSplitFlapCard(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{visible ? <SplitFlapCard {...props} /> : <div className="h-48" />}</div>;
}
