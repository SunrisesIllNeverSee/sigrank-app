/**
 * components/seo/CitationMeta.tsx — Google Scholar citation meta tags.
 *
 * Renders the citation_* <meta> tags that Google Scholar looks for to index
 * articles. Without these, articles won't appear in Scholar search results.
 *
 * Usage:
 *   <CitationMeta
 *     title="Article Title"
 *     description="Abstract..."
 *     date="2026-08-10"
 *     slug="/blog/my-article"
 *     doi="10.5281/zenodo.12345"
 *   />
 */

interface CitationMetaProps {
  title: string;
  description: string;
  date: string;
  slug: string;
  doi?: string;
}

export function CitationMeta({ title, description, date, slug, doi }: CitationMetaProps) {
  const tags = [
    { name: "citation_title", content: title },
    { name: "citation_author", content: "McHenry, Deric J." },
    { name: "citation_publication_date", content: date },
    { name: "citation_journal_title", content: "SigRank" },
    { name: "citation_publisher", content: "MO§ES™ Research" },
    { name: "citation_abstract", content: description },
    { name: "citation_pdf_url", content: `https://signalaf.com${slug}` },
    { name: "citation_fulltext_html_url", content: `https://signalaf.com${slug}` },
    ...(doi ? [{ name: "citation_doi", content: doi }] : []),
  ];

  return (
    <>
      {tags.map((tag) => (
        <meta key={tag.name} name={tag.name} content={tag.content} />
      ))}
    </>
  );
}
