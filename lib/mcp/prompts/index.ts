/**
 * lib/mcp/prompts/index.ts — SigRank MCP prompt definitions and generator.
 *
 * Extracted from app/api/mcp/route.ts as Phase 2 of the MCP structural
 * renovation. Contains the 5 prompt definitions and the getPrompt handler
 * that returns prompt messages by name.
 */

export const PROMPTS = [
  {
    name: "benchmark-my-operator",
    title: "Benchmark My AI Operator",
    description: "Compute your cascade metrics, compare against the live field, and get a one-line interpretation of where you stand.",
    arguments: [
      { name: "input", description: "Total input tokens", required: true },
      { name: "output", description: "Total output tokens", required: true },
      { name: "cache_read", description: "Cache-read tokens", required: true },
      { name: "cache_write", description: "Cache-write tokens", required: true },
      { name: "window", description: "Time window (7d, 30d, 90d, all_time)", required: false },
    ],
  },
  {
    name: "how-do-i-reach-top-10",
    title: "How Do I Reach Top 10%?",
    description: "Counterfactual analysis — finds the smallest pillar change needed to reach a target percentile.",
    arguments: [
      { name: "input", description: "Current input tokens", required: true },
      { name: "output", description: "Current output tokens", required: true },
      { name: "cache_read", description: "Current cache-read tokens", required: true },
      { name: "cache_write", description: "Current cache-write tokens", required: true },
      { name: "target_percentile", description: "Target percentile (0-100, e.g. 90 for top 10%)", required: true },
    ],
  },
  {
    name: "explain-my-signature",
    title: "Explain My Operating Signature",
    description: "Computes your operating archetype, dominant trait, and finds comparable operators on the live board.",
    arguments: [
      { name: "input", description: "Total input tokens", required: true },
      { name: "output", description: "Total output tokens", required: true },
      { name: "cache_read", description: "Cache-read tokens", required: true },
      { name: "cache_write", description: "Cache-write tokens", required: true },
    ],
  },
  {
    name: "diagnose-inefficiency",
    title: "Diagnose My Inefficiency",
    description: "Identifies efficiency leaks in your token cascade with severity, findings, and estimated yield impact per fix.",
    arguments: [
      { name: "input", description: "Total input tokens", required: true },
      { name: "output", description: "Total output tokens", required: true },
      { name: "cache_read", description: "Cache-read tokens", required: true },
      { name: "cache_write", description: "Cache-write tokens", required: true },
    ],
  },
  {
    name: "field-anomaly-report",
    title: "Field Anomaly Report",
    description: "Scans the live leaderboard for unusual patterns — no input required.",
    arguments: [
      { name: "window", description: "Time window (7d, 30d, 90d, all_time)", required: false },
    ],
  },
];

/**
 * Get a prompt by name. Returns the prompt messages for a valid name, or null
 * if the name is unknown (the caller should return an appropriate JSON-RPC
 * error).
 */
export function getPrompt(
  name: string,
  promptArgs: Record<string, string | number>,
): { messages: Array<{ role: string; content: { type: string; text: string } }> } | null {
  const prompts: Record<string, { messages: Array<{ role: string; content: { type: string; text: string } }> }> = {
    "benchmark-my-operator": {
      messages: [{
        role: "user",
        content: { type: "text", text: `I have an AI operator with these token counts:\n  input: ${promptArgs.input || "?"}\n  output: ${promptArgs.output || "?"}\n  cache_read: ${promptArgs.cache_read || "?"}\n  cache_write: ${promptArgs.cache_write || "?"}\n\nUse the benchmark_me tool to compute my cascade metrics, compare me against the live field, and tell me:\n1. My percentile and estimated rank\n2. My strongest and weakest metric vs the field median\n3. What that means in plain English\n\nThen use the operator_signature tool to tell me my operating archetype and dominant trait.` },
      }],
    },
    "how-do-i-reach-top-10": {
      messages: [{
        role: "user",
        content: { type: "text", text: `My current token counts:\n  input: ${promptArgs.input || "?"}\n  output: ${promptArgs.output || "?"}\n  cache_read: ${promptArgs.cache_read || "?"}\n  cache_write: ${promptArgs.cache_write || "?"}\n\nI want to reach the ${promptArgs.target_percentile || 90}th percentile. Use the rank_if tool to find the smallest pillar change that would get me there. Tell me:\n1. My current rank and percentile\n2. The best path to reach the target\n3. What the simulated rank would be after the change` },
      }],
    },
    "explain-my-signature": {
      messages: [{
        role: "user",
        content: { type: "text", text: `My token counts:\n  input: ${promptArgs.input || "?"}\n  output: ${promptArgs.output || "?"}\n  cache_read: ${promptArgs.cache_read || "?"}\n  cache_write: ${promptArgs.cache_write || "?"}\n\nUse the operator_signature tool to compute my operating signature. Then use who_operates_like_me to find operators with similar signatures. Tell me:\n1. My archetype and dominant trait\n2. Who operates like me\n3. Where they outperform me` },
      }],
    },
    "diagnose-inefficiency": {
      messages: [{
        role: "user",
        content: { type: "text", text: `My token counts:\n  input: ${promptArgs.input || "?"}\n  output: ${promptArgs.output || "?"}\n  cache_read: ${promptArgs.cache_read || "?"}\n  cache_write: ${promptArgs.cache_write || "?"}\n\nUse the diagnose_cascade tool to identify efficiency leaks in my token cascade. Then use suggest_improvements to rank potential fixes by yield impact. Tell me:\n1. My most severe inefficiency\n2. The top 3 recommended fixes\n3. The estimated yield improvement for each` },
      }],
    },
    "field-anomaly-report": {
      messages: [{
        role: "user",
        content: { type: "text", text: `Use the field_anomaly tool to scan the live leaderboard for unusual patterns. Then summarize the most interesting anomalies in plain English — who is doing something unusual, what they're doing, and why it matters.` },
      }],
    },
  };

  return prompts[name] ?? null;
}
