import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { hostProps } from "../../lib/infra/request-host.ts";

const req = (h) => ({ headers: { get: (n) => h[n.toLowerCase()] ?? null } });

test("allow-listed host: real $host and host bucket", () => {
  assert.deepEqual(hostProps(req({ host: "signalaf.com" })), { $host: "signalaf.com", host: "signalaf.com" });
});

test("preview/other: only the host bucket, never a bucket in $host", () => {
  assert.deepEqual(hostProps(req({ host: "x.vercel.app" })), { host: "preview" });
  assert.deepEqual(hostProps(req({ host: "evil.example" })), { host: "other" });
  assert.deepEqual(hostProps(req({})), {});
});

const CALLS = {
  "app/api/v1/snapshots/route.ts": ["snapshot_submitted"],
  "app/api/v1/ingest-paste/route.ts": ["snapshot_submitted"],
  "app/api/v1/devices/enroll/route.ts": ["operator_enrolled"],
  "app/auth/callback/route.ts": ["operator_claimed"],
};

test("each captureServer call for the three events spreads hostProps(req) in its props", () => {
  for (const [f, events] of Object.entries(CALLS)) {
    const src = readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
    const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true);
    const found = [];
    const visit = (n) => {
      if (ts.isCallExpression(n) && n.expression.getText(sf) === "captureServer") {
        const [, ev, props] = n.arguments;
        if (ev && ts.isStringLiteral(ev) && events.includes(ev.text)) {
          const ok = props && ts.isObjectLiteralExpression(props) && props.properties.some(
            (p) => ts.isSpreadAssignment(p) && p.expression.getText(sf) === "hostProps(req)");
          assert.ok(ok, `${f}: ${ev.text} missing ...hostProps(req)`);
          found.push(ev.text);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    assert.deepEqual(found.sort(), [...events].sort(), `${f}: calls found`);
  }
});
