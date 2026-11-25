import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hostProps } from "../../lib/infra/request-host.ts";

const req = (h) => ({ headers: { get: (n) => h[n.toLowerCase()] ?? null } });

test("hostProps emits $host and host for allow-listed hosts", () => {
  assert.deepEqual(hostProps(req({ host: "signalaf.com" })), { $host: "signalaf.com", host: "signalaf.com" });
  assert.deepEqual(hostProps(req({ host: "x.vercel.app" })), { $host: "preview", host: "preview" });
});

test("hostProps never echoes arbitrary client hosts", () => {
  assert.deepEqual(hostProps(req({ host: "evil.example" })), { $host: "other", host: "other" });
  assert.deepEqual(hostProps(req({})), {});
});

test("the three server events attach hostProps", () => {
  const files = {
    "app/api/v1/snapshots/route.ts": ["snapshot_submitted"],
    "app/api/v1/ingest-paste/route.ts": ["snapshot_submitted"],
    "app/api/v1/devices/enroll/route.ts": ["operator_enrolled"],
    "app/auth/callback/route.ts": ["operator_claimed"],
  };
  for (const [f, evs] of Object.entries(files)) {
    const src = readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
    for (const ev of evs) {
      const i = src.indexOf(`"${ev}"`, src.indexOf("captureServer("));
      assert.ok(i > 0, `${f} ${ev}`);
      assert.match(src.slice(i, i + 700), /\.\.\.hostProps\(req\)/, `${f} ${ev}`);
    }
  }
});
