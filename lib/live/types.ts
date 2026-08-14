import type { RawPillars } from "@/lib/analytics/cascade";

export interface LiveTelemetrySnapshot {
  operator: string;
  model: string;
  context: string;
  pillars: RawPillars;
  observedAt: string;
}

export interface LiveTelemetryState {
  status: "waiting" | "live";
  sequence: number;
  snapshot: LiveTelemetrySnapshot | null;
}
