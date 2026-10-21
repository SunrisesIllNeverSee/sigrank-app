"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePhone } from "../board-mobile/usePhone";
import Link from "next/link";
import pixelCatalog from "./cumulative-pixel-catalog.v2.json";
import communityPixels from "./community-pixel-proposals.v1.json";
import achievementCatalog from "./achievement-index.v1.json";
import { PixelArtwork } from "./BadgeArtwork";
import { PLATFORM_PIXEL_BADGES } from "@/lib/profile/platform-pixels";
import { BOARD_SIGIL } from "@/lib/profile/record-artwork";
import { DISPLAY_METRICS, DISPLAY_RAW } from "@/lib/identity/canon-ids";
import { HexMark, MedalHex } from "./RecordMarks";
import { useBoardSession } from "@/components/live/session";
import "./badge-explorer.css";

export interface BadgeDisplayEntry {
  id: string; label: string; category: string; description: string; rule: string;
  evidence: string; status: string; earned: boolean; kind: "pixel" | "medal" | "achievement";
  pattern?: string; sigil?: string; accent?: string; rank?: number;
  date?: string; dateLabel?: string; snapshotHash?: string | null; submissionId?: string;
}
export interface BadgeProgress { label: string; current: number; target: number; unit: string }
const pixels: BadgeDisplayEntry[] = [...pixelCatalog.entries, ...communityPixels.entries].map(e => ({
  id: e.id, label: e.label, category: e.family, description: "visual_story" in e ? e.visual_story : e.evidence,
  rule: e.threshold, evidence: e.evidence, status: e.status, earned: false, kind: "pixel", pattern: e.pattern,
}));
pixels.push(...PLATFORM_PIXEL_BADGES.map(badge => ({
  id: badge.id, label: badge.label, category: badge.family, description: "Cumulative platform ladder: each reached tier remains unlocked at this platform’s current accepted total.",
  rule: `${badge.threshold.toLocaleString("en-US")} all-time ${badge.platformName} tokens · Input + Output + Cache Write + Cache Read`,
  evidence: "Latest explicitly attributed accepted all-time platform snapshot; overlapping windows are excluded", status: badge.status,
  earned: false, kind: "pixel" as const, pattern: badge.pattern,
})));
const achievements: BadgeDisplayEntry[] = achievementCatalog.entries.map(e => ({
  id: e.id, label: e.name, category: e.group_title, description: e.description,
  rule: e.proposed_rule, evidence: e.evidence, status: e.status, earned: false, kind: "achievement", sigil: e.sigil, accent: e.accent,
}));
const newConcepts: BadgeDisplayEntry[] = [
  ["share-first", "Signal Ambassador", "SHARING", "Share an operator card.", "First confirmed share", "Needs a durable share-event ledger", "↗"],
  ["share-ten", "Signal Broadcaster", "SHARING", "Share ten different operator cards.", "10 distinct confirmed shares", "Needs deduplicated, authenticated share events", "⇶"],
  ["watch-first", "Field Scout", "WATCHES", "Watch a real operator.", "1 active watch", "Own authenticated watchlist; rule proposal", "◉"],
  ["watch-ten", "Signal Network", "WATCHES", "Build an operator watchlist.", "10 distinct active watches", "Own authenticated watchlist; rule proposal", "⊙"],
  ["claude-10m", "Claude Operator", "PLATFORM USE", "Process accepted tokens on Claude.", "10M all-time processed tokens on Claude", "Accepted per-platform totals; never sum overlapping windows", "C"],
  ["codex-10m", "Codex Operator", "PLATFORM USE", "Process accepted tokens on Codex.", "10M all-time processed tokens on Codex", "Accepted per-platform totals; never sum overlapping windows", "⌘"],
  ["platform-dual", "Dual Engine", "COMBINATIONS", "Reach the platform milestone on both Claude and Codex.", "10M accepted tokens on each platform", "Two independent accepted platform totals", "⋈"],
  ["platform-triple", "Operator Constellation", "COMBINATIONS", "Reach the milestone on three platforms.", "10M accepted tokens on three distinct platforms", "Three independent accepted platform totals", "✣"],
  ["community-combo", "Signal Connector", "COMBINATIONS", "Combine sharing and operator discovery.", "Share a card + watch a distinct operator", "Authenticated share and watch evidence; rule proposal", "⌁"],
].map(([id, label, category, description, rule, evidence, sigil]) => ({
  id, label, category, description, rule, evidence, sigil, status: "proposed · not issued", earned: false, kind: "achievement", accent: "#44d9d3",
}));

