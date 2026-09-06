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
      eyebrow="AI OPERATOR HALL OF FAME"
      terminalText="HALL OF FAME"
      title="The Top AI Users in the World"
      subtitle={
        <>
          AI operator hall of fame — record-setting AI operators ranked by
          measured global token-cascade efficiency.
        </>
      }
    />
  );
}
