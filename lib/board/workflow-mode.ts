export type BoardMode = "all" | "hitl" | "agentic";
/** Stored workflow_mode vocabulary — "hybrid" is carried end-to-end for
 *  surfaces that read the assessed value verbatim (the live board); the
 *  heuristic resolver below still only produces hitl|agentic|null until
 *  the pipeline emits hybrid assessments. */
export type WorkflowMode = Exclude<BoardMode, "all"> | "hybrid";

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
  if (input.assessment === "agentic" || input.assessment === "hybrid") {
    return input.evidenceUrl?.startsWith("https://") ? input.assessment : null;
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
