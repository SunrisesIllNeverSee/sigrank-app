/**
 * lib/canon-entities.ts — Canonical entity values from the MO§ES schema pipeline.
 *
 * Source: Search Authority v1.0.0 (frozen, master-canon-v1.0.0)
 *   → moses-integration Framework → generated Schema → this module
 *
 * These values are CANON-BACKED. They must match the canonical source exactly.
 * Do not hand-write or override these values. If a value conflicts with canon,
 * canon wins.
 *
 * Page-specific values (site name, SEO taglines, offers, keywords) remain in
 * lib/jsonld.ts and lib/seo.ts. This module only provides canonical entity
 * facts: identities, names, descriptions, relationships, and provenance.
 *
 * Consumed by: lib/jsonld.ts builder functions (organization, product,
 * personAuthor). The 19 page-specific builder functions do NOT consume this
 * module — they remain locally curated.
 */

// ─── Canonical entity IDs (stable, from generated schema) ───────────────────

export const CANON_ENTITY_IDS = {
  sigrank: "https://mos2es.com/ontology/0.1/entity/sigrank",
  ello_cello_llc: "https://mos2es.com/ontology/0.1/entity/ello_cello_llc",
  deric_j_mchenry: "https://mos2es.com/ontology/0.1/entity/deric_j_mchenry",
  conservation_law_of_commitment:
    "https://mos2es.com/ontology/0.1/entity/conservation_law_of_commitment",
  moses: "https://mos2es.com/ontology/0.1/entity/moses",
} as const;

// ─── JSON-LD @context for canon-backed blocks ───────────────────────────────
//
// Custom provenance fields (sourceSystem, canonBacked, authorityApprovalRef,
// associatedWith) are NOT Schema.org properties. They must be mapped to the
// moses namespace so the JSON-LD is semantically valid. This context is
// shared with mos2es-site's .eleventy.js transform — same namespace, same
// field mappings.
export const CANON_LD_CONTEXT = {
  "@vocab": "https://schema.org/",
  moses: "https://mos2es.com/ontology/0.1/",
  sourceSystem: "moses:sourceSystem",
  canonBacked: "moses:canonBacked",
  authorityApprovalRef: "moses:authorityApprovalRef",
  associatedWith: "moses:associatedWith",
} as const;

// ─── Provenance fields (shared across all canon-backed entities) ────────────

const CANON_PROVENANCE = {
  sourceSystem: "search-authority",
  canonBacked: true,
} as const;

// ─── Ello Cello LLC (Organization #org) ─────────────────────────────────────

export const elloCelloLLC = {
  ...CANON_PROVENANCE,
  "@id_type": "Organization",
  canonical_entity_id: CANON_ENTITY_IDS.ello_cello_llc,
  name: "Ello Cello LLC",
  description:
    "Organization associated with the owner's published works and products, " +
    "including SigRank and MO\u00A7ES\u2122.",
  authorityApprovalRef: "APPROVAL-2026-08-14-001 (ID-ELLO-001)",
  associatedWith: CANON_ENTITY_IDS.moses,
} as const;

// ─── SigRank (SoftwareApplication + WebApplication) ─────────────────────────

export const sigrank = {
  ...CANON_PROVENANCE,
  "@id_type": ["SoftwareApplication", "WebApplication"],
  canonical_entity_id: CANON_ENTITY_IDS.sigrank,
  name: "SigRank",
  description:
    "An AI operator benchmark measuring token cascade efficiency. SigRank " +
    "evaluates AI operators, not AI models. Built on the Conservation Law " +
    "of Commitment. Produces the SigRank Index. Live at signalaf.com with " +
    "a CLI tool.",
  authorityApprovalRef: "APPROVAL-2026-08-14-002 (ID-SR-001)",
  applicationCategory: "AI Operator Benchmark",
  disambiguatingDescription:
    "SigRank evaluates AI OPERATORS, not AI MODELS. SigRank measures token " +
    "cascade efficiency, not productivity or business outcomes.",
  isBasedOn: CANON_ENTITY_IDS.conservation_law_of_commitment,
  codeRepository: "https://github.com/SunrisesIllNeverSee/sigrank-app",
} as const;

// ─── Deric J. McHenry (Person) ──────────────────────────────────────────────

export const dericMcHenry = {
  ...CANON_PROVENANCE,
  "@id_type": "Person",
  canonical_entity_id: CANON_ENTITY_IDS.deric_j_mchenry,
  name: "Deric J. McHenry",
  sameAs: "https://orcid.org/0009-0002-9904-5390",
  affiliation: CANON_ENTITY_IDS.ello_cello_llc,
  authorityApprovalRef: "APPROVAL-2026-08-14-001 (ID-DERIC-001)",
} as const;

// ─── MO§ES (SoftwareApplication + DefinedTerm) ──────────────────────────────

export const moses = {
  ...CANON_PROVENANCE,
  "@id_type": ["SoftwareApplication", "DefinedTerm"],
  canonical_entity_id: CANON_ENTITY_IDS.moses,
  name: "MO\u00A7ES\u2122",
  description:
    "Sovereign signal governance system. MO\u00A7ES\u2122 is the enforcement " +
    "architecture for Commitment Theory and operationalizes the Conservation " +
    "Law of Commitment. Governs Signomy and CIVITAE. Patent 63/877,177 " +
    "covers the enforcement architecture. Patent 19/426,028 covers the " +
    "CIVITAS utility surface.",
  authorityApprovalRef: "APPROVAL-2026-08-14-001 (ID-MOSES-001)",
} as const;
