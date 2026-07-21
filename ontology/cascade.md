# Cascade

A cascade is the token-flow decomposition from fresh input through generated output, cache commitment, and cache reuse.

For positive pillars, its stages are:

1. **Transmission:** `output / input`
2. **Commitment:** `cache_create / output`
3. **Reuse:** `cache_read / cache_create`

Their product telescopes to `(cache_read × output) / input²`, the public Upsilon metric. A zero cache-create value is marked non-compounding; stage ratios and the cascade string are then unavailable rather than inferred.

Source: `lib/cascade/metrics.ts`.