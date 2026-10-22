import type { Metadata } from "next";
import { withOG } from "@/lib/seo";
import BoardWindowPage from "./board/[window]/page";

export const revalidate = 3600;

export const metadata: Metadata = withOG({
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

export default function HomePage() {
  return <BoardWindowPage params={Promise.resolve({ window: "all" })} />;
}
