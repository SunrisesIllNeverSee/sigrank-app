import type { Metadata } from "next";
import { withOG } from "@/lib/seo";
import { isBoardUnavailable, renderBoardWindow } from "./board/[window]/board-window";

export const revalidate = 3600;

const baseMetadata: Metadata = withOG({
  title: "AI User Leaderboard · SigRank SignalAF",
  description:
    "The SigRank AI user leaderboard — AI users ranked by Υ Yield (token cascade efficiency). See how top AI operators compare all-time.",
  path: "/",
  ogImage: {
    url: "/board/all/og",
    width: 1200,
    height: 630,
    alt: "SigRank AI User Leaderboard",
  },
});

/** noindex while the live data is unavailable (2026-11-14): see isBoardUnavailable. */
export async function generateMetadata(): Promise<Metadata> {
  return (await isBoardUnavailable("all"))
    ? { ...baseMetadata, robots: { index: false, follow: true } }
    : baseMetadata;
}

export default async function HomePage() {
  return renderBoardWindow("all", { home: true });
}
