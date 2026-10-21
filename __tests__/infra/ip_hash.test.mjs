/**
 * __tests__/infra/ip_hash.test.mjs — stored IP hashes are keyed, never plain.
 *
 * A plain sha256 of an IPv4 address is reversible by brute force, and the
 * anonymous exchange actor id used to embed the raw IP. Both now go through
 * an HMAC under a server-only key.
 *
 * Run: node --experimental-strip-types --test __tests__/infra/ip_hash.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { hashIp, anonymousActorId } from "../../lib/infra/ip-hash.ts";

function withEnv(env, fn) {
  const saved = { IP_HASH_SECRET: process.env.IP_HASH_SECRET, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY };
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("hash is keyed: differs from plain sha256 and between keys", () => {
  const plain = createHash("sha256").update("203.0.113.7").digest("hex").slice(0, 16);
  const a = withEnv({ IP_HASH_SECRET: "k1", SUPABASE_SERVICE_ROLE_KEY: undefined }, () => hashIp("203.0.113.7"));
  const b = withEnv({ IP_HASH_SECRET: "k2", SUPABASE_SERVICE_ROLE_KEY: undefined }, () => hashIp("203.0.113.7"));
  assert.match(a, /^[0-9a-f]{16}$/);
  assert.notEqual(a, plain);
  assert.notEqual(a, b);
});

test("stable for the same key and IP", () => {
  withEnv({ IP_HASH_SECRET: "k1" }, () => assert.equal(hashIp("198.51.100.1"), hashIp("198.51.100.1")));
});

test("falls back to the service-role key, and stores nothing without a key", () => {
  const viaService = withEnv({ IP_HASH_SECRET: undefined, SUPABASE_SERVICE_ROLE_KEY: "svc" }, () => hashIp("198.51.100.1"));
  assert.match(viaService, /^[0-9a-f]{16}$/);
  withEnv({ IP_HASH_SECRET: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined }, () => {
    assert.equal(hashIp("198.51.100.1"), undefined);
  });
  assert.equal(hashIp(null), undefined);
  assert.equal(hashIp("unknown"), undefined);
});

test("anonymous actor id never contains the raw IP", () => {
  withEnv({ IP_HASH_SECRET: "k1" }, () => {
    const id = anonymousActorId("203.0.113.7");
    assert.match(id, /^anonymous:[0-9a-f]{16}$/);
    assert.ok(!id.includes("203.0.113.7"));
  });
  withEnv({ IP_HASH_SECRET: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined }, () => {
    assert.equal(anonymousActorId("203.0.113.7"), "anonymous:unknown");
  });
});
