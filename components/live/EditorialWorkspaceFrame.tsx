import type { ReactNode } from "react";
import { WorkspaceShell, type WorkspaceNav } from "./WorkspaceShell";
import { EditorialNav, type WorkspaceDocument, type WorkspaceTopic } from "./EditorialSidebar";

/** Rail icon lit for each topic (topics without their own icon light HOME). */
const RAIL: Record<WorkspaceTopic, WorkspaceNav> = {
  home: "home",
  field: "field",
  articles: "blog",
  blog: "blog",
  wiki: "wiki",
  guides: "wiki",
  tools: "wiki",
  compare: "compare",
  alternatives: "compare",
  evaluation: "compare",
  support: "home",
  legal: "home",
};

const SECTION: Record<WorkspaceTopic, string> = {
  home: "SIGRANK",
  field: "RESEARCH",
  articles: "PUBLISHING",
  blog: "PUBLISHING",
  wiki: "ENTRY",
  guides: "GUIDES",
  tools: "TOOLS",
  compare: "COMPARE",
  alternatives: "ALTERNATIVES",
  evaluation: "EVALUATION",
  support: "HELP",
  legal: "LEGAL",
};

interface Props {
  /** Editorial topic: picks the TOPICS tree branch and the rail icon. */
  topic: WorkspaceTopic;
  /** Rail icon override (e.g. /settings keeps PROFILE lit). */
  rail?: WorkspaceNav;
  /** Page name. Visible in the title strip only with `titleStrip`; otherwise
   *  the page's own hero/h1 is the visible title. */
  title?: string;
  /** Render `title` as a visually-hidden h1 (content has no h1 of its own). */
  srOnlyTitle?: boolean;
  /** Show the shell's title strip (app pages without a hero, e.g. /settings). */
  titleStrip?: boolean;
  /** Full-stage-width hero above the page. */
  hero?: ReactNode;
  children: ReactNode;
  right?: ReactNode;
  rightTitle?: string;
  rightDefaultOpen?: boolean;
  status?: ReactNode;
  /** Centered editorial stage layout (text spacing, measure). */
  editorialStage?: boolean;
  /** Writing-credit footer under the page. Off for app pages. */
  credit?: boolean;
  /** Collection entries for the active topic (defaults to the static PAGES list). */
  documents?: WorkspaceDocument[];
  /** Replaces the auto-discovered h2 section list under the active page. */
  pageContents?: ReactNode;
}

/**
 * Shared workspace frame for the text pages outside the Field / Blog / Wiki
 * families. Same contract as FieldWorkspaceFrame and BlogWorkspaceFrame:
 * one EditorialNav tree on the left (TOPIC > DOCUMENT > PAGE, sections found
 * from the page's h2s), the page's own content and hero in the stage,
 * optional context modules right, rails 280 / 240.
 */
export function EditorialWorkspaceFrame({
  topic,
  rail,
  title,
  srOnlyTitle = false,
  titleStrip = false,
  hero,
  children,
  right,
  rightTitle = "CONTEXT",
  rightDefaultOpen,
  status,
  editorialStage = true,
  credit = true,
  documents,
  pageContents,
}: Props) {
  return (
    <WorkspaceShell
      active={rail ?? RAIL[topic]}
      editorialStage={editorialStage}
      editorialCredit={credit}
      title={title}
      bareTitle={!titleStrip}
      srOnlyTitle={!titleStrip && srOnlyTitle}
      hero={hero}
      leftTitle={SECTION[topic]}
      topic={topic}
      left={<EditorialNav current={topic} documents={documents} pageContents={pageContents} />}
      rightTitle={rightTitle}
      right={right}
      rightDefaultOpen={rightDefaultOpen}
      leftWidth={280}
      rightWidth={240}
      status={status ?? <>{SECTION[topic]} · SIGNALAF × SIGRANK · MO§ES™</>}
    >
      {children}
    </WorkspaceShell>
  );
}
