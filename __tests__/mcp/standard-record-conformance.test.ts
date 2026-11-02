// @vitest-environment node
import { expect, test } from "vitest";
// @ts-expect-error tteop-spec 0.1.5-draft does not publish TypeScript declarations.
import { computeMetrics } from "tteop-spec";
import { buildSigRankStandardRecord } from "../../lib/mcp/standard";

const cases = [
  { input: 1_251_211, output: 11_296_121, cache_write: 128_196_310, cache_read: 2_555_179_769 },
  { input: 100, output: 100, cache_write: 50, cache_read: null },
  { input: 100, output: 100, cache_write: null, cache_read: 200 },
  { input: 100, output: 100, cache_write: null, cache_read: null },
  { input: 100, output: 100 },
  { input: 0, output: 100, cache_write: 50, cache_read: 200 },
  { input: 100, output: 0, cache_write: 50, cache_read: 200 },
  { input: 100, output: 100, cache_write: 0, cache_read: 0 },
  { input: 0, output: 0, cache_write: 0, cache_read: 0 },
];

for (const [index, telemetry] of cases.entries()) {
  test(`production standard record matches TTEOP for boundary vector ${index}`, () => {
    const record = buildSigRankStandardRecord(telemetry);
    const expected = computeMetrics({
      ...telemetry,
      cache_write: telemetry.cache_write ?? null,
      cache_read: telemetry.cache_read ?? null,
    }).metrics;
    expect(record.telemetry.cache_write).toBe(telemetry.cache_write ?? null);
    expect(record.telemetry.cache_read).toBe(telemetry.cache_read ?? null);
    expect(record.metrics).toEqual({
      yield: expected.yield,
      leverage: expected.leverage,
      velocity: expected.velocity,
      snr: expected.output_fraction,
      dev10x: expected.log_leverage,
    });
  });
}