const medals: BadgeDisplayEntry[] = Object.entries(BOARD_SIGIL).flatMap(([id, art]) => [1, 2, 3].map(rank => ({
  id: `medal:${id}:${rank}`, label: `${[...DISPLAY_METRICS, ...DISPLAY_RAW].find(d => d.id === id)?.name ?? id} · #${rank}`,
  category: "LIVE BOARD MEDALS", description: `Current rank ${rank} on this metric’s all-time board.`,
  rule: `Hold #${rank} on ${id}`, evidence: "Accepted current leaderboard standings", status: "existing", earned: false,
  kind: "medal" as const, sigil: art.s, accent: art.ink, rank,
})));

type Mode = "earned" | "pixels" | "achievements";
const modes: { key: Mode; label: string }[] = [{ key: "earned", label: "Your badges" }, { key: "pixels", label: "Badge index" }, { key: "achievements", label: "Achievement index" }];
function Artwork({ item, size }: { item: BadgeDisplayEntry; size: number }) {
  if (item.pattern) return <PixelArtwork pattern={item.pattern} size={size} />;
  if (item.rank != null) return <MedalHex rank={item.rank} sigil={item.sigil ?? "◆"} ink={item.accent} size={size} />;
  return <HexMark sigil={item.sigil ?? "◇"} ring={item.accent ?? "#bd83ff"} size={size} />;
}

