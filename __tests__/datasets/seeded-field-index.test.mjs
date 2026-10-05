/**
 * __tests__/datasets/seeded-field-index.test.mjs
 *
 * Structural lint for the canonical seeded-field index and the Proofpress
 * repo-local pilot. The repo has no YAML dependency, so this is a
 * deliberately conservative structural check — it enforces the invariants
 * the index exists to guarantee:
 *
 *   - every registry file exists and carries a version stamp
 *   - record IDs are unique and well-formed
 *   - status/role values stay inside the declared vocabularies
 *   - every cross-file reference (POP-, CLS-, SRC-, GAP-, IDX-, ER-, CAND-,
 *     DIST-) resolves to a defined record
 *   - evidence receipts use kernel-valid locator kinds and real sha256 digests
 *   - candidates remain unapproved (Human Approval boundary)
 *   - the raw corpus anchor (POP-RAW-1628 / SRC-SEED-001) is intact
 *
 * Runs with `node --test` — no extra harness, no network.
 *
 *   node --test __tests__/datasets/seeded-field-index.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = new URL("../../", import.meta.url).pathname;
const INDEX_DIR = join(ROOT, "datasets/seeded-field");
const PP_DIR = join(ROOT, ".proofpress");

const INDEX_FILES = [
  "README.md",
  "index.yaml",
  "sources.yaml",
  "fields.yaml",
  "metrics.yaml",
  "populations.yaml",
  "classifications.yaml",
  "surfaces.yaml",
  "gaps.yaml",
  "contracts/operator-record.yaml",
  "contracts/distributions.yaml",
];

const STATUS_VOCAB = new Set([
  "current", "historical", "superseded", "unresolved",
  "excluded_from_index_surfaces", "candidate",
]);

const ROLE_VOCAB = new Set([
  "raw_authority", "supporting_raw", "reference_copy", "historical_evidence",
  "current_published", "implementation", "interpretation_surface",
  "upstream_dependency", "sensitive_private",
]);

const LOCATOR_KINDS = new Set([
  "text_span", "page_span", "section_span", "spreadsheet_cell", "json_pointer",
]);

const SHA256_RE = /^sha256:[0-9a-f]{64}$/;
const ID_RE = /- id: ([A-Z]+-[A-Z0-9-]+)/g;
const REF_RE = /\b(POP|CLS|SRC|GAP|IDX|ER|CAND|DIST)-[A-Za-z0-9-]+/g;

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function idsOf(text) {
  return [...text.matchAll(ID_RE)].map((m) => m[1]);
}

// ---------------------------------------------------------------- files

test("all index files exist", () => {
  for (const f of INDEX_FILES) {
    assert.ok(existsSync(join(INDEX_DIR, f)), `missing ${f}`);
  }
  assert.ok(existsSync(join(PP_DIR, "context-policy.yaml")), "missing policy");
  assert.equal(readdirSync(join(PP_DIR, "evidence")).length, 7, "expected 7 evidence receipts");
  assert.equal(readdirSync(join(PP_DIR, "candidates")).length, 6, "expected 6 candidates");
});

test("index yaml files carry a version stamp", () => {
  for (const f of INDEX_FILES.filter((f) => f.endsWith(".yaml"))) {
    assert.match(read(`datasets/seeded-field/${f}`), /^version: /m, `${f} missing version`);
  }
});

// ------------------------------------------------------------ id hygiene

test("record ids are unique within each registry file", () => {
  for (const f of ["index.yaml", "sources.yaml", "populations.yaml",
                   "classifications.yaml", "surfaces.yaml", "gaps.yaml"]) {
    const ids = idsOf(read(`datasets/seeded-field/${f}`));
    const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
    assert.deepEqual(dupes, [], `${f} has duplicate ids: ${dupes}`);
  }
});

// ------------------------------------------------------- vocab discipline

test("status values stay inside the declared vocabulary", () => {
  const files = [
    "index.yaml", "sources.yaml", "fields.yaml", "metrics.yaml",
    "populations.yaml", "classifications.yaml", "surfaces.yaml", "gaps.yaml",
    "contracts/operator-record.yaml", "contracts/distributions.yaml",
  ];
  for (const f of files) {
    const text = read(`datasets/seeded-field/${f}`);
    for (const m of text.matchAll(/^\s+status: ([a-z_]+)/gm)) {
      assert.ok(STATUS_VOCAB.has(m[1]), `${f}: undeclared status '${m[1]}'`);
    }
  }
});

test("role values in sources.yaml stay inside the declared vocabulary", () => {
  const text = read("datasets/seeded-field/sources.yaml");
  for (const m of text.matchAll(/^\s+role: ([a-z_]+)/gm)) {
    assert.ok(ROLE_VOCAB.has(m[1]), `undeclared role '${m[1]}'`);
  }
});

test("gap types stay inside the declared vocabulary", () => {
  const types = new Set(["OPEN-EVIDENCE", "OPEN-DECISION", "HISTORICAL-CONFLICT",
                         "BLOCKING", "CLOSED-EVIDENCE", "CLOSED-DECISION"]);
  const text = read("datasets/seeded-field/gaps.yaml");
  for (const m of text.matchAll(/^\s+type: ([A-Z-]+)/gm)) {
    assert.ok(types.has(m[1]), `undeclared gap type '${m[1]}'`);
  }
});

// ------------------------------------------------- cross-file references

test("all cross-file record references resolve", () => {
  const defined = new Set();
  for (const f of ["index.yaml", "sources.yaml", "populations.yaml",
                   "classifications.yaml", "gaps.yaml",
                   "contracts/distributions.yaml"]) {
    idsOf(read(`datasets/seeded-field/${f}`)).forEach((id) => defined.add(id));
  }
  for (const dir of ["evidence", "candidates"])
    for (const f of readdirSync(join(PP_DIR, dir))) {
      const m = f.match(/^((?:CAND|ER)-\d+[a-z]?)/);
      if (m) defined.add(m[1]);
    }

  const files = [
    ...INDEX_FILES.filter((f) => f.endsWith(".yaml")).map((f) => `datasets/seeded-field/${f}`),
    ...readdirSync(join(PP_DIR, "evidence")).map((f) => `.proofpress/evidence/${f}`),
    ...readdirSync(join(PP_DIR, "candidates")).map((f) => `.proofpress/candidates/${f}`),
  ];
  const unresolved = [];
  for (const f of files) {
    // strip full-line comments — comment headers legitimately name ids they
    // don't need to define (e.g. "# ER-001 — supports CAND-001")
    const stripped = read(f).split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
    for (const m of stripped.matchAll(REF_RE)) {
      const ref = m[0];
      // strip list-indexing suffixes like SRC-SEED-001 (a defined id)
      if (!defined.has(ref)) unresolved.push(`${f}: ${ref}`);
    }
  }
  assert.deepEqual(unresolved, [], "unresolved references");
});

// --------------------------------------------------------- proofpress

test("evidence receipts use kernel-valid locator kinds and sha256 digests", () => {
  for (const f of readdirSync(join(PP_DIR, "evidence"))) {
    const text = readFileSync(join(PP_DIR, "evidence", f), "utf8");
    assert.match(text, /^schema_version: proofpress\/retrieval-evidence\/v1$/m,
      `${f}: wrong schema_version`);
    const kind = text.match(/^\s+kind: ([a-z_]+)$/m);
    assert.ok(kind && LOCATOR_KINDS.has(kind[1]), `${f}: invalid locator.kind`);
    // every digest field must be a well-formed sha256
    for (const m of text.matchAll(/(content_digest|text_digest|quote_digest|config_digest): (\S+)/g)) {
      assert.ok(SHA256_RE.test(m[2]), `${f}: malformed ${m[1]} '${m[2]}'`);
    }
    // json_pointer locators must carry exactly {kind, value}
    if (kind && kind[1] === "json_pointer") {
      const block = text.split("locator:")[1].split("retrieval:")[0];
      const keys = [...block.matchAll(/^ {2}(\w+):/gm)].map((k) => k[1]);
      assert.deepEqual(keys.sort(), ["kind", "value"], `${f}: json_pointer must be exactly {kind, value}`);
      assert.match(block, /value: \/(?:[^~]|~[01])*/, `${f}: value must be RFC 6901`);
    }
    // text_span locators must carry {kind, start, end, text_digest}
    if (kind && kind[1] === "text_span") {
      const block = text.split("locator:")[1].split("retrieval:")[0];
      for (const k of ["start", "end", "text_digest"])
        assert.ok(block.includes(`${k}:`), `${f}: text_span missing ${k}`);
    }
  }
});

