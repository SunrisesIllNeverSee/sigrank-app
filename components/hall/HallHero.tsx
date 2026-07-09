/**
 * components/hall/HallHero.tsx — the Hall of Signal masthead.
 *
 * Now a thin wrapper over the shared <WaveHero/> (generalized from this component
 * 2026-06-21 so /board + /compare can reuse the same animated wave hero). The Hall's
 * look is unchanged — it just supplies its own copy.
 */

import { WaveHero } from "@/components/ui/WaveHero";

export function HallHero() {
  return (
    <WaveHero
      eyebrow="🏛️ Hall of Signal"
      terminalText="FAMAE ET GLORIA"
      title="Triumphus Famae Et Gloriae"
      subtitle="The permanent record — the highest marks ever set across the SigRank leaderboard."
    />
  );
}
