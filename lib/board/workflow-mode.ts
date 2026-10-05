export type BoardMode = "all" | "hitl" | "agentic";
export type WorkflowMode = Exclude<BoardMode, "all">;

export function resolveWorkflowMode(input: {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  assessment?: WorkflowMode | null;
  evidenceUrl?: string | null;
}): WorkflowMode | null {
  if ([input.inputTokens, input.outputTokens, input.cacheWriteTokens, input.cacheReadTokens]
    .some((n) => !Number.isFinite(n) || n < 0) ||
      input.inputTokens === 0 || input.outputTokens === 0) return null;
  if (input.assessment === "agentic") {
    return input.evidenceUrl?.startsWith("https://") ? "agentic" : null;
  }
  const total = input.inputTokens + input.outputTokens +
    input.cacheWriteTokens + input.cacheReadTokens;
  const inputShare = input.inputTokens / total;
  const velocity = input.outputTokens / input.inputTokens;
  const yield_ = (input.cacheReadTokens * input.outputTokens) /
    (input.inputTokens * input.inputTokens);
  const inHcm = inputShare <= 0.8 &&
    (inputShare >= 0.01 ||
      (velocity <= 2 && yield_ <= 1000 &&
        input.outputTokens >= 1_000_000 && input.cacheWriteTokens >= 1_000_000));
  return inHcm ? "hitl" : null;
}

export function includesBoardMode(mode: BoardMode, resolved: WorkflowMode | null): boolean {
  return resolved !== null && (mode === "all" || mode === resolved);
}
