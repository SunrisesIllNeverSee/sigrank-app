import { permanentRedirect } from "next/navigation";

// Owner decision (2026-10-22): /board/all is the home URL. The all-time board
// is the landing page; / forwards (308) so the canonical address is
// /board/all. The board workspace emits its own metadata + JSON-LD.
export default function HomePage() {
  permanentRedirect("/board/all");
}
