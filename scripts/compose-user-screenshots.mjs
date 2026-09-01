/**
 * scripts/compose-user-screenshots.mjs
 * Composes 3 user-provided screenshots into 1920x1080 gallery format.
 */
import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "public", "marketplace");

const W = 1920, H = 1080, PADDING = 96;
const BG_COLOR = { r: 10, g: 10, b: 10 };

const IMAGES = [
  { screenshot: "raw-screenshot-1.png", output: "user-gallery-1.png", label: "SigRank", title: "", subtitle: "" },
  { screenshot: "raw-screenshot-2.png", output: "user-gallery-2.png", label: "SigRank", title: "", subtitle: "" },
  { screenshot: "raw-screenshot-3.png", output: "user-gallery-3.png", label: "SigRank", title: "", subtitle: "" },
];

function buildOverlay(label, title, subtitle) {
  return Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="1"/>
      <stop offset="100%" stop-color="#d4af37" stop-opacity="0.3"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="4" fill="url(#gold-bar)"/>
  ${label ? `<text x="${PADDING}" y="${PADDING + 24}" font-family="monospace" font-size="16" font-weight="bold" fill="#d4af37" letter-spacing="3">${label.toUpperCase()}</text>` : ''}
  ${title ? `<text x="${PADDING}" y="${PADDING + 70}" font-family="monospace" font-size="36" font-weight="bold" fill="#f5f5f5">${title}</text>` : ''}
  ${subtitle ? `<text x="${PADDING}" y="${PADDING + 104}" font-family="sans-serif" font-size="18" fill="#a1a1aa">${subtitle}</text>` : ''}
  <text x="${PADDING}" y="${H - PADDING + 20}" font-family="monospace" font-size="14" font-weight="bold" fill="#a1a1aa" letter-spacing="2">SIGRANK × VERCEL · SIGNALAF.COM</text>
</svg>`);
}

async function composeImage(item) {
  const screenshotPath = join(DIR, item.screenshot);
  const outputPath = join(DIR, item.output);
  const meta = await sharp(screenshotPath).metadata();

  // If already 1920x1080, just add the overlay
  if (meta.width === 1920 && meta.height === 1080) {
    const overlay = buildOverlay(item.label, item.title, item.subtitle);
    await sharp(screenshotPath)
      .composite([{ input: overlay, top: 0, left: 0 }])
      .png()
      .toFile(outputPath);
    console.log(`✓ ${item.output} (1920x1080, native size)`);
    return;
  }

  // Otherwise, scale to fit with dark background
  const headerHeight = item.title || item.subtitle ? PADDING + 130 : PADDING;
  const footerHeight = PADDING + 40;
  const availW = W - PADDING * 2;
  const availH = H - headerHeight - footerHeight;
  const scale = Math.min(availW / meta.width, availH / meta.height);
  const scaledW = Math.round(meta.width * scale);
  const scaledH = Math.round(meta.height * scale);
  const posX = Math.round((W - scaledW) / 2);
  const posY = Math.round(headerHeight + (availH - scaledH) / 2);

  const background = sharp({ create: { width: W, height: H, channels: 3, background: BG_COLOR } }).png();
  const resized = sharp(screenshotPath).resize(scaledW, scaledH, { fit: "fill" }).png();
  const overlay = buildOverlay(item.label, item.title, item.subtitle);

  await background
    .composite([
      { input: await resized.toBuffer(), left: posX, top: posY },
      { input: overlay, top: 0, left: 0 },
    ])
    .png()
    .toFile(outputPath);

  console.log(`✓ ${item.output} (${W}x${H}, scaled from ${meta.width}x${meta.height})`);
}

async function main() {
  console.log("Composing user screenshots...\n");
  for (const item of IMAGES) {
    await composeImage(item);
  }
  console.log(`\nDone. ${IMAGES.length} images in ${DIR}`);
}

main().catch(console.error);
