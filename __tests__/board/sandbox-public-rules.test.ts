import { expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

it("public sandbox responses do not disclose active production overrides", async () => {
  const outputs = [];
  const parseOutputs = [];
  const productionOutputs = [];
  for (const privateScore of [7, 97]) {
    vi.resetModules();
    vi.doMock("@/lib/analytics/secret-config", () => ({
      RS01_SIGNA_WEIGHTS: { comp: 0, sd: 1, pc: 0, ct: 0, tt: 0 },
      RS02_DEPTH_BUCKETS: [[0, privateScore]],
      RS02_DEPTH_FALLBACK: privateScore,
      RS05_CLASS_THRESHOLDS: [{ class: "POWER I", totalMin: 0 }],
    }));
    const { POST } = await import("@/app/api/sandbox/score/route");
    const response = await POST(new NextRequest("https://signalaf.com/api/sandbox/score", {
      method: "POST",
      body: JSON.stringify({
        pillars: { input: 100, output: 250, cacheCreate: 50, cacheRead: 500 },
        sessionsCount: 2, turnsTotal: 20, totalMessagesLifetime: 30, accountAgeDays: 10,
      }),
    }));
    expect(response.status).toBe(200);
    outputs.push(await response.json());
    const { POST: parse } = await import("@/app/api/v1/ingest-parse/route");
    const preview = await parse(new NextRequest("https://signalaf.com/api/v1/ingest-parse", {
      method: "POST", body: JSON.stringify({ text: "100 250 50 500" }),
    }));
    expect(preview.status).toBe(200);
    parseOutputs.push(await preview.json());
    const { scoreSnapshot } = await import("@/lib/analytics/scoring-engine");
    productionOutputs.push(scoreSnapshot({
      raw: { compression_ratio: .5, session_depth: 10, prompt_complexity: 20, cross_thread: 40, token_throughput: 900 },
      pcConfidence: "low", totalMessagesLifetime: 30, accountAgeDays: 10,
    }).signa_rate);
  }
  expect(outputs[0]).toEqual(outputs[1]);
  expect(parseOutputs[0]).toEqual(parseOutputs[1]);
  expect(parseOutputs[0]).toMatchObject({ ruleset: "public-example" });
  expect(outputs[0]).toMatchObject({ ruleset: "public-example", scores: expect.any(Object) });
  expect(productionOutputs).toEqual([7, 97]);
  vi.doUnmock("@/lib/analytics/secret-config");
});
