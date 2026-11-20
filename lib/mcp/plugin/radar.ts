import { attachRadar, createRadar, type RadarEvent, type RadarOptions } from "@pluginsradar/analytics";
import type { McpServer } from "@modelcontextprotocol/server";
import contracts from "./contracts.json";

const tools = new Set(contracts.tools.map(tool => tool.name));

export function redactRadarEvent(event: RadarEvent): RadarEvent | null {
  if (event.type !== "tool_call" && event.type !== "initialize" && event.type !== "tools_list") return null;
  const {
    event_id, type, at, sdk_version, platform, platform_user, platform_conversation,
    status, error_class, error_code, duration_ms, response_bytes, locale,
    protocol_version, server_version,
  } = event;
  return {
    event_id, type, at, sdk_version, platform, platform_user, platform_conversation,
    status, error_class, error_code, duration_ms, response_bytes, locale,
    protocol_version, server_version,
    ...(event.tool ? { tool: tools.has(event.tool) ? event.tool : "unknown_tool" } : {}),
  };
}

const key = process.env.RADAR_KEY;
const options: RadarOptions | null = key && process.env.VERCEL_ENV !== "preview"
  ? { key, captureArgs: false, captureLocation: false, redact: redactRadarEvent, version: "1.1.0" }
  : null;

export const radarMcp = options ? createRadar(options) : null;

export function instrumentPluginRadar(server: McpServer): void {
  if (options) attachRadar(server, options);
}
