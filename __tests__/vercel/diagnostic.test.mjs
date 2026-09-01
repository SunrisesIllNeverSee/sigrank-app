/**
 * __tests__/vercel/diagnostic.test.mjs — URL validation security boundary tests.
 *
 * The validateDeploymentUrl function is the SSRF boundary for the public Vercel
 * distribution diagnostic. It must reject anything that is not a public HTTPS
 * *.vercel.app deployment URL. These tests lock the security-critical edge cases.
 *
 * Run: node --experimental-strip-types --test __tests__/vercel/diagnostic.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDeploymentUrl, MAX_INPUT_LENGTH } from "../../lib/vercel/diagnostic.ts";

// ─── Accepted inputs ──────────────────────────────────────────────────────────

test("accepts a bare hostname and normalizes to HTTPS root", () => {
  const url = validateDeploymentUrl("my-project.vercel.app");
  assert.ok(url);
  assert.equal(url.protocol, "https:");
  assert.equal(url.hostname, "my-project.vercel.app");
  assert.equal(url.pathname, "/");
  assert.equal(url.search, "");
  assert.equal(url.hash, "");
});

test("accepts a full HTTPS URL and strips path/search/hash", () => {
  const url = validateDeploymentUrl("https://my-project.vercel.app/some/path?q=1#frag");
  assert.ok(url);
  assert.equal(url.hostname, "my-project.vercel.app");
  assert.equal(url.pathname, "/");
  assert.equal(url.search, "");
  assert.equal(url.hash, "");
});

test("accepts multi-segment subdomains", () => {
  const url = validateDeploymentUrl("https://a.b.c.vercel.app/");
  assert.ok(url);
  assert.equal(url.hostname, "a.b.c.vercel.app");
});

test("lowercases the hostname", () => {
  const url = validateDeploymentUrl("https://My-Project.Vercel.App/");
  assert.ok(url);
  assert.equal(url.hostname, "my-project.vercel.app");
});

// ─── Rejected: protocol ───────────────────────────────────────────────────────

test("rejects HTTP", () => {
  assert.equal(validateDeploymentUrl("http://my-project.vercel.app/"), null);
});

test("rejects bare hostname that starts with 'http' but is not a URL", () => {
  // 'httpfoo.vercel.app' starts with 'http' → treated as URL → HTTPS forced fails
  // Actually: starts with 'http' so it's used as-is, new URL('httpfoo.vercel.app') throws
  assert.equal(validateDeploymentUrl("httpfoo.vercel.app"), null);
});

// ─── Rejected: host ───────────────────────────────────────────────────────────

test("rejects the bare apex vercel.app", () => {
  assert.equal(validateDeploymentUrl("https://vercel.app/"), null);
  assert.equal(validateDeploymentUrl("vercel.app"), null);
});

test("rejects non-vercel.app hosts", () => {
  assert.equal(validateDeploymentUrl("https://example.com/"), null);
  assert.equal(validateDeploymentUrl("https://evil.com/"), null);
  assert.equal(validateDeploymentUrl("example.com"), null);
});

test("rejects subdomain-spoofing (vercel.app not at the end)", () => {
  assert.equal(validateDeploymentUrl("https://test.vercel.app.evil.com/"), null);
  assert.equal(validateDeploymentUrl("https://vercel.app.evil.com/"), null);
  assert.equal(validateDeploymentUrl("https://notvercel.app/"), null);
});

test("rejects internal/metadata IPs", () => {
  assert.equal(validateDeploymentUrl("https://169.254.169.254/"), null);
  assert.equal(validateDeploymentUrl("https://127.0.0.1/"), null);
  assert.equal(validateDeploymentUrl("https://10.0.0.1/"), null);
  assert.equal(validateDeploymentUrl("https://localhost/"), null);
});

// ─── Rejected: credentials & ports ────────────────────────────────────────────

test("rejects URLs with credentials", () => {
  assert.equal(validateDeploymentUrl("https://user:pass@my-project.vercel.app/"), null);
  assert.equal(validateDeploymentUrl("https://user@my-project.vercel.app/"), null);
});

test("rejects URLs with non-default ports", () => {
  assert.equal(validateDeploymentUrl("https://my-project.vercel.app:8080/"), null);
  assert.equal(validateDeploymentUrl("https://my-project.vercel.app:3000/"), null);
});

test("accepts :443 (default HTTPS port, normalized away by URL parser)", () => {
  const url = validateDeploymentUrl("https://my-project.vercel.app:443/");
  assert.ok(url);
  assert.equal(url.port, "");
});

// ─── Rejected: type & length ──────────────────────────────────────────────────

test("rejects non-string inputs", () => {
  assert.equal(validateDeploymentUrl(null), null);
  assert.equal(validateDeploymentUrl(undefined), null);
  assert.equal(validateDeploymentUrl(123), null);
  assert.equal(validateDeploymentUrl({}), null);
  assert.equal(validateDeploymentUrl([]), null);
});

test("rejects empty string", () => {
  assert.equal(validateDeploymentUrl(""), null);
});

test("rejects inputs exceeding MAX_INPUT_LENGTH", () => {
  const long = "https://my-project.vercel.app/" + "a".repeat(MAX_INPUT_LENGTH);
  assert.ok(long.length > MAX_INPUT_LENGTH);
  assert.equal(validateDeploymentUrl(long), null);
});

test("rejects unparseable strings", () => {
  assert.equal(validateDeploymentUrl("not a url at all"), null);
  assert.equal(validateDeploymentUrl("://no-scheme"), null);
  assert.equal(validateDeploymentUrl("https://"), null);
});
