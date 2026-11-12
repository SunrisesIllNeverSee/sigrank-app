/**
 * app/board/[window]/page.tsx — the per-window live leaderboard route.
 * The board itself lives in ./board-window (shared with the homepage).
 */
import type { Metadata } from "next";
import {
  BoardWindowPage,
  generateMetadata as boardMetadata,
  generateStaticParams as boardStaticParams,
} from "./board-window";

export const revalidate = 3600;

export function generateStaticParams() {
  return boardStaticParams();
}

export function generateMetadata(props: { params: Promise<{ window: string }> }): Promise<Metadata> {
  return boardMetadata(props);
}

export default BoardWindowPage;
