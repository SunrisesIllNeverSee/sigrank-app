import { describe, it, expect } from "vitest";

import { ingestMeta } from "@/lib/ingest/parse";

/**
 * oh-my-pi (`omp`) ingest source.
 *
 * omp emits camelCase usage objects: { input, output, cacheRead, cacheWrite }
 * plus a sibling `cost` child that reuses THE SAME FOUR KEY NAMES for USD
 * floats. Every pillar assertion below uses four distinct values so a swap or
 * a cost-leak fails loudly rather than silently summing dollars into tokens.
 */

const USAGE = {
  input: 1000,
  output: 200,
  cacheRead: 30,
  cacheWrite: 4,
};

/** A full omp session-entry, verbatim in the shape omp writes to JSONL. */
function messageEntry(
  usage: Record<string, unknown>,
  id = "a1b2c3d4",
): Record<string, unknown> {
  return {
    type: "message",
    id,
    parentId: null,
    timestamp: "2026-02-16T10:21:00.000Z",
    message: {
      role: "assistant",
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      content: [{ type: "text", text: "Done." }],
      usage,
      timestamp: 1760000000000,
    },
  };
}

describe("ingestMeta — oh-my-pi (omp) source", () => {
  it("parses a bare aggregate usage object as measured omp telemetry", () => {
    const { pillars, meta } = ingestMeta(JSON.stringify(USAGE));

    expect(pillars).toEqual({
      input: 1000,
      output: 200,
      cacheCreate: 4,
      cacheRead: 30,
    });
    expect(meta.source).toBe("omp");
    expect(meta.estimated).toBe(false);
    expect(meta.caveat).toBeNull();
  });

  it("maps cacheWrite→cacheCreate and cacheRead→cacheRead without swapping", () => {
    const { pillars } = ingestMeta(
      JSON.stringify({ input: 11, output: 22, cacheRead: 33, cacheWrite: 44 }),
    );

    expect(pillars.cacheCreate).toBe(44);
    expect(pillars.cacheRead).toBe(33);
    expect(pillars.input).toBe(11);
    expect(pillars.output).toBe(22);
  });

  it("never folds the USD `cost` child into the token pillars", () => {
    const { pillars, meta } = ingestMeta(
      JSON.stringify({
        ...USAGE,
        cost: {
          input: 0.42,
          output: 1.7,
          cacheRead: 0.01,
          cacheWrite: 0.3,
          total: 2.43,
        },
      }),
    );

    expect(pillars).toEqual({
      input: 1000,
      output: 200,
      cacheCreate: 4,
      cacheRead: 30,
    });
    expect(meta.costUsd).toBeCloseTo(2.43, 10);
  });

  it("parses a nested { usage: {...} } wrapper", () => {
    const { pillars, meta } = ingestMeta(JSON.stringify({ usage: USAGE }));

    expect(pillars).toEqual({
      input: 1000,
      output: 200,
      cacheCreate: 4,
      cacheRead: 30,
    });
    expect(meta.source).toBe("omp");
  });

  it("parses a single omp message entry", () => {
    const { pillars, meta } = ingestMeta(JSON.stringify(messageEntry(USAGE)));

    expect(pillars).toEqual({
      input: 1000,
      output: 200,
      cacheCreate: 4,
      cacheRead: 30,
    });
    expect(meta.source).toBe("omp");
    expect(meta.estimated).toBe(false);
  });

  it("sums a JSON array of entries", () => {
    const entries = [
      messageEntry({ input: 100, output: 10, cacheRead: 1, cacheWrite: 2 }, "1"),
      messageEntry({ input: 200, output: 20, cacheRead: 3, cacheWrite: 4 }, "2"),
      messageEntry({ input: 400, output: 40, cacheRead: 5, cacheWrite: 6 }, "3"),
    ];

    const { pillars, meta } = ingestMeta(JSON.stringify(entries));

    expect(pillars).toEqual({
      input: 700,
      output: 70,
      cacheCreate: 12,
      cacheRead: 9,
    });
    expect(meta.source).toBe("omp");
  });

  it("counts an entry whose usage omits cacheWrite entirely", () => {
    // omp only serializes the cache fields it has. An entry without cacheWrite
    // must still contribute its input/output — dropping it silently under-counts
    // the pillars and yields a wrong Υ.
    const entries = [
      messageEntry({ input: 100, output: 10, cacheRead: 1, cacheWrite: 2 }, "1"),
      messageEntry({ input: 50, output: 5, cacheRead: 1 }, "2"),
      messageEntry({ input: 400, output: 40, cacheRead: 3, cacheWrite: 6 }, "3"),
    ];

    const { pillars, meta } = ingestMeta(JSON.stringify(entries));

    expect(pillars).toEqual({
      input: 550,
      output: 55,
      cacheCreate: 8,
      cacheRead: 5,
    });
    expect(meta.source).toBe("omp");
  });

  it("counts usage siblings alongside a top-level usage object", () => {
    // Consuming a named `usage` child must not stop the walk: sibling keys can
    // hold further usage-bearing entries. Powers of two make any drop loud.
    const payload = {
      usage: { input: 100, output: 10, cacheRead: 1, cacheWrite: 2 },
      subSessions: [
        messageEntry(
          { input: 200, output: 20, cacheRead: 4, cacheWrite: 8 },
          "1",
        ),
        messageEntry(
          { input: 400, output: 40, cacheRead: 16, cacheWrite: 32 },
          "2",
        ),
      ],
    };

    const { pillars, meta } = ingestMeta(JSON.stringify(payload));

    expect(pillars).toEqual({
      input: 700,
      output: 70,
      cacheCreate: 42,
      cacheRead: 21,
    });
    expect(meta.source).toBe("omp");
  });

  it("sums a raw JSONL session paste and ignores the session header line", () => {
    const jsonl = [
      JSON.stringify({
        type: "session",
        version: 3,
        id: "sess-1",
        cwd: "/repo",
      }),
      JSON.stringify(
        messageEntry({ input: 100, output: 10, cacheRead: 1, cacheWrite: 2 }, "1"),
      ),
      JSON.stringify(
        messageEntry({ input: 200, output: 20, cacheRead: 3, cacheWrite: 4 }, "2"),
      ),
    ].join("\n");

    const { pillars, meta } = ingestMeta(jsonl);

    expect(pillars).toEqual({
      input: 300,
      output: 30,
      cacheCreate: 6,
      cacheRead: 4,
    });
    expect(meta.source).toBe("omp");
    expect(meta.estimated).toBe(false);
    expect(meta.caveat).toBeNull();
  });

  it("parses omp JSON wrapped in a markdown code fence", () => {
    const fenced = "```json\n" + JSON.stringify({ usage: USAGE }) + "\n```";

    const { pillars, meta } = ingestMeta(fenced);

    expect(pillars).toEqual({
      input: 1000,
      output: 200,
      cacheCreate: 4,
      cacheRead: 30,
    });
    expect(meta.source).toBe("omp");
  });

  it("sums cost.total across entries and reports null when no cost is present", () => {
    const withCost = [
      messageEntry(
        { input: 1, output: 2, cacheRead: 3, cacheWrite: 4, cost: { total: 1.25 } },
        "1",
      ),
      messageEntry(
        { input: 1, output: 2, cacheRead: 3, cacheWrite: 4, cost: { total: 0.75 } },
        "2",
      ),
    ];
    expect(ingestMeta(JSON.stringify(withCost)).meta.costUsd).toBeCloseTo(2.0, 10);

    const withoutCost = [
      messageEntry({ input: 1, output: 2, cacheRead: 3, cacheWrite: 4 }, "1"),
    ];
    expect(ingestMeta(JSON.stringify(withoutCost)).meta.costUsd).toBeNull();
  });

  it("does not classify omp telemetry as codex or ccusage", () => {
    const { meta } = ingestMeta(JSON.stringify(messageEntry(USAGE)));

    expect(meta.source).not.toBe("codex");
    expect(meta.source).not.toBe("ccusage");
    expect(meta.source).toBe("omp");
  });

  it("names oh-my-pi in the unrecognized-format error", () => {
    expect(() => ingestMeta("no telemetry here")).toThrow(/oh-my-pi/i);
  });
});

