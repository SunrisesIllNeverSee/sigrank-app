import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import Ajv from "ajv";

async function loadPureModule(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const classifier = await loadPureModule("../../lib/analytics/build-archetypes.ts");
const { summarizeReferenceTelemetry } = await loadPureModule("../../lib/marketing/four-degrees-telemetry.ts");
const { isPublishedBoardRow } = await loadPureModule("../../lib/board/published-row.ts");

test("canonical profile classification preserves convergence precedence and exposes version", () => {
  const result = classifier.describeBuildArchetype({ input: 100, output: 100, cache_write: 1000, cache_read: 10000 });
  assert.equal(result.key, "convergent");
  assert.equal(result.classifier_version, "1.0.0");
  assert.equal(result.origin, "computed_from_snapshot");
  assert.deepEqual(result.axes, { leverage: 100, velocity: 1, construction: 0.1 });
});

test("zero cache writing is observed; missing writing and zero denominators remain unclassified", () => {
  const p = { input: 100, output: 80, cache_write: 0, cache_read: 10000 };
  assert.equal(classifier.describeBuildArchetype(p).key, "kinetic");
  for (const missing of [null, undefined, NaN, -1]) {
    assert.equal(classifier.describeBuildArchetype({ ...p, cache_write: missing }), null);
  }
  assert.equal(classifier.describeBuildArchetype({ ...p, input: 0 }), null);
  assert.equal(classifier.describeBuildArchetype({ ...p, cache_read: 0 }), null);
});

test("construction and reuse branches retain their boundary behavior", () => {
  const kind = (r,w) => classifier.describeBuildArchetype({input:100,output:10,cache_read:r,cache_write:w}).key;
  assert.equal(kind(3000,60), "recursive");
  assert.equal(kind(5000,100), "amplifier");
  assert.equal(kind(2300,0), "archivist");
  assert.equal(kind(1500,0), "deep-reader");
});

const row = (input,output,write,read,date) => ({ telemetry:{fresh_input:input,output,cache_create:write,cache_read:read},snapshot:{snapshot_date:date} });

test("reference telemetry uses arithmetic means from the selected group, including observed zeros", () => {
  const result = summarizeReferenceTelemetry([row(10,20,0,100,"2026-10-01"),row(30,40,20,300,"2026-10-03")]);
  assert.deepEqual(result.means,{fresh_input:20,output:30,cache_create:10,cache_read:200});
  assert.equal(result.population,2);
  assert.equal(result.earliest_snapshot,"2026-10-01");
  assert.equal(result.latest_snapshot,"2026-10-03");
});

test("incomplete and empty reference telemetry cannot become an invented group mean", () => {
  const result=summarizeReferenceTelemetry([row(10,20,0,100),row(30,40,undefined,300)]);
  assert.equal(result.means.cache_create,null);
  assert.equal(result.coverage.cache_create,1);
  assert.equal(result.means.fresh_input,20);
  assert.equal(summarizeReferenceTelemetry([]).means.fresh_input,null);
});

test("methodology and analyst eligibility exclude retired, pending and placeholder rows", () => {
  const eligible={operator:{isPlaceholder:false,status:"active"},global_rank:1};
  assert.equal(isPublishedBoardRow(eligible),true);
  assert.equal(isPublishedBoardRow({...eligible,pending:true}),false);
  assert.equal(isPublishedBoardRow({...eligible,global_rank:0}),false);
  assert.equal(isPublishedBoardRow({...eligible,operator:{...eligible.operator,status:"retired"}}),false);
  assert.equal(isPublishedBoardRow({...eligible,operator:{...eligible.operator,isPlaceholder:true}}),false);
});

test("every public read schema accepts canonical classifier details and rejects an incomplete claim", () => {
  const contracts=JSON.parse(readFileSync(new URL("../../lib/mcp/plugin/contracts.json",import.meta.url),"utf8"));
  const result=classifier.describeBuildArchetype({input:100,output:80,cache_write:0,cache_read:10000});
  for(const tool of contracts.tools.filter(t=>t.name!=="report_beta_bug")) {
    const schema=tool.outputSchema.$defs.operator.properties.archetype_details;
    const validate=new Ajv({strict:false}).compile(schema);
    assert.equal(validate(result),true,tool.name);
    assert.equal(validate(null),true,tool.name);
    const incomplete={...result};delete incomplete.classifier_version;
    assert.equal(validate(incomplete),false,tool.name);
  }
});
