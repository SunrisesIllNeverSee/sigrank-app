import { describe, it, expect } from "vitest";

import {
  platformPrimaryEnum,
  validateSnapshot,
} from "@/lib/ingest/payload-schema";
import {
  PLATFORM_UI,
  PLATFORM_DOMAIN_MAP,
  SAVABLE_PLATFORM_DOMAINS,
} from "@/lib/constants";

/**
 * oh-my-pi (`omp`) as a first-class PLATFORM (not an ingest source).
 *
 * The platform axis answers "which harness did the operator drive"; it is the
 * enum the cross-repo contract test pins against sigrank-mcp's PLATFORM_ENUM.
 * `pi` (P.04) is the older pi-agent and stays untouched — omp is a separate
 * harness and must never be folded into it.
 */

/** A minimal but complete Schema 1.0 payload; platform.primary is the variable. */
function payloadFor(primary: string): Record<string, unknown> {
  return {
    schema_version: "1.0",
    codename: "TransVaultOrigin",
    device_id: "1f0c9a4e-2b6d-4a1c-9e3f-7d5b2a8c4e10",
    submitted_at: "2026-06-25T18:30:00.000Z",
    window: {
      type: "30d",
      start: "2026-05-26T00:00:00.000Z",
      end: "2026-06-25T00:00:00.000Z",
    },
    platform: { primary, models: ["claude-opus-4-8"] },
    core_metrics: {
      compression_ratio: 0.9003,
      prompt_complexity: 41.2,
      cross_thread_score: 73,
      session_depth_avg: 5,
      token_throughput: 2695923411,
    },
    background_metrics: {
      message_volume: 500,
      account_age_days: 365,
      total_messages_lifetime: 25000,
    },
    raw_telemetry: {
      sessions_count: 100,
      turns_total: 500,
      tokens_total: 2695923411,
      tokens_input_fresh: 1251211,
      tokens_output: 11296121,
      tokens_cache_read: 2555179769,
      tokens_cache_creation: 128196310,
      active_minutes_est: 1000,
    },
    tier: "free",
    agent: {
      version: "sigrank-mcp/0.9.15",
      ruleset_version: "rs-token-1",
      snapshot_hash: "sha256:4a234386",
      public_key: "ed25519:pkMEwTRuT+XFpOhInnMvZt98yKgy8MfhBTqPTv8h+NQ=",
    },
  };
}

describe("platformPrimaryEnum — omp", () => {
  it("accepts 'omp'", () => {
    expect(platformPrimaryEnum.safeParse("omp").success).toBe(true);
  });

  it("keeps every pre-existing platform, in order, with omp appended", () => {
    expect(platformPrimaryEnum.options).toEqual([
      "claude",
      "chatgpt",
      "gemini",
      "pi",
      "codex",
      "multi",
      "other",
      "omp",
    ]);
  });

  it("still rejects an unknown platform (fail-closed enum)", () => {
    expect(platformPrimaryEnum.safeParse("oh-my-pi").success).toBe(false);
  });
});

describe("validateSnapshot — platform.primary 'omp'", () => {
  it("validates a full payload declaring omp", () => {
    const result = validateSnapshot(payloadFor("omp"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.platform.primary).toBe("omp");
  });

  it("rejects the same payload with an unknown platform", () => {
    const result = validateSnapshot(payloadFor("ohmypi"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("schema_invalid");
  });

  it("still fails closed on an extra field (.strict() not weakened)", () => {
    const withExtra = { ...payloadFor("omp"), extra: 1 };
    expect(validateSnapshot(withExtra).ok).toBe(false);
  });
});

describe("PLATFORM_UI / PLATFORM_DOMAIN_MAP — omp filter slot", () => {
  it("exposes an Oh My Pi filter mapped to the 'omp' domain", () => {
    expect(PLATFORM_UI).toContain("Oh My Pi");
    expect(PLATFORM_DOMAIN_MAP["Oh My Pi"]).toBe("omp");
  });

  it("leaves the Pi (pi-agent) slot pointing at 'pi'", () => {
    expect(PLATFORM_DOMAIN_MAP.Pi).toBe("pi");
  });
});

describe("SAVABLE_PLATFORM_DOMAINS — the profile write-path accept-list", () => {
  it("persists omp, so the new platform is declarable end to end", () => {
    expect(SAVABLE_PLATFORM_DOMAINS.has("omp")).toBe(true);
  });

  it("persists codex, which the stale four-entry list used to drop", () => {
    expect(SAVABLE_PLATFORM_DOMAINS.has("codex")).toBe(true);
  });

  it("still persists everything that already worked (no narrowing)", () => {
    for (const d of ["claude", "chatgpt", "gemini", "pi"]) {
      expect(SAVABLE_PLATFORM_DOMAINS.has(d)).toBe(true);
    }
  });

  // The accept-list is deliberately limited to domains with a full UI treatment
  // (PLATFORM_UI label + PlatformIcon glyph + --platform-* token). A domain
  // without one renders as bare lowercase text next to Title-Case peers, so it
  // must not become savable by accident.
  it("admits only domains that have a PLATFORM_UI representation", () => {
    const uiDomains = new Set(
      PLATFORM_UI.map((label) => PLATFORM_DOMAIN_MAP[label]).filter(
        (d): d is string => d !== null,
      ),
    );
    const unrepresented = [...SAVABLE_PLATFORM_DOMAINS].filter(
      (d) => !uiDomains.has(d),
    );
    expect(unrepresented).toEqual([]);
  });

  it("does not silently admit adapter-only platforms", () => {
    for (const d of ["droid", "goose", "amp", "devin", "kilo"]) {
      expect(SAVABLE_PLATFORM_DOMAINS.has(d)).toBe(false);
    }
  });
});
