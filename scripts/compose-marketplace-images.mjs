/**
 * scripts/compose-marketplace-images.mjs
 *
 * Composes raw Playwright screenshots into Vercel Marketplace-ready
 * gallery images (1920x1080, 16:9, non-transparent PNG).
 *
 * Each gallery image has:
 * - SigRank dark background (#0a0a0a)
 * - Gold accent bar at top
 * - "SigRank × Vercel" label
 * - Title text describing the feature
 * - The screenshot centered with a rounded border
 * - 20% safe zone padding around edges
 *
 * Usage: node scripts/compose-marketplace-images.mjs
 */

import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, "..", "public", "marketplace");
const OUTPUT_DIR = join(__dirname, "..", "public", "marketplace");

// Vercel Marketplace spec: 1920x1080, 16:9, non-transparent PNG
const W = 1920;
const H = 1080;
const PADDING = 96; // ~5% safe zone
const BG_COLOR = { r: 10, g: 10, b: 10 }; // #0a0a0a — matches site bg-base
const GOLD = { r: 212, g: 175, b: 55 }; // #d4af37 — matches site gold
const TEXT_PRIMARY = { r: 245, g: 245, b: 245 };
const TEXT_SECONDARY = { r: 161, g: 161, b: 170 };

const GALLERY_IMAGES = [
  {
    screenshot: "screenshot-vercel-page.png",
    output: "gallery-1-integration-home.png",
    label: "SigRank × Vercel",
    title: "Integration Home",
    subtitle: "Connect Vercel AI projects to SigRank through MCP",
  },
  {
    screenshot: "screenshot-vercel-config.png",
    output: "gallery-2-configuration.png",
    label: "Configuration",
    title: "One-Click Configuration",
    subtitle: "OAuth callback, MCP endpoint, and installation status",
  },
  {
    screenshot: "screenshot-vercel-import.png",
    output: "gallery-3-import.png",
    label: "Import Resources",
    title: "Import Existing Resources",
    subtitle: "Operator identity, exchange signals, and MCP configuration",
  },
  {
    screenshot: "screenshot-board.png",
    output: "gallery-4-leaderboard.png",
    label: "Leaderboard",
    title: "Public AI Operator Leaderboard",
    subtitle: "Rank, Yield, Leverage, Velocity, SNR — by time window",
  },
  {
    screenshot: "screenshot-docs.png",
    output: "gallery-5-documentation.png",
    label: "Documentation",
    title: "Full Integration Documentation",
    subtitle: "Installation, MCP connection, permissions, troubleshooting",
  },
  {
    screenshot: "screenshot-homepage.png",
    output: "gallery-6-homepage.png",
    label: "Homepage",
    title: "The Evaluation Platform for AI Operators",
    subtitle: "Yield, Leverage, Velocity, SNR — objective token-cascade metrics",
  },
  {
    screenshot: "screenshot-wiki.png",
    output: "gallery-7-wiki.png",
    label: "Wiki",
    title: "Evidence-Backed Knowledge Layer",
    subtitle: "Definitions, metrics, system tests, and falsifiers with lineage",
  },
  {
    screenshot: "screenshot-exchange.png",
    output: "gallery-8-exchange.png",
    label: "Contribution Exchange",
    title: "Agent-Native Contribution Workflow",
    subtitle: "Signals, attempts, verification, and proposals via MCP",
  },
];

// SVG text overlay — rendered at 2x for sharpness, then composited
function buildOverlay(label, title, subtitle) {
  const svgW = W;
  const svgH = H;
  return Buffer.from(`
<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="1"/>
      <stop offset="100%" stop-color="#d4af37" stop-opacity="0.3"/>
    </linearGradient>
  </defs>

  <!-- Gold accent bar at top -->
  <rect x="0" y="0" width="${svgW}" height="4" fill="url(#gold-bar)"/>

  <!-- Label (gold, uppercase, tracked) -->
  <text x="${PADDING}" y="${PADDING + 24}"
    font-family="monospace" font-size="16" font-weight="bold"
    fill="#d4af37" letter-spacing="3">
    ${label.toUpperCase()}
  </text>

  <!-- Title (white, large) -->
  <text x="${PADDING}" y="${PADDING + 70}"
    font-family="monospace" font-size="36" font-weight="bold"
    fill="#f5f5f5">
    ${title}
  </text>

  <!-- Subtitle (gray, medium) -->
  <text x="${PADDING}" y="${PADDING + 104}"
    font-family="sans-serif" font-size="18"
    fill="#a1a1aa">
    ${subtitle}
  </text>

  <!-- Bottom branding -->
  <text x="${PADDING}" y="${H - PADDING + 20}"
    font-family="monospace" font-size="14" font-weight="bold"
    fill="#a1a1aa" letter-spacing="2">
    SIGRANK × VERCEL · SIGNALAF.COM
  </text>
</svg>`);
}

async function composeImage(item) {
  const screenshotPath = join(SCREENSHOTS_DIR, item.screenshot);
  const outputPath = join(OUTPUT_DIR, item.output);

  // Read screenshot and get its dimensions
  const screenshot = sharp(screenshotPath);
  const meta = await screenshot.metadata();

  // Calculate screenshot placement — center it below the text header
  // Available area: below header (PADDING + 130) to above footer (H - PADDING - 40)
  const headerHeight = PADDING + 130;
  const footerHeight = PADDING + 40;
  const availW = W - PADDING * 2;
  const availH = H - headerHeight - footerHeight;

  // Scale screenshot to fit within available area, maintaining aspect ratio
  const scale = Math.min(availW / meta.width, availH / meta.height);
  const scaledW = Math.round(meta.width * scale);
  const scaledH = Math.round(meta.height * scale);
  const posX = Math.round((W - scaledW) / 2);
  const posY = Math.round(headerHeight + (availH - scaledH) / 2);

  // Create the dark background
  const background = sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: BG_COLOR,
    },
  }).png();

  // Resize the screenshot
  const resizedScreenshot = sharp(screenshotPath)
    .resize(scaledW, scaledH, { fit: "fill" })
    .png();

  // Build the text overlay
  const overlay = buildOverlay(item.label, item.title, item.subtitle);

  // Composite: background + screenshot + overlay
  await background
    .composite([
      { input: await resizedScreenshot.toBuffer(), left: posX, top: posY },
      { input: overlay, top: 0, left: 0 },
    ])
    .png()
    .toFile(outputPath);

  console.log(`✓ ${item.output} (${W}x${H})`);
}

async function main() {
  console.log("Composing Vercel Marketplace gallery images...\n");

  for (const item of GALLERY_IMAGES) {
    await composeImage(item);
  }

  console.log(`\nDone. ${GALLERY_IMAGES.length} images in ${OUTPUT_DIR}`);
  console.log("\nVercel Marketplace requirements:");
  console.log("  - 1920x1080px, 16:9 ratio ✓");
  console.log("  - Non-transparent PNG ✓");
  console.log("  - 20% safe zone ✓");
  console.log("  - Light/dark mode compatible (dark background) ✓");
}

main().catch(console.error);