test("candidates remain unapproved (Human Approval boundary)", () => {
  for (const f of readdirSync(join(PP_DIR, "candidates"))) {
    const text = readFileSync(join(PP_DIR, "candidates", f), "utf8");
    assert.match(text, /^status: candidate(\s*#.*)?$/m, `${f}: candidate not in candidate state`);
    assert.match(text, /review_required: human-owner/, `${f}: Human Approval gate not recorded`);
    assert.doesNotMatch(text, /^status: (approved|admitted)/m, `${f}: approval state found — agents may not approve`);
    assert.match(text, /evidence_receipts: \[ER-/, `${f}: no evidence receipts bound`);
  }
});

test("context policy records the implementation pin and Human Approval boundary", () => {
  const text = read(".proofpress/context-policy.yaml");
  assert.match(text, /^ {2}pinned_commit: "[0-9a-f]+"/m, "no pinned_commit");
  assert.match(text, /repo: chenmingtang830\/proofpress/, "wrong/absent repo");
  assert.match(text, /search-authority/, "authority plane not declared");
});

// ------------------------------------------------------- corpus anchors

test("raw corpus anchor is intact", () => {
  const pops = read("datasets/seeded-field/populations.yaml");
  assert.match(pops, /id: POP-RAW-1628[\s\S]*?resulting_n: 1628/, "raw corpus population record broken");
  const src = read("datasets/seeded-field/sources.yaml");
  assert.match(src, /id: SRC-SEED-001[\s\S]*?sha256: 9e1a3d727cd132f7d5e1a10991068e9572407b485764ad776ff6eb57a92a4586/,
    "raw corpus sha256 anchor missing");
  assert.match(src, /path: launch\/research\/scientific-dataset\/PRIVATE_handle-mapping\.json/,
    "private mapping path must point at its real location");
});

test("The Field synthetic entity carries the exclusion warning", () => {
  const pops = read("datasets/seeded-field/populations.yaml");
  assert.match(pops, /id: POP-FIELD-001[\s\S]*?NEVER be counted as an independent empirical observation/,
    "GAP-013 exclusion rule missing from synthetic entity");
});

// ----------------------------------------- evidence locator binding check

// The kernel checks only that end-start == len(quote); it does NOT verify the
// span actually contains the quote. This test recomputes the real binding:
// sha256(source_bytes[start:end]) == locator.text_digest == sha256(quote) for
// text_span, and pointer resolution == quote for json_pointer.
//
// Sources resolve without network:
//   github:SunrisesIllNeverSee/sigrank-app@<sha>:<path>  -> `git show` in this repo
//   github:SunrisesIllNeverSee/sigrank-gtm@<sha>:<path>  -> SIGRANK_GTM_CHECKOUT env
//       or a sibling checkout containing the pinned sha (skipped if absent)
//   file:<path>                                        -> direct read
//   npm: / doi:                                        -> skipped (network)

const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");

const GTM_CANDIDATES = [
  process.env.SIGRANK_GTM_CHECKOUT,
  join(ROOT, "..", "..", "SigRank-gtm"),
  join(process.env.HOME || "", "Developer/active/SigRank-gtm"),
].filter(Boolean);

function gitShow(dir, sha, rel) {
  try {
    return execFileSync("git", ["-C", dir, "show", `${sha}:${rel}`], {
      maxBuffer: 64 * 1024 * 1024,
    }).toString("utf8");
  } catch {
    return null;
  }
}

function resolveSource(uri) {
  if (uri.startsWith("file:")) {
    const p = uri.slice(5);
    return existsSync(p) ? readFileSync(p, "utf8") : null;
  }
  const m = uri.match(/^github:([^/@]+\/[^/@]+)@([0-9a-f]{40}):(.+)$/);
  if (!m) return null;
  const [, repo, sha, rel] = m;
  const dirs = repo.endsWith("sigrank-app") ? [ROOT] : repo.endsWith("sigrank-gtm") ? GTM_CANDIDATES : [];
  for (const dir of dirs) {
    const body = gitShow(dir, sha, rel);
    if (body !== null) return body;
  }
  return null;
}

function jsonPointer(doc, ptr) {
  return ptr.split("/").slice(1).reduce((n, k) =>
    n?.[k.replace(/~1/g, "/").replace(/~0/g, "~")], doc);
}

function yamlScalars(text) {
  // minimal extraction — keys used below are unique within a receipt file
  const get = (key) => text.match(new RegExp(`^\\s*${key}: (.+)$`, "m"))?.[1].trim();
  const num = (key) => Number(get(key));
  return { get, num };
}

test("evidence receipt locators bind to their pinned sources", () => {
  const files = readdirSync(join(PP_DIR, "evidence")).filter((f) => f.endsWith(".yaml"));
  let bound = 0;
  const skipped = [];
  for (const f of files) {
    const id = f.replace(".yaml", "");
    const { get, num } = yamlScalars(read(join(".proofpress/evidence", f)));

    const uri = get("uri").replace(/^"|"$/g, "");
    const body = resolveSource(uri);
    if (body === null) { skipped.push(`${id} (${uri.split(":")[0]})`); continue; }

    const kind = get("kind");
    if (kind === "text_span") {
      // bind through digests: sha256(source[start:end]) must equal both
      // locator.text_digest and quote_digest — proves the span IS the quote
      const spanDigest = `sha256:${sha256(body.slice(num("start"), num("end")))}`;
      assert.equal(get("text_digest"), spanDigest,
        `${id}: source span digest != locator.text_digest (locator does not bind)`);
      assert.equal(get("quote_digest"), spanDigest,
        `${id}: source span digest != quote_digest`);
    } else if (kind === "json_pointer") {
      const val = jsonPointer(JSON.parse(body), get("value").replace(/^"|"$/g, ""));
      assert.ok(val !== undefined, `${id}: json_pointer does not resolve`);
      const digests = [String(val), JSON.stringify(val)].map((s) => `sha256:${sha256(s)}`);
      assert.ok(digests.includes(get("quote_digest")),
        `${id}: pointer value digest != quote_digest`);
    }
    bound++;
  }
  // the two sigrank-app receipts resolve deterministically in any clone; gtm/npm
  // sources may skip on machines without the checkout. Never allow zero binding.
  assert.ok(bound >= 2, `no receipts verified against sources (skipped: ${skipped.join(", ")})`);
});
