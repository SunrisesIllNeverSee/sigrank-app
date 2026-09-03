"use client";

import { useState } from "react";

/**
 * Client-side button that sends a proper MCP `initialize` request to the
 * canonical endpoint and shows the server's response. Replaces the old
 * `<a href>` link that did a GET (which the MCP server rejects with
 * "Method not allowed").
 */
export function TestMcpButton() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("https://signalaf.com/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "vercel-config-test", version: "1.0" },
          },
          id: 1,
        }),
      });
      const text = await res.text();
      // The response is SSE-formatted (event: message\ndata: {...})
      // Extract the JSON from the data line for display.
      const dataLine = text
        .split("\n")
        .find((l) => l.startsWith("data: "));
      const json = dataLine ? dataLine.slice(6) : text;
      try {
        const parsed = JSON.parse(json);
        const serverInfo = parsed.result?.serverInfo;
        if (serverInfo) {
          setResult(
            `✓ Connected — ${serverInfo.name} v${serverInfo.version}`,
          );
        } else if (parsed.error) {
          setResult(`✕ Error: ${parsed.error.message}`);
        } else {
          setResult(JSON.stringify(parsed, null, 2));
        }
      } catch {
        setResult(text.slice(0, 500));
      }
    } catch (err) {
      setResult(`✕ Request failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleTest}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md border border-bg-border px-5 py-3 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/60 disabled:opacity-50"
      >
        {loading ? "Testing…" : "Test MCP endpoint"}
      </button>
      {result && (
        <pre className="overflow-x-auto rounded-md border border-bg-border bg-bg-base p-4 font-mono text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
