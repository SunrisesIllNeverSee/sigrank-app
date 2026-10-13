export const PLATFORM_PIXEL_TIERS = [
  { key: "10m", label: "10M", tokens: 10_000_000 },
  { key: "100m", label: "100M", tokens: 100_000_000 },
  { key: "1b", label: "1B", tokens: 1_000_000_000 },
  { key: "10b", label: "10B", tokens: 10_000_000_000 },
  { key: "100b", label: "100B", tokens: 100_000_000_000 },
] as const;
const PLATFORMS = [
  { key: "claude", name: "Claude", color: "O", accent: "Y", motif: [".O.O.", "..O..", "OOYOO", "..O..", ".O.O."] },
  { key: "codex", name: "Codex", color: "B", accent: "C", motif: ["B...B", ".B.B.", "..W..", ".B.B.", "B.W.B"] },
  { key: "chatgpt", name: "ChatGPT", color: "G", accent: "C", motif: [".GGG.", "G.C.G", "GCGCG", "G.C.G", ".GGG."] },
  { key: "gemini", name: "Gemini", color: "P", accent: "B", motif: ["..B..", ".BCB.", "BCWCP", ".CPC.", "..P.."] },
  { key: "pi", name: "Pi", color: "L", accent: "G", motif: ["LLLLL", ".L.L.", ".L.L.", ".L.L.", "LL.LL"] },
  { key: "devin", name: "Devin", color: "B", accent: "P", motif: ["BB.BB", "B.C.B", "B.C.B", "B.C.B", "BB.BB"] },
  { key: "omp", name: "Oh My Pi", color: "C", accent: "M", motif: ["CCCCC", "C.P.C", "C.W.C", "C.P.C", "CCCCC"] },
] as const;
export type PlatformPixelKey = typeof PLATFORMS[number]["key"];
export type PlatformPixelId = `platform:${PlatformPixelKey}:${typeof PLATFORM_PIXEL_TIERS[number]["key"]}`;

function pattern(platform: typeof PLATFORMS[number], tier: number) {
  const cells = Array.from({ length: 7 }, () => Array<string>(7).fill("."));
  platform.motif.forEach((row, r) => [...row].forEach((cell, c) => { cells[r + 1][c + 1] = cell; }));
  if (tier >= 1) { cells[0][0] = platform.color; cells[6][6] = platform.color; }
  if (tier >= 2) { cells[0][6] = platform.accent; cells[6][0] = platform.accent; cells[0][3] = "W"; }
  if (tier >= 3) for (let c = 0; c < 7; c++) { cells[0][c] = c % 2 ? platform.color : platform.accent; cells[6][c] = cells[0][c]; }
  if (tier >= 4) {
    for (let r = 0; r < 7; r++) { cells[r][0] = platform.color; cells[r][6] = platform.accent; }
    for (const [r, c] of [[0, 0], [0, 6], [6, 0], [6, 6]]) cells[r][c] = "W";
    cells[0][3] = "Y"; cells[6][3] = "Y";
  }
  return cells.map(row => row.join("")).join("/");
}
export const PLATFORM_PIXEL_BADGES = PLATFORMS.flatMap(platform => PLATFORM_PIXEL_TIERS.map((tier, index) => ({
  id: `platform:${platform.key}:${tier.key}` as PlatformPixelId,
  platform: platform.key, platformName: platform.name, label: `${platform.name} · ${tier.label} tokens`,
  threshold: tier.tokens, pattern: pattern(platform, index),
  family: `platform ladder · ${platform.name}`, status: "active cumulative milestone",
})));
const ALIASES: Record<string, PlatformPixelKey> = {
  claude: "claude", "claude-code": "claude", claude_code: "claude",
  codex: "codex", "codex-cli": "codex", codex_cli: "codex",
  chatgpt: "chatgpt", gemini: "gemini", "gemini-cli": "gemini",
  pi: "pi", "pi-agent": "pi", devin: "devin",
  omp: "omp", "oh-my-pi": "omp", oh_my_pi: "omp",
};
export function canonicalPixelPlatform(platform: string): PlatformPixelKey | null {
  return ALIASES[platform.trim().toLowerCase()] ?? null;
}
export interface PlatformPixelSubmission {
  platform: string; window: string; totalTokens: number | null; snapshotDate: string | null; platformAttributed?: boolean;
}
export function platformPixelTotals(submissions: readonly PlatformPixelSubmission[]) {
  const totals = new Map<PlatformPixelKey, { tokens: number; date: string; conflict: boolean }>();
  for (const submission of submissions) {
    const platform = canonicalPixelPlatform(submission.platform);
    const n = submission.totalTokens;
    const date = submission.snapshotDate;
    if (!platform || submission.platformAttributed !== true || submission.window !== "all_time"
      || n == null || !Number.isFinite(n) || n < 0 || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) continue;
    const previous = totals.get(platform);
    if (!previous || date > previous.date) totals.set(platform, { tokens: n, date, conflict: false });
    else if (date === previous.date && n !== previous.tokens) previous.conflict = true;
  }
  return new Map([...totals].filter(([, fact]) => !fact.conflict).map(([key, fact]) => [key, { tokens: fact.tokens, date: fact.date }]));
}
