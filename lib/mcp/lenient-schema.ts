/**
 * lib/mcp/lenient-schema.ts — input validation for the remote `sigrank` MCP
 * tools that (1) ignores unknown top-level properties instead of rejecting the
 * call, but reports them back to the caller, (2) still rejects a property that
 * looks like a typo of a known one ("did you mean ...?"), and (3) turns a
 * validation failure into a message an agent can act on: the required fields
 * plus an example call.
 *
 * The advertised JSON Schema is unchanged (`additionalProperties: false` stays
 * published). Only validation is lenient.
 */
import { fromJsonSchema, type StandardSchemaWithJSON } from "@modelcontextprotocol/server";

type Json = Record<string, unknown>;

/** Reserved key carrying dropped property names from validation to the tool handler. */
export const IGNORED_ARGUMENTS_KEY = "__sigrank_ignored_arguments";

function firstType(schema: Json): unknown {
  return Array.isArray(schema.type) ? (schema.type as unknown[]).find((x) => x !== "null") : schema.type;
}

function sampleValue(schema: Json | undefined): unknown {
  if (!schema) return "example";
  if (schema.const !== undefined) return schema.const;
  if (Array.isArray(schema.examples) && schema.examples.length) return schema.examples[0];
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  if (schema.default !== undefined) return schema.default;
  const branch = Array.isArray(schema.anyOf) ? (schema.anyOf as Json[]).find((b) => b && b.type !== "null") ?? (schema.anyOf as Json[])[0] : undefined;
  if (branch) return sampleValue(branch);
  const num = (k: string) => (typeof schema[k] === "number" ? (schema[k] as number) : undefined);
  switch (firstType(schema)) {
    case "integer":
    case "number": {
      const min = num("minimum"), max = num("maximum");
      let v = 1000;
      if (min !== undefined && v < min) v = min;
      if (max !== undefined && v > max) v = max;
      return firstType(schema) === "integer" ? Math.round(v) : v;
    }
    case "boolean": return true;
    case "array": return [];
    case "object": return exampleArguments(schema);
    case "string": {
      let v = "example";
      const min = num("minLength"), max = num("maxLength");
      if (min !== undefined && v.length < min) v = v.padEnd(min, "x");
      if (max !== undefined && v.length > max) v = v.slice(0, max);
      return v;
    }
    default: return "example";
  }
}

/** Example arguments built from the schema's required fields. */
export function exampleArguments(schema: Json): Json {
  const props = (schema.properties ?? {}) as Record<string, Json>;
  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
  return Object.fromEntries(required.map((k) => [k, sampleValue(props[k])]));
}

export function validationHelp(toolName: string, schema: Json): string {
  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
  const props = Object.keys((schema.properties ?? {}) as Json);
  const fields = required.length ? `Required fields: ${required.join(", ")}.` : "No fields are required.";
  const optional = props.filter((p) => !required.includes(p));
  return `${fields}${optional.length ? ` Optional: ${optional.join(", ")}.` : ""} Example call: ${toolName} ${JSON.stringify(exampleArguments(schema))}`;
}

export function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

function nearestKnown(key: string, known: Iterable<string>): string | null {
  const k = key.toLowerCase();
  let best: string | null = null, bestD = 3;
  for (const name of known) {
    const d = editDistance(k, name.toLowerCase());
    if (d < bestD) { best = name; bestD = d; }
  }
  return best;
}

function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9_.-]/g, "?").slice(0, 40);
}

export function lenientInputSchema(toolName: string, schema: Json): StandardSchemaWithJSON<Json, Json> {
  const strict = fromJsonSchema(schema) as StandardSchemaWithJSON<Json, Json>;
  const known = new Set(Object.keys((schema.properties ?? {}) as Json));
  const dropUnknown = schema.additionalProperties === false;
  const help = validationHelp(toolName, schema);
  return {
    "~standard": {
      ...strict["~standard"],
      validate: async (value: unknown) => {
        let input = value;
        const ignored: string[] = [];
        const typos: string[] = [];
        if (dropUnknown && value && typeof value === "object" && !Array.isArray(value)) {
          const kept: Json = {};
          for (const [k, v] of Object.entries(value as Json)) {
            if (known.has(k)) { kept[k] = v; continue; }
            const near = nearestKnown(k, known);
            if (near) { kept[k] = v; typos.push(`Unknown property "${safeKey(k)}": did you mean "${near}"?`); }
            else ignored.push(k);
          }
          input = kept;
        }
        const result = await strict["~standard"].validate(input);
        if ("issues" in result && result.issues?.length) {
          return { issues: [...result.issues, ...typos.map((message) => ({ message })), { message: help }] };
        }
        if (ignored.length && "value" in result && result.value && typeof result.value === "object") {
          return { ...result, value: { ...(result.value as Json), [IGNORED_ARGUMENTS_KEY]: ignored.slice(0, 20).map(safeKey) } };
        }
        return result;
      },
    },
  } as StandardSchemaWithJSON<Json, Json>;
}
