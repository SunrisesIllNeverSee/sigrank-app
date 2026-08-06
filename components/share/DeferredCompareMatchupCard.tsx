"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import type { CompareMatchupCard as CompareMatchupCardComponent } from "./CompareMatchupCard";

const CompareMatchupCard = dynamic(
  () => import("./CompareMatchupCard").then((module) => module.CompareMatchupCard),
  {
    ssr: false,
    loading: () => (
      <div className="h-12 animate-pulse rounded-lg border border-bg-border bg-bg-base/40" />
    ),
  },
);

type Props = ComponentProps<typeof CompareMatchupCardComponent>;

/**
 * The image-capture card pulls html-to-image and a sizeable off-screen canvas.
 * It sits below the primary comparison, so only load it as the reader approaches it.
 */
export function DeferredCompareMatchupCard(props: Props) {
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
      { rootMargin: "320px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{visible ? <CompareMatchupCard {...props} /> : <div className="h-12" />}</div>;
}
