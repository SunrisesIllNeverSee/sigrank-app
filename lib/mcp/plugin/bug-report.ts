export type BetaReport = {
  summary: string;
  steps: string[];
  expected: string;
  actual: string;
  surface: "ChatGPT" | "Codex" | "Website" | "Other";
  pluginVersion: string | null;
  window: "7d" | "30d" | "90d" | "all" | null;
  toolName: string | null;
  replyEmail: string | null;
  redacted: boolean;
};

function requiredText(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") throw new Error(`${field} is required.`);
  const text = value.trim();
  if (text.length < min || text.length > max) throw new Error(`${field} must be ${min}–${max} characters.`);
  return text;
}

function optionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${field} must be text.`);
  const text = value.trim();
  if (!text || text.length > max) throw new Error(`${field} must be 1–${max} characters.`);
  return text;
}

function redact(value: string): { text: string; changed: boolean } {
  const text = value
    .replace(/\bBearer\s+[^\s]+/gi, "[redacted credential]")
    .replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|gh[opusr]_[A-Za-z0-9_]{12,})\b/g, "[redacted credential]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted email]")
    .replace(/([?&](?:token|api_key|access_token|key|secret)=)[^\s&#]+/gi, "$1[redacted]");
  return { text, changed: text !== value };
}

export function prepareBetaReport(args: Record<string, unknown>): BetaReport {
  if (args.consent_confirmed !== true) throw new Error("The user must explicitly approve sending this report.");
  const rawSteps = args.steps;
  if (!Array.isArray(rawSteps) || rawSteps.length < 1 || rawSteps.length > 5)
    throw new Error("steps must contain 1–5 short actions.");
  const surface = args.surface;
  if (surface !== "ChatGPT" && surface !== "Codex" && surface !== "Website" && surface !== "Other")
    throw new Error("surface must be ChatGPT, Codex, Website, or Other.");
  const window = args.window;
  if (window !== undefined && window !== null && window !== "7d" && window !== "30d" && window !== "90d" && window !== "all")
    throw new Error("window must be 7d, 30d, 90d, or all.");
  const replyEmail = optionalText(args.reply_email, "reply_email", 254);
  if (replyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyEmail)) throw new Error("reply_email must be valid.");
  const fields = [
    requiredText(args.summary, "summary", 8, 160),
    ...rawSteps.map((step, index) => requiredText(step, `steps[${index}]`, 3, 300)),
    requiredText(args.expected, "expected", 3, 400),
    requiredText(args.actual, "actual", 3, 800),
    optionalText(args.plugin_version, "plugin_version", 32),
    optionalText(args.tool_name, "tool_name", 64),
  ];
  const safe = fields.map(value => value === null ? null : redact(value));
  const steps = safe.slice(1, 1 + rawSteps.length).map(value => value!.text);
  return {
    summary: safe[0]!.text.replace(/\s+/g, " "),
    steps,
    expected: safe[1 + rawSteps.length]!.text,
    actual: safe[2 + rawSteps.length]!.text,
    surface,
    pluginVersion: safe[3 + rawSteps.length]?.text ?? null,
    window: (window as BetaReport["window"]) ?? null,
    toolName: safe[4 + rawSteps.length]?.text ?? null,
    replyEmail,
    redacted: safe.some(value => value?.changed),
  };
}

export function formatBetaReport(report: BetaReport, reference: string, sentAt: string): string {
  return [
    `Reference: ${reference}`,
    `Sent: ${sentAt}`,
    `Surface: ${report.surface}`,
    `Plugin version: ${report.pluginVersion ?? "unknown"}`,
    `Window: ${report.window ?? "not applicable"}`,
    `Tool: ${report.toolName ?? "not specified"}`,
    `Sensitive text redacted: ${report.redacted ? "yes" : "no"}`,
    "",
    `Summary: ${report.summary}`,
    "Steps to reproduce:",
    ...report.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    `Expected: ${report.expected}`,
    `Actual: ${report.actual}`,
  ].join("\n");
}
