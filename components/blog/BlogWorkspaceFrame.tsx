import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { FieldFamilyNav } from "@/components/field/FieldWorkspaceFrame";

interface Props {
  children: ReactNode;
  status?: ReactNode;
  section?: "articles" | "blog";
  articleTitle?: string;
  doi?: string;
  /** Verified markdown section anchors, provided by the article renderer. */
  pageSections?: { id: string; label: string }[];
}

/**
 * Shared workspace frame for long-form Blog routes.
 *
 * The article remains the primary object: right rail is closed by default,
 * the left rail is deliberately small, and collapsing the left panel gives
 * a clean reader surface without creating a second article renderer.
 */
export function BlogWorkspaceFrame({ children, status, section = "blog", articleTitle, doi, pageSections }: Props) {
  return (
    <WorkspaceShell
      active="blog"
      editorialStage
      bareTitle
      title={section === "articles" ? "ARTICLES" : "BLOG"}
      leftTitle="PUBLISHING"
      topic={section}
      left={<FieldFamilyNav current={section} pageContents={pageSections?.length ? (
        <nav className="ws-nav" aria-label="Sections on this page">
          {pageSections.map((item) => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}
        </nav>
      ) : undefined} />}
      rightTitle={section === "articles" ? "CITATION" : "READER"}
      rightDefaultOpen={section === "articles"}
      right={
        <div className="mod">
          {section === "articles" ? (
            <>
              <div className="mini-h"><span className="sq" />PUBLICATION</div>
              <p className="ws-note">{articleTitle ?? "Published analysis"}</p>
              {doi && (
                <nav className="ws-nav" style={{ marginTop: 10 }}>
                  <a href={"https://doi.org/" + doi} rel="external">DOI: {doi} ↗</a>
                </nav>
              )}
              <p className="ws-note" style={{ marginTop: 12 }}>
                Original text and source citations are preserved in the article.
              </p>
            </>
          ) : (
            <>
              <div className="mini-h"><span className="sq" />READING MODE</div>
              <p className="ws-note">
                Collapse either side panel to widen the reading column.
                Article content, citations, and structured data remain unchanged.
              </p>
            </>
          )}
        </div>
      }
      leftWidth={280}
      rightWidth={240}
      status={status ?? <>ANALYSIS &amp; RESEARCH · SIGNALAF × SIGRANK · MO§ES™</>}
    >
      <div className="ws-doc ws-article">{children}</div>
    </WorkspaceShell>
  );
}