export function BadgeExplorer({ earned, progress, platformProgress = [], leftTarget, rightTarget }: {
  earned?: BadgeDisplayEntry[]; progress?: BadgeProgress | null; platformProgress?: BadgeProgress[]; leftTarget?: string; rightTarget?: string;
}) {
  const session = useBoardSession();
  const [mode, setMode] = useState<Mode>(earned ? "earned" : "pixels");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [previewColors, setPreviewColors] = useState(false);
  const [targets, setTargets] = useState<{ left: HTMLElement | null; right: HTMLElement | null }>({ left: null, right: null });
  const [detail, setDetail] = useState<{ item: BadgeDisplayEntry; x: number; y: number; pinned: boolean } | null>(null);
  useEffect(() => {
    const locate = () => {
      const left = leftTarget ? document.getElementById(leftTarget) : null;
      const right = rightTarget ? document.getElementById(rightTarget) : null;
      setTargets(previous => previous.left === left && previous.right === right ? previous : { left, right });
      if ((!leftTarget || left) && (!rightTarget || right)) observer.disconnect();
    };
    const observer = new MutationObserver(locate);
    observer.observe(document.body, { childList: true, subtree: true });
    locate();
    return () => observer.disconnect();
  }, [leftTarget, rightTarget]);
  /* owner 2026-10-21 (phone): the pinned detail is a modal bottom sheet — scrim tap and Esc close it,
     focus moves in and returns to the tile that opened it, and the page behind is inert meanwhile. */
  const isPhone = usePhone();
  const sheetRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const noReveal = useRef(false);
  const returnRef = useRef<HTMLElement | null>(null);
  const pinnedOpen = !!detail?.pinned;
  const closeDetail = () => {
    setDetail(null);
    // focus goes back to the tile once the page is no longer inert (see the modal effect cleanup)
    if (isPhone) returnRef.current = openerRef.current;
    openerRef.current = null;
  };
  const closeRef = useRef(closeDetail);
  closeRef.current = closeDetail;
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const modal = isPhone && pinnedOpen;
  useEffect(() => {
    if (!modal) return;
    const sheet = sheetRef.current;
    sheet?.focus({ preventScroll: true });
    const inerted: Element[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el.hasAttribute("data-badge-modal") || el.hasAttribute("inert")) continue;
      el.setAttribute("inert", "");
      inerted.push(el);
    }
    return () => {
      inerted.forEach((el) => el.removeAttribute("inert"));
      const back = returnRef.current;
      returnRef.current = null;
      if (back && document.contains(back)) {
        noReveal.current = true; // refocusing the tile must not re-open it as a tooltip
        back.focus({ preventScroll: true });
        window.setTimeout(() => { noReveal.current = false; }, 0);
      }
    };
  }, [modal]);
  const held = new Map((earned ?? []).map(e => [e.id, e]));
  const allPixels = pixels.map(e => held.has(e.id) ? { ...held.get(e.id)!, category: e.category } : e);
  const allAchievements = [...achievements, ...newConcepts, ...medals].map(e => held.has(e.id) ? { ...held.get(e.id)!, category: e.category } : e);
  const all = [...allPixels, ...allAchievements, ...(earned ?? []).filter(e => !pixels.some(p => p.id === e.id) && !allAchievements.some(p => p.id === e.id))];
  const source = mode === "earned" ? earned ?? [] : mode === "pixels" ? allPixels : allAchievements;
  const categories = [...new Set(source.map(e => e.category))];
  const visible = source.filter(e => (category === "all" || e.category === category) &&
    `${e.label} ${e.category} ${e.description} ${e.rule} ${e.evidence}`.toLowerCase().includes(query.trim().toLowerCase()));
  const choose = (next: Mode) => { setMode(next); setCategory("all"); setQuery(""); setPreviewColors(false); setDetail(null); };
  const reveal = (item: BadgeDisplayEntry, element: HTMLElement, pinned = false) => {
    if (noReveal.current && !pinned) return;
    if (detail?.pinned && !pinned) return;
    if (pinned) openerRef.current = element;
    const rect = element.getBoundingClientRect();
    setDetail({ item, x: Math.max(12, Math.min(window.innerWidth - 332, rect.right + 8)), y: Math.max(12, Math.min(window.innerHeight - 360, rect.top)), pinned });
  };
  const tile = (item: BadgeDisplayEntry, mini = false) => <button key={item.id} type="button"
    className={`badge-tile ${item.earned ? "earned" : "locked"} ${mini ? "mini" : ""} ${!mini && mode === "pixels" && previewColors ? "design-preview" : ""}`}
    aria-label={`${item.label}: ${item.earned ? "earned" : "not earned"}`} aria-describedby={detail?.item.id === item.id ? "badge-inspect-detail" : undefined}
    onMouseEnter={e => reveal(item, e.currentTarget)} onFocus={e => reveal(item, e.currentTarget)}
    onMouseLeave={() => { if (!detail?.pinned) setDetail(null); }} onBlur={() => { if (!detail?.pinned) setDetail(null); }}
    onClick={e => reveal(item, e.currentTarget, true)}>
    <Artwork item={item} size={mini ? 24 : item.earned || (mode === "pixels" && previewColors) ? 68 : 30} />
    {!mini && <span>{item.label}</span>}
  </button>;
  const navigation = <div className="badge-navigation">
    <nav role="tablist" aria-label="Badge collections">{modes.map(m => <button type="button" role="tab" key={m.key}
      id={`badge-tab-${leftTarget ?? "catalog"}-${m.key}`} aria-controls={`badge-panel-${leftTarget ?? "catalog"}`}
      tabIndex={mode === m.key ? 0 : -1} aria-selected={mode === m.key}
      onKeyDown={event => {
        const index = modes.findIndex(tab => tab.key === m.key);
        const next = event.key === "ArrowDown" || event.key === "ArrowRight" ? (index + 1) % modes.length
          : event.key === "ArrowUp" || event.key === "ArrowLeft" ? (index + modes.length - 1) % modes.length
          : event.key === "Home" ? 0 : event.key === "End" ? modes.length - 1 : null;
        if (next === null) return;
        event.preventDefault(); choose(modes[next].key);
        (event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next])?.focus();
      }} onClick={() => choose(m.key)}>{m.label}</button>)}</nav>
    {earned && <div className="mod"><h3><span className="sq" />EARNED → NEXT</h3><p>{earned.length} current awards</p>
      {progress ? <><strong>{progress.label}</strong><progress value={Math.max(0, progress.current)} max={progress.target} aria-label={`Progress to ${progress.label}`} />
        <p>{progress.current.toLocaleString(undefined, { maximumFractionDigits: 1 })} / {progress.target.toLocaleString()} {progress.unit}</p></> : <p>No further active numeric milestone.</p>}
    </div>}
    {platformProgress.length > 0 && <div className="mod"><h3><span className="sq" />PLATFORM · NEXT TIERS</h3>
      {platformProgress.map(p => <div key={p.label}><strong>{p.label}</strong><progress value={p.current} max={p.target} aria-label={`Progress to ${p.label}`} /><p>{p.current.toLocaleString()} / {p.target.toLocaleString()} tokens</p></div>)}
    </div>}
  </div>;
  const ledger = <div className="badge-ledger"><h3>BADGES · ACHIEVEMENTS · MEDALS</h3><p>Color = earned · dim = unearned</p>
    <div className="badge-mini-grid">{all.map(e => tile(e, true))}</div>
  </div>;
  return <div className="badge-explorer" id={`badge-panel-${leftTarget ?? "catalog"}`} role="tabpanel" aria-labelledby={`badge-tab-${leftTarget ?? "catalog"}-${mode}`}>
    {targets.left ? createPortal(navigation, targets.left) : navigation}
    {targets.right && createPortal(ledger, targets.right)}
    <header><h2>{modes.find(m => m.key === mode)?.label}</h2><span>{visible.length} shown</span></header>
    <div className="badge-search"><input type="search" aria-label="Search badges and achievements" placeholder="Search name, rule or platform…" value={query} onChange={e => setQuery(e.target.value)} />
      <select aria-label="Badge section" value={category} onChange={e => setCategory(e.target.value)}><option value="all">All sections</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
    {mode === "pixels" && <button type="button" className="badge-color-preview" aria-pressed={previewColors} onClick={() => setPreviewColors(v => !v)}>Color preview {previewColors ? "ON" : "OFF"}</button>}
    {mode === "earned" && !earned && <p><Link href={session.codename ? `/user/${encodeURIComponent(session.codename)}?tab=badges` : "/login?next=/me"}>Open your profile’s earned badges →</Link></p>}
    {mode !== "earned" && <p className="badge-note">Hover or focus for requirements. Click for evidence details. Proposed designs remain unissued even when a draft target is met.</p>}
    <div className={`badge-section-grid ${mode === "earned" ? "own" : ""}`}>
    {[...new Set(visible.map(e => e.category))].map(group => <details className="badge-group" key={group} open>
      <summary>{group} · {visible.filter(e => e.category === group).length}</summary><div className="badge-grid">{visible.filter(e => e.category === group).map(e => tile(e))}</div>
    </details>)}
    </div>
    {visible.length === 0 && (earned || mode !== "earned") && <p>No matching awards.</p>}
    {detail && typeof document !== "undefined" && createPortal(<>
    {modal && <div className="badge-scrim" data-badge-modal="" onClick={closeDetail} role="presentation" />}
    <aside id="badge-inspect-detail" className="badge-detail" role={detail.pinned ? "dialog" : "tooltip"} ref={sheetRef} data-badge-modal=""
      aria-modal={modal || undefined} tabIndex={modal ? -1 : undefined}
      onKeyDown={modal ? (e) => { if (e.key === "Tab") { e.preventDefault(); sheetRef.current?.querySelector<HTMLElement>("button")?.focus(); } } : undefined}
      aria-label={detail.item.label} style={{ left: detail.x, top: detail.y }}>
      {detail.pinned && <button type="button" aria-label="Close badge details" onClick={closeDetail}>✕</button>}
      <div className="badge-detail-art"><Artwork item={detail.item} size={detail.item.pattern ? 96 : 64} /></div>
      <strong>{detail.item.label}</strong><p>{detail.item.description}</p><p>{detail.item.rule}</p>
      <p>{detail.item.earned ? "Earned / current standing" : `Not earned · ${detail.item.status}`}</p>
      <p>Evidence: {detail.item.evidence}</p>
      {detail.item.date && <p>{detail.item.dateLabel ?? "Evidence date"}: {detail.item.date}</p>}
      {detail.item.submissionId && <p>Submission ID: {detail.item.submissionId}</p>}
      {detail.item.snapshotHash ? <p>Snapshot proof hash: <code>{detail.item.snapshotHash}</code></p> : detail.item.earned && <p>No linked snapshot proof hash available for this item.</p>}
    </aside></>, document.body)}
  </div>;
}
