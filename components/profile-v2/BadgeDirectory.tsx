import pixelCatalog from "./cumulative-pixel-catalog.v2.json";
import achievementCatalog from "./achievement-index.v1.json";
import { AchievementArtwork, PixelArtwork } from "./BadgeArtwork";

type PixelEntry = {
  id: string;
  label: string;
  family: string;
  metric: string;
  threshold: string;
  evidence: string;
  status: string;
  pattern: string;
  is_existing: boolean;
};

type AchievementEntry = {
  id: string;
  name: string;
  sigil: string;
  description: string;
  proposed_rule: string;
  evidence: string;
  status: string;
  group: string;
  group_title: string;
  accent: string;
};

const pixels = pixelCatalog.entries as PixelEntry[];
const achievements = achievementCatalog.entries as AchievementEntry[];

function Group({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="border-y border-bg-border" open={open}>
      <summary className="cursor-pointer list-none py-3 font-mono text-xs uppercase tracking-[0.12em] text-text-primary">
        <span className="mr-2 text-gold">▸</span>{title}
      </summary>
      <div className="grid gap-x-6 border-t border-bg-border-subtle py-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </details>
  );
}

export function BadgeDirectory() {
  const families = [...new Set(pixels.map((entry) => entry.family))];
  const groups = [...new Set(achievements.map((entry) => entry.group))];
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-8">
      <header className="border-b border-bg-border pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">HALL OF SIGNAL · REFERENCE</p>
        <h1 className="mt-2 font-mono text-2xl font-bold uppercase tracking-wide text-text-primary sm:text-3xl">Badge Index</h1>
        <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
          Pixel marks and Achievement awards are separate badge systems. Existing Pixel designs are shown alongside proposed designs; proposed and blocked entries are reference concepts, not awards currently issued.
        </p>
        <div className="mt-4 flex gap-5 font-mono text-[10px] uppercase tracking-wider">
          <span className="text-text-secondary">{pixels.length} Pixel designs</span>
          <span className="text-text-secondary">{achievements.length} Achievement designs</span>
        </div>
      </header>

      <section aria-labelledby="pixel-index-heading">
        <div className="mb-2 flex items-baseline justify-between border-b border-bg-border pb-2">
          <h2 id="pixel-index-heading" className="font-mono text-sm font-semibold uppercase tracking-wider text-text-primary">Pixel Badges</h2>
          <span className="font-mono text-[9px] uppercase text-text-muted">Cumulative pixel patterns</span>
        </div>
        <div>
          {families.map((family, index) => (
            <Group key={family} title={family.replaceAll("-", " ").toUpperCase()} open={index === 0}>
              {pixels.filter((entry) => entry.family === family).map((entry) => (
                <article key={entry.id} className="flex items-center gap-4 border-b border-bg-border-subtle py-4 last:border-0">
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded border border-bg-border bg-bg-elevated">
                    <PixelArtwork pattern={entry.pattern} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-mono text-xs font-semibold text-text-primary">{entry.label}</h3>
                    <p className="mt-1 font-mono text-[9px] leading-relaxed text-text-secondary">{entry.threshold}</p>
                    <p className="mt-1 font-sans text-[10px] leading-relaxed text-text-muted">{entry.evidence}</p>
                    <span className="mt-1 inline-block font-mono text-[8px] uppercase tracking-wider text-gold">{entry.status}</span>
                  </div>
                </article>
              ))}
            </Group>
          ))}
        </div>
      </section>

      <section aria-labelledby="achievement-index-heading">
        <div className="mb-2 flex items-baseline justify-between border-b border-bg-border pb-2">
          <h2 id="achievement-index-heading" className="font-mono text-sm font-semibold uppercase tracking-wider text-text-primary">Achievement Awards</h2>
          <span className="font-mono text-[9px] uppercase text-text-muted">Hexagonal insignia</span>
        </div>
        <div>
          {groups.map((group, index) => {
            const entries = achievements.filter((entry) => entry.group === group);
            return (
              <Group key={group} title={entries[0]?.group_title ?? group} open={index === 0}>
                {entries.map((entry) => (
                  <article key={entry.id} className="flex items-center gap-4 border-b border-bg-border-subtle py-4 last:border-0">
                    <AchievementArtwork sigil={entry.sigil} accent={entry.accent} />
                    <div className="min-w-0">
                      <h3 className="font-mono text-xs font-semibold text-text-primary">{entry.name}</h3>
                      <p className="mt-1 font-sans text-[10px] leading-relaxed text-text-secondary">{entry.description}</p>
                      <p className="mt-1 font-mono text-[9px] leading-relaxed text-text-muted">{entry.proposed_rule}</p>
                      <p className="mt-1 font-sans text-[10px] leading-relaxed text-text-muted">Evidence: {entry.evidence}</p>
                      <span className="mt-1 inline-block font-mono text-[8px] uppercase tracking-wider text-gold">{entry.status}</span>
                    </div>
                  </article>
                ))}
              </Group>
            );
          })}
        </div>
      </section>
    </div>
  );
}
