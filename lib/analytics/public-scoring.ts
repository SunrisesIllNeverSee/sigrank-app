import "server-only";
import type { ScoringRules } from "@/lib/analytics/scoring-engine";
import {
  RS01_SIGNA_WEIGHTS, RS02_DEPTH_BUCKETS, RS02_DEPTH_FALLBACK, RS05_CLASS_THRESHOLDS,
} from "@/lib/analytics/ruleset";

export const publicScoringRules: ScoringRules = {
  weights: RS01_SIGNA_WEIGHTS,
  depthBuckets: RS02_DEPTH_BUCKETS,
  depthFallback: RS02_DEPTH_FALLBACK,
  classes: RS05_CLASS_THRESHOLDS,
};
