"use client";

/**
 * RankMe — the board's conversion path without a hero (owner 2026-11-11:
 * "the whole point of the leaderboard is to not have a hero").
 *
 *   - YouRow / YouCard: a ghost "You" row pinned above the ranked field for
 *     signed-out visitors (desktop table row / phone card). It is part of the
 *     leaderboard, not a banner.
 *   - RankMeCommands: the two steps (see your score, get on the board), each
 *     with a Copy button. Shown in the phone "Rank me" sheet.
 *
 * Token counts only, never prompts; `submit --dry-run` prints the exact payload.
 */
import { useState } from "react";
import Link from "next/link";
import { liveTrack } from "./analytics";
import "./rank-me.css";

type Surface = "you_row" | "rank_me";

function CopyCmd({ cmd, surface }: { cmd: string; surface: Surface }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* clipboard blocked — the command stays visible to select by hand */
    }
    liveTrack.cliCommandCopied({ command: cmd, surface });
  };
  return (
    <span className="rm-cmd">
      <code>{cmd}</code>
      <button type="button" className="rm-copy" onClick={copy} aria-label={`Copy ${cmd}`}>
        {done ? "Copied" : "Copy"}
      </button>
    </span>
  );
}

export const RANK_ME_STEPS: { title: string; note: string; cmd: string }[] = [
  { title: "See your score", note: "Reads your local usage logs. Nothing is sent.", cmd: "npx sigrank" },
  { title: "Get on the board", note: "Link your profile, then submit. Add --dry-run to see the exact payload first.", cmd: "npx sigrank enroll && npx sigrank submit" },
];

export function RankMeCommands() {
  return (
    <div className="rm-steps">
      {RANK_ME_STEPS.map((s, n) => (
        <div key={s.cmd} className="rm-step">
          <div className="rm-step-t"><span className="rm-n">{n + 1}</span>{s.title}</div>
          <CopyCmd cmd={s.cmd} surface="rank_me" />
          <p className="rm-note">{s.note}</p>
        </div>
      ))}
      <p className="rm-foot">
        Token counts only, never prompts.{" "}
        <Link href="/signup">Create your operator profile →</Link>
      </p>
    </div>
  );
}

/** Desktop: ghost row above rank #1. `span` covers every board column. */
export function YouRow({ span = 99 }: { span?: number }) {
  return (
    <tr className="you-row" aria-label="Your position">
      <td colSpan={span}>
        <div className="you-in">
          <span className="you-rank">#?</span>
          <span className="you-name">You</span>
          <span className="you-y">Υ —</span>
          <CopyCmd cmd="npx sigrank" surface="you_row" />
          <span className="you-note">See where you&rsquo;d land. Token counts only.</span>
          <Link className="you-link" href="/signup">Get on the board →</Link>
        </div>
      </td>
    </tr>
  );
}

/** Phone: the same ghost row as the first card. */
export function YouCard() {
  return (
    <li className="bc-you" aria-label="Your position">
      <div className="you-top">
        <span className="you-rank">#?</span>
        <span className="you-name">You</span>
        <span className="you-y">Υ —</span>
      </div>
      <CopyCmd cmd="npx sigrank" surface="you_row" />
      <span className="you-note">See where you&rsquo;d land. Token counts only.</span>
    </li>
  );
}
