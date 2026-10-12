/**
 * components/profile-v2/SocialView.tsx — the SOCIAL tab for the v2 profile redesign.
 *
 * Identity surface modeled on _workspace/profile-mocks/social.html:
 *
 *   1. OPERATOR IDENTITY — 80px avatar, display name, codename, handle, status
 *      badges (CLAIMED / VERIFIED / supporter tier), location chip, join date.
 *   2. BIO               — free-text block; owners get the profile edit modal.
 *   3. LINKS             — github / x / site / discord chips with inline icons.
 *   4. BADGES EARNED     — rank badges from trophy counts, class badge, verified
 *      badge, milestone badges. Earned bright, locked at 30% opacity.
 *   5. SHARE PROFILE     — profile URL + passport card preview (the OG image
 *      route at /user/[codename]/opengraph-image).
 *
 * Server component. For private profiles the parent nulls bio/links/location/
 * handle — when every personal field is null this renders the privacy notice
 * instead of the personal modules. The only client island is ProfileEditModal,
 * which self-gates on ownership.
 */

import type { Operator, ScoredSnapshot } from "@/lib/analytics/scoring-types";
import type { HallRecord } from "@/lib/board";
import type { TrophyCounts } from "@/lib/analytics/trophy-counts";
import { OperatorAvatar } from "@/components/sigrank/OperatorAvatar";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";

export interface SocialViewProps {
  operator: Operator;
  snapshot: ScoredSnapshot;
  isOwner: boolean; // for edit buttons
  records: HallRecord[];
  trophyCounts: TrophyCounts | null;
}

const GOLD = "rgb(var(--gold))";
const ACCENT = "rgb(var(--accent))";
const MUTED = "rgb(var(--text-muted))";

const DAY_MS = 86_400_000;

const SUPPORTER_LABEL: Record<string, string> = {
  patron: "PATRON",
  pro: "PRO",
  circle_sponsor: "CIRCLE",
};

const joinDate = (ageDays: number): Date =>
  new Date(Date.now() - Math.max(0, ageDays) * DAY_MS);

const fmtJoin = (ageDays: number): string =>
  joinDate(ageDays)
    .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    .toUpperCase();

const fmtRecordDate = (d: string): string => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt
        .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
        .toUpperCase();
};

/* ── shared chrome ── */
function Module({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-bg-border bg-bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-bg-border pb-2.5">
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-text-muted opacity-70">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-2.5 w-2.5 shrink-0"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StatusBadge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 60%, transparent)`,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
    >
      <CheckIcon />
      {children}
    </span>
  );
}

/* ═══════════════ 1. OPERATOR IDENTITY ═══════════════ */
function IdentityModule({
  operator,
  isPrivateView,
}: {
  operator: Operator;
  isPrivateView: boolean;
}) {
  const name = operator.display_name ?? operator.codename;
  const supporter =
    operator.current_supporter_tier !== "free"
      ? SUPPORTER_LABEL[operator.current_supporter_tier] ??
        operator.current_supporter_tier.toUpperCase()
      : null;

  return (
    <Module title="Operator Identity" subtitle="Public profile">
      <div className="flex flex-wrap items-center gap-5">
        <OperatorAvatar src={operator.avatar_url} alt={name} size={80} />
        <div className="min-w-0">
          <div className="text-[22px] font-bold leading-tight tracking-wide text-text-primary">
            {name}
          </div>
          {name !== operator.codename && (
            <div className="mt-1 font-mono text-[11px] tracking-[0.04em] text-text-muted">
              {operator.codename}
            </div>
          )}
          {operator.handle && (
            <div className="mt-1 font-mono text-[11px] tracking-[0.03em]" style={{ color: ACCENT }}>
              @{operator.handle.replace(/^@/, "")}
            </div>
          )}
        </div>
        <div className="ml-auto flex max-w-[300px] flex-wrap justify-end gap-1.5">
          {operator.claimed && <StatusBadge color={GOLD}>Claimed</StatusBadge>}
          {operator.verification_status !== "unverified" && (
            <StatusBadge color={ACCENT}>
              {operator.verification_status === "audited" ? "Audited" : "Verified"}
            </StatusBadge>
          )}
          {supporter && (
            <StatusBadge color="rgb(var(--rank-1))">{supporter}</StatusBadge>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-bg-border pt-3.5">
        {operator.location && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-bg-border bg-bg-elevated px-2.5 py-1 font-mono text-[10px] tracking-[0.05em] text-text-secondary">
            <svg viewBox="0 0 24 24" className="h-[11px] w-[11px] shrink-0" fill={MUTED} aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {operator.location}
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">
          Joined{" "}
          <b className="font-semibold text-text-secondary">
            {fmtJoin(operator.account_age_days)}
          </b>
          {" · "}
          <b className="font-semibold text-text-secondary">
            {operator.account_age_days} DAYS
          </b>
        </span>
      </div>
      {isPrivateView && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">
          Personal fields hidden — private profile
        </p>
      )}
    </Module>
  );
}

/* ═══════════════ 3. LINKS ═══════════════ */
const asUrl = (v: string, base: string): string =>
  /^https?:\/\//i.test(v) ? v : `${base}${v.replace(/^@/, "")}`;

const stripProto = (v: string): string => v.replace(/^https?:\/\//i, "").replace(/\/$/, "");

interface LinkChip {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

function linkChips(operator: Operator): LinkChip[] {
  const links = operator.links ?? {};
  const discord = (links as { discord?: string }).discord;
  const out: LinkChip[] = [];

  if (links.github) {
    out.push({
      key: "github",
      label: links.github.replace(/^@/, "").replace(/^https?:\/\/(www\.)?github\.com\//i, ""),
      href: asUrl(links.github, "https://github.com/"),
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden="true">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
    });
  }
  if (links.x) {
    const handle = links.x.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "");
    out.push({
      key: "x",
      label: `@${handle}`,
      href: asUrl(links.x, "https://x.com/"),
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    });
  }
  if (links.site) {
    out.push({
      key: "site",
      label: stripProto(links.site),
      href: asUrl(links.site, "https://"),
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.93 9h-3.02a15.7 15.7 0 0 0-1.2-5.02A8.02 8.02 0 0 1 19.93 11zM12 4.06c.83 1.2 1.83 3.35 2.03 6.94h-4.06c.2-3.59 1.2-5.74 2.03-6.94zM4.07 13h3.02c.2 2.13.63 3.87 1.2 5.02A8.02 8.02 0 0 1 4.07 13zm3.02-2H4.07a8.02 8.02 0 0 1 4.22-5.02A15.7 15.7 0 0 0 7.09 11zm2.88 2h4.06c-.2 3.59-1.2 5.74-2.03 6.94-.83-1.2-1.83-3.35-2.03-6.94zm5.74 5.02c.57-1.15 1-2.89 1.2-5.02h3.02a8.02 8.02 0 0 1-4.22 5.02z" />
        </svg>
      ),
    });
  }
  if (discord) {
    out.push({
      key: "discord",
      label: discord.replace(/^@/, ""),
      href: /^https?:\/\//i.test(discord) ? discord : `https://discord.com/users/${discord}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden="true">
          <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.098.246.198.373.292a.077.077 0 0 1-.007.128 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029zM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.419s.956-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419s.955-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419z" />
        </svg>
      ),
    });
  }
  return out;
}

