/**
 * __tests__/history/canon-glyph.test.mjs — archived class glyphs.
 *
 *   node --experimental-strip-types --test __tests__/history/canon-glyph.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { glyphFor } from "../../components/history/legacy/canon-glyph.ts";

test("a row with no class gets no glyph, not IGNITER's", () => {
  assert.equal(glyphFor(null), "");
  assert.equal(glyphFor(undefined), "");
});

test("named classes keep their July 31 glyphs", () => {
  assert.equal(glyphFor("IGNITER"), "·");
  assert.equal(glyphFor("TRANSMITTER"), "◈");
});