describe("ingestMeta — existing sources stay intact", () => {
  it("still parses ccusage totals with the frozen MOSES seed values", () => {
    const { pillars, meta } = ingestMeta(
      JSON.stringify({
        totals: {
          inputTokens: 1_251_211,
          outputTokens: 11_296_121,
          cacheCreationTokens: 128_196_310,
          cacheReadTokens: 2_555_179_769,
          totalCost: 412.5,
        },
      }),
    );

    expect(pillars).toEqual({
      input: 1_251_211,
      output: 11_296_121,
      cacheCreate: 128_196_310,
      cacheRead: 2_555_179_769,
    });
    expect(meta.source).toBe("ccusage");
    expect(meta.estimated).toBe(false);
    expect(meta.costUsd).toBeCloseTo(412.5, 10);
  });

  it("still routes codex payloads through the estimation pathway", () => {
    const { meta } = ingestMeta(
      JSON.stringify({
        totals: {
          input_tokens: 500_000,
          cached_input_tokens: 120_000,
          output_tokens: 40_000,
          reasoning_output_tokens: 10_000,
        },
      }),
    );

    expect(meta.source).toBe("codex");
    expect(meta.estimated).toBe(true);
    expect(meta.caveat).not.toBeNull();
  });

  it("still parses four bare numbers as a manual submission", () => {
    const { pillars, meta } = ingestMeta("1000 200 30 4");

    expect(pillars).toEqual({
      input: 1000,
      output: 200,
      cacheCreate: 30,
      cacheRead: 4,
    });
    expect(meta.source).toBe("manual");
  });

  it("still throws on empty input", () => {
    expect(() => ingestMeta("   ")).toThrow();
  });

  it("keeps bare aliases from colliding with the *Tokens ccusage aliases", () => {
    // Trailing comma defeats tryFixJson, forcing the named-field strategy —
    // the only path where the bare omp aliases could shadow ccusage keys.
    const fragment =
      '"inputTokens": 5, "outputTokens": 6, "cacheCreationTokens": 7, "cacheReadTokens": 8,';

    const { pillars, meta } = ingestMeta(fragment);

    expect(pillars).toEqual({
      input: 5,
      output: 6,
      cacheCreate: 7,
      cacheRead: 8,
    });
    expect(meta.source).toBe("ccusage");
  });

  it("attributes a broken-JSON omp fragment to omp, not ccusage", () => {
    const fragment = '"input": 1000, "output": 200, "cacheRead": 30, "cacheWrite": 4,';

    const { pillars, meta } = ingestMeta(fragment);

    expect(pillars).toEqual({
      input: 1000,
      output: 200,
      cacheCreate: 4,
      cacheRead: 30,
    });
    expect(meta.source).toBe("omp");
  });
});
