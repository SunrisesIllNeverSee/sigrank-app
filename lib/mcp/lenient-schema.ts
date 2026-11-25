/**
 * lib/mcp/lenient-schema.ts — input validation for the remote `sigrank` MCP
 * tools that (1) ignores unknown top-level properties instead of rejecting the
 * call, and (2) turns a validation failure into a message an agent can act on:
 * the required fields plus an example call.
 *
 * The advertised JSON Schema is unchanged (`additionalProperties: false` stays
 * published). Only validation is lenient: unknown top-level keys are dropped
 * before the strict check, then the tool handler never sees them.
 */
import { fromJsonSchema, type StandardSchemaWithJSON } from "@modelcontextprotocol/server";

type Json = Record<string, unknown>;

function sampleValue(schema: Json | undefined): unknown {
  if (!schema) return "example";
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  if (schema.default !== undefined) return schema.default;
  const t = Array.isArray(schema.type) ? (schema.type as unknown[]).find((x) => x !== "null") : schema.type;
  switch (t) {
    case "integer":
    case "number": return typeof schema.minimum === "number" && schema.minimum > 1000 ? schema.minimum : 1000;
    case "boolean": return true;
    case "array": return [];
    case "object": return exampleArguments(schema);
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

export function lenientInputSchema(toolName: string, schema: Json): StandardSchemaWithJSON<Json, Json> {
  const strict = fromJsonSchema(schema) as StandardSchemaWithJSON<Json, Json>;
  const known = new Set(Object.keys((schema.properties ?? {}) as Json));
  const dropUnknown = schema.additionalProperties === false;
  const help = validationHelp(toolName, schema);
  return {
    "~standard": {
      ...strict["~standard"],
      validate: async (value: unknown) => {
        const input = dropUnknown && value && typeof value === "object" && !Array.isArray(value)
          ? Object.fromEntries(Object.entries(value as Json).filter(([k]) => known.has(k)))
          : value;
        const result = await strict["~standard"].validate(input);
        if (!("issues" in result) || !result.issues?.length) return result;
        return { issues: [...result.issues, { message: help }] };
      },
    },
  } as StandardSchemaWithJSON<Json, Json>;
}