function LinksModule({ operator }: { operator: Operator }) {
  const chips = linkChips(operator);
  return (
    <Module title="Links" subtitle="External profiles">
      {chips.length === 0 ? (
        <p className="font-mono text-xs text-text-muted">No links added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-mono text-[11px] text-text-secondary transition-colors hover:border-gold hover:text-text-primary"
            >
              {c.icon}
              {c.label}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-2.5 w-2.5 shrink-0 opacity-45"
                stroke={MUTED}
                aria-hidden="true"
              >
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </Module>
  );
}

/* ═══════════════ 4. BADGES EARNED ═══════════════ */
interface BadgeDef {
  rank: string;
  name: string;
  sub?: string;
  color: string;
  locked?: boolean;
}

function BadgesModule({
  operator,
  snapshot,
  records,
  trophyCounts,
}: {
  operator: Operator;
  snapshot: ScoredSnapshot;
  records: HallRecord[];
  trophyCounts: TrophyCounts | null;
}) {
  const badges: BadgeDef[] = [];

  // Metric rank badges from the live board (#1 gold / #2 silver / #3 bronze).
  const dyn = trophyCounts?.dynamicRecords ?? [];
  for (const r of dyn) {
    badges.push({
      rank: `#${r.rank}`,
      name: r.name,
      sub: r.value,
      color:
        r.rank === 1
          ? "rgb(var(--rank-1))"
          : r.rank === 2
            ? "rgb(var(--rank-2))"
            : "rgb(var(--rank-3))",
    });
  }

  // Class badge.
  badges.push({
    rank: snapshot.class_tier,
    name: "Class",
    color: "rgb(var(--class-power))",
  });

  // Verified identity badge.
  if (operator.verification_status !== "unverified") {
    badges.push({
      rank: operator.verification_status === "audited" ? "AUDITED" : "VERIFIED",
      name: "Identity",
      color: ACCENT,
    });
  }

  // Milestone: hall record holder.
  if (records.length > 0) {
    const earliest = records.map((r) => r.date).sort()[0];
    badges.push({
      rank: "RECORD HOLDER",
      name: "Hall of Signal",
      sub: earliest ? `SINCE ${fmtRecordDate(earliest)}` : `${records.length} HELD`,
      color: "rgb(var(--rank-1))",
    });
  }

  // Locked teasers — #1 boards not yet held (up to 2) + the 500-snapshot milestone.
  const held = new Set(dyn.filter((r) => r.rank === 1).map((r) => r.name));
  const lockCandidates = ["Velocity", "SNR", "Scale V", "Cost per 1M"]
    .filter((n) => !held.has(n))
    .slice(0, 2);
  for (const n of lockCandidates) {
    badges.push({ rank: "#1", name: n, sub: "Locked", color: MUTED, locked: true });
  }
  badges.push({ rank: "500TH", name: "Snapshot", sub: "Locked", color: MUTED, locked: true });

  const earned = badges.filter((b) => !b.locked).length;
  const locked = badges.length - earned;

  return (
    <Module
      title="Badges Earned"
      subtitle={`${earned} earned · ${locked} locked`}
    >
      <div className="flex flex-wrap gap-2">
        {badges.map((b, i) => (
          <div
            key={`${b.name}-${i}`}
            title={b.locked ? `Locked — ${b.name}` : `${b.rank} ${b.name}`}
            className={`flex min-w-[110px] flex-1 basis-[calc(33%-8px)] flex-col items-center gap-1 rounded-md border bg-bg-elevated px-3 py-2.5 text-center transition-transform sm:flex-none ${
              b.locked ? "opacity-30 saturate-[0.4]" : "hover:-translate-y-0.5"
            }`}
            style={{
              borderColor: b.locked
                ? "rgb(var(--bg-border))"
                : `color-mix(in srgb, ${b.color} 45%, rgb(var(--bg-border)))`,
            }}
          >
            <span
              className="font-mono text-[15px] font-bold leading-none"
              style={{ color: b.locked ? "rgb(var(--text-secondary))" : b.color }}
            >
              {b.rank}
            </span>
            <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              {b.name}
            </span>
            {b.sub && (
              <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-text-muted opacity-75">
                {b.sub}
              </span>
            )}
          </div>
        ))}
      </div>
    </Module>
  );
}

/* ═══════════════ 5. SHARE PROFILE ═══════════════ */
function ShareModule({ operator }: { operator: Operator }) {
  const ogPath = `/user/${encodeURIComponent(operator.codename)}/opengraph-image`;
  return (
    <Module title="Share Profile" subtitle="Card + link">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
        {/* Passport card preview — the OG image route already exists. */}
        <div>
          <a
            href={ogPath}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-[240px] overflow-hidden rounded-md border border-bg-border transition-colors hover:border-gold/50"
            title="Open passport card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- OG image route preview; fixed decorative size */}
            <img
              src={ogPath}
              alt={`${operator.display_name ?? operator.codename} passport card`}
              width={240}
              height={126}
              className="block h-auto w-full"
            />
          </a>
          <div className="mt-2.5 flex gap-1.5">
            <a
              href={ogPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-gold px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-gold transition-colors hover:bg-gold/10"
            >
              Passport card ↗
            </a>
          </div>
        </div>

        {/* Link share */}
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Profile link
            </div>
            <div className="mt-1.5 flex items-stretch gap-2">
              <span className="flex min-w-0 flex-1 items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-bg-border bg-bg-elevated px-3 py-2.5 font-mono text-[11.5px] text-text-secondary">
                <b className="font-semibold text-gold">signalaf.com</b>
                /user/{operator.codename}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.04em] text-text-muted">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[11px] w-[11px] shrink-0" stroke={MUTED} aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Cards auto-update with latest snapshot
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-muted opacity-70">
            Card renders at 1200×630 · safe for X / Discord embeds
          </div>
        </div>
      </div>
    </Module>
  );
}

/* ═══════════════ VIEW ═══════════════ */
export function SocialView({
  operator,
  snapshot,
  isOwner,
  records,
  trophyCounts,
}: SocialViewProps) {
  const links = operator.links ?? {};
  const hasLinks = !!(
    links.github ||
    links.site ||
    links.x ||
    (links as { discord?: string }).discord
  );
  // Per the parent contract every personal field is nulled for private
  // profiles — all-null means the viewer sees the privacy notice.
  const allPersonalNull =
    !operator.bio && !operator.location && !operator.handle && !hasLinks;
  const isPrivateView =
    operator.profile_visibility === "private" ||
    (allPersonalNull && operator.profile_visibility !== "public");

  if (isPrivateView) {
    return (
      <div className="flex flex-col gap-4">
        <IdentityModule operator={operator} isPrivateView />
        <Module title="Private Profile" subtitle="Restricted">
          <p className="font-mono text-xs leading-relaxed text-text-muted">
            This operator&apos;s profile is private.
          </p>
        </Module>
        <BadgesModule
          operator={operator}
          snapshot={snapshot}
          records={records}
          trophyCounts={trophyCounts}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <IdentityModule operator={operator} isPrivateView={false} />

      <Module
        title="Bio"
        action={
          isOwner ? <ProfileEditModal codename={operator.codename} /> : undefined
        }
      >
        {operator.bio ? (
          <p className="max-w-[64ch] text-sm leading-relaxed text-text-secondary">
            {operator.bio}
          </p>
        ) : (
          <p className="font-mono text-xs text-text-muted">No bio yet.</p>
        )}
      </Module>

      <LinksModule operator={operator} />
      <BadgesModule
        operator={operator}
        snapshot={snapshot}
        records={records}
        trophyCounts={trophyCounts}
      />
      <ShareModule operator={operator} />
    </div>
  );
}
