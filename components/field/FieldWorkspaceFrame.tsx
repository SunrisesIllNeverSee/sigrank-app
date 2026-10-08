import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { WaveHero } from "@/components/ui/WaveHero";

/**
 * The Field family's left-rail nav — the space's entries as compact wave
 * banners (per owner: the hub's hero cards become the rail navigation —
 * all three family pages, current page marked). Articles stays a link.
 */
export function FieldFamilyNav({
  current,
}: {
  /** The page currently being viewed — its banner gets the accent mark. */
  current?: "fieldhub" | "field" | "research";
}) {
  const items = [
    {
      id: "fieldhub" as const,
      href: "/fieldhub",
      eyebrow: "SigRank Research",
      title: "Field Hub",
      subtitle: "The research landing — start here.",
    },
    {
      id: "field" as const,
      href: "/field",
      eyebrow: "Field Analysis",
      title: "Field Analysis",
      subtitle: "The true distribution of token efficiency.",
    },
    {
      id: "research" as const,
      href: "/research",
      eyebrow: "SigRank Index",
      title: "State of the Index",
      subtitle: "The seed dataset · Zenodo DOI.",
    },
  ];
  return (
    <>
      <div className="mini-h"><span className="sq" />RESEARCH</div>
      <nav className="flex flex-col gap-2" aria-label="Field research">
        {items.map((it) => (
          <Link
            key={it.id}
            href={it.href}
            className={`block rounded-xl ${current === it.id ? "ws-bnav-on" : ""}`}
            aria-current={current === it.id ? "page" : undefined}
          >
            <WaveHero
              compact
              headingLevel="h2"
              eyebrow={it.eyebrow}
              title={it.title}
              subtitle={it.subtitle}
            />
          </Link>
        ))}
      </nav>
      <nav className="ws-nav" style={{ marginTop: 6 }}>
        <Link href="/blog">Articles ↗</Link>
      </nav>
    </>
  );
}

interface Props {
  title: string;
  children: ReactNode;
  status?: ReactNode;
  right?: ReactNode;
  rightTitle?: string;
  rightDefaultOpen?: boolean;
  /** Which family page this is — marks the active banner in the rail. */
  current?: "fieldhub" | "field" | "research";
  /** Vertically centers short stage content (landings) — kills dead space. */
  center?: boolean;
}

/**
 * Shared workspace frame for the Field research family.
 *
 * /field keeps its richer analysis-specific rails. This frame handles the
 * Field Hub and State-of-the-Index/data surfaces so the family shares one
 * global shell without flattening their page-specific content.
 */
export function FieldWorkspaceFrame({
  title,
  children,
  status,
  right,
  rightTitle = "RESEARCH",
  rightDefaultOpen = true,
  current,
  center = false,
}: Props) {
  return (
    <WorkspaceShell
      active="field"
      title={title}
      leftTitle="FIELD"
      left={
        <>
          <FieldFamilyNav current={current} />
          <div className="mod">
            <div className="mini-h"><span className="sq" />SYSTEM</div>
            <nav className="ws-nav">
              <Link href="/wiki">Wiki</Link>
              <Link href="/methodology">Methodology</Link>
              <Link href="/board/all">Live leaderboard</Link>
            </nav>
          </div>
        </>
      }
      rightTitle={rightTitle}
      right={right}
      rightDefaultOpen={rightDefaultOpen}
      leftWidth={280}
      rightWidth={240}
      status={status ?? <>FIELD RESEARCH · SIGNALAF × SIGRANK · MO§ES™</>}
    >
      <div className={`ws-doc ws-doc-wide${center ? " ws-center" : ""}`}>{children}</div>
    </WorkspaceShell>
  );
}
