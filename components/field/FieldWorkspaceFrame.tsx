import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { WaveHero } from "@/components/ui/WaveHero";

/**
 * The Field family's left-rail nav — the space's entries as compact wave
 * banners (per owner: the hub's hero cards become the rail navigation —
 * all family pages, current page marked). Owner direction: this is the
 * SIGRANK section — one banner stack for every text surface, Home as the
 * opening entry, shared by Field pages, Blog, and Wiki rails.
 */
export function FieldFamilyNav({
  current,
}: {
  /** The page currently being viewed — its banner gets the accent mark. */
  current?: "home" | "fieldhub" | "field" | "research" | "wiki" | "blog";
}) {
  const items = [
    {
      id: "home" as const,
      href: "/",
      eyebrow: "INDEX",
      title: "Home",
      subtitle: "The signal console — start here.",
    },
    {
      id: "fieldhub" as const,
      href: "/fieldhub",
      eyebrow: "RESEARCH",
      title: "Field Hub",
      subtitle: "The research landing — start here.",
    },
    {
      id: "field" as const,
      href: "/field",
      eyebrow: "RESEARCH",
      title: "Field Analysis",
      subtitle: "The true distribution of token efficiency.",
      tint: { ["--gold" as string]: "var(--rank-3)" },
      ec: "var(--rank-3)",
    },
    {
      id: "research" as const,
      href: "/research",
      eyebrow: "RESEARCH",
      title: "State of the Index",
      subtitle: "The seed dataset · Zenodo DOI.",
      tint: { ["--gold" as string]: "var(--accent)", ["--accent" as string]: "var(--class-seeker)" },
      ec: "var(--accent)",
    },
    {
      id: "wiki" as const,
      href: "/wiki",
      eyebrow: "WIKI",
      title: "Wiki",
      subtitle: "The evidence layer — every metric defined.",
      tint: { ["--gold" as string]: "var(--rank-2)" },
      ec: "var(--rank-2)",
    },
    {
      id: "blog" as const,
      href: "/blog",
      eyebrow: "BLOG",
      title: "Articles",
      subtitle: "Published analysis & field notes.",
      tint: { ["--gold" as string]: "var(--rank-low)" },
      ec: "var(--rank-low)",
    },
  ];
  return (
    <>
      <div className="mini-h"><span className="sq" />INDEX</div>
      <nav className="ws-bnav flex flex-col gap-2" aria-label="SigRank text surfaces">
        {items.map((it) => (
          <Link
            key={it.id}
            href={it.href}
            className={`block rounded-xl ${current === it.id ? "ws-bnav-on" : ""}`}
            aria-current={current === it.id ? "page" : undefined}
            style={"tint" in it ? it.tint : undefined}
          >
            <WaveHero
              compact
              headingLevel="h2"
              eyebrow={<span style={{ color: "ec" in it ? it.ec : "var(--mut)" }}>{it.eyebrow}</span>}
              title={it.title}
              subtitle={it.subtitle}
            />
          </Link>
        ))}
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
  /** Full-stage-width hero rendered above the doc column. When present the
   *  shell's title strip renders sr-only — the hero IS the visible title. */
  hero?: ReactNode;
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
  hero,
}: Props) {
  return (
    <WorkspaceShell
      active="field"
      title={title}
      bareTitle={hero != null}
      leftTitle="RESEARCH"
      left={
        <>
          <FieldFamilyNav current={current} />
          <div className="mod">
            <div className="mini-h"><span className="sq" />SYSTEM</div>
            <nav className="ws-nav">
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
      {hero && <div className="ws-hero">{hero}</div>}
      <div className={`ws-doc ws-doc-wide${center ? " ws-center" : ""}`}>{children}</div>
    </WorkspaceShell>
  );
}
