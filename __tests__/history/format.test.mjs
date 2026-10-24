/**
 * __tests__/history/format.test.mjs — archived value display.
 *
 *   node --experimental-strip-types --test __tests__/history/format.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fmtArchived } from "../../lib/history/format.ts";

test("null and non-finite render —", () => {
  assert.equal(fmtArchived(null), "—");
  assert.equal(fmtArchived(undefined), "—");
  assert.equal(fmtArchived(-Infinity), "—");
});

test("small values keep three decimals so close SNRs stay distinct", () => {
  assert.equal(fmtArchived(0.9881234), "0.988");
  assert.equal(fmtArchived(0.9921439), "0.992");
});

test("mid values keep two decimals, large values none", () => {
  assert.equal(fmtArchived(81.163), "81.16");
  assert.equal(fmtArchived(2462655.83), "2,462,656");
});

test("cost per million gets a dollar sign", () => {
  assert.equal(fmtArchived(0.4445, "costPerMillion"), "$0.445");
});

test("yield and leverage read the same as the table cells", () => {
  assert.equal(fmtArchived(1234.567, "yield_"), "1,234.57");
  assert.equal(fmtArchived(5.1234, "yield_"), "5.12");
  assert.equal(fmtArchived(12.34, "leverage"), "12.3×");
  assert.equal(fmtArchived(2345, "leverage"), "2.3K×");
});
