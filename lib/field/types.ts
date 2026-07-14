/**
 * lib/field/types.ts — TypeScript types for the field-analysis.json dataset.
 *
 * The dataset at public/data/field-analysis.json captures the AI operator
 * field distribution: 1,611 human operators (bots filtered) with token
 * cascade metrics, plus 17 bots/suspects, 50 ghost-rank operators, yield
 * quartile IQR data, platform adoption counts, and 4 notable operators for
 * the cascade composition chart.
 */

export interface IqrFence {
  q1: number;
  q3: number;
  iqr: number;
  lower: number;
  upper: number;
}

export interface FieldMedians {
  yield: number;
  snr: number;
  leverage: number;
  velocity: number;
  tokens_per_day: number;
  total_tokens: number;
  compression: number;
}

export interface FieldMeta {
  scraped_at: string;
  source: string;
  total_scraped: number;
  bots_removed: number;
  suspects_removed: number;
  humans_included: number;
  medians: FieldMedians;
  iqr_fences: {
    yield: IqrFence;
    snr: IqrFence;
    leverage: IqrFence;
    velocity: IqrFence;
    tokens_per_day: IqrFence;
    total_tokens: IqrFence;
  };
}

export interface FieldOperator {
  handle: string;
  display_name: string;
  tokscale_rank: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  yield: number;
  snr: number;
  leverage: number;
  velocity: number;
  tokens_per_day: number;
  compression: number;
  active_days: number;
  session_count: number;
  platform: string;
  op_ratio: string;
  sigrank_yield: number;
}

export interface FieldBot extends FieldOperator {
  classification: "bot" | "suspect";
  bot_score: number;
  signals: string[];
}

export interface GhostRank {
  handle: string;
  display_name: string;
  tokscale_rank: number;
  yield: number;
  total_tokens: number;
  platform: string;
}

export interface YieldQuartile {
  label: string;
  yield: IqrFence;
  leverage: IqrFence;
  velocity: IqrFence;
  snr: IqrFence;
  tokens_per_day: IqrFence;
}

export interface PlatformAdoption {
  platform: string;
  count: number;
}

export interface FieldAnalysis {
  meta: FieldMeta;
  operators: FieldOperator[];
  bots: FieldBot[];
  ghost_ranks: GhostRank[];
  yield_quartiles: YieldQuartile[];
  platform_adoption: PlatformAdoption[];
  notable_operators: FieldOperator[];
}
