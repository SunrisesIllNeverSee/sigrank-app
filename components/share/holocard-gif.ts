import { GifWriter, addToHistogram, buildPalette } from "./gif-encode";

/**
 * Holo-shine GIF of a card PNG. `frames` sets smoothness (the sweep always
 * takes ~4 s); the caller spends the 15 MB budget on frames (owner 2026-10-22).
 */
export async function holocardGif(png: Blob, options: { width?: number; panelStart?: number; frames?: number } = {}): Promise<Blob> {
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Card image could not be read"));
    reader.readAsDataURL(png);
  });
  {
    const image = new Image();
    image.src = url;
    await image.decode();
    const width = options.width ?? 324, height = Math.round(width * image.height / image.width);
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    const total = Math.max(2, Math.round(options.frames ?? 100));
    // owner 2026-10-21: palette index 255 is reserved for transparency (the
    // chamfered/cut-corner card shapes have alpha-0 corners). The mask comes
    // from the un-shined card once, so it is identical on every frame and a
    // pixel never flips between opaque and transparent (no smearing).
    let transparent: Uint8Array | null = null;
    const render = (frame: number): Uint8ClampedArray => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      if (!transparent) {
        const base = ctx.getImageData(0, 0, width, height).data;
        transparent = new Uint8Array(width * height);
        for (let p = 0; p < transparent.length; p++) transparent[p] = base[p * 4 + 3] < 128 ? 1 : 0;
      }
      ctx.save();
      ctx.beginPath();
      if (options.panelStart != null) { ctx.rect(width * options.panelStart, 0, width * (1 - options.panelStart), height); ctx.clip(); ctx.beginPath(); }
      ctx.moveTo(width * .08, 0); ctx.lineTo(width * .92, 0);
      ctx.lineTo(width, height * .05); ctx.lineTo(width, height);
      ctx.lineTo(0, height); ctx.lineTo(0, height * .05); ctx.closePath(); ctx.clip();
      const x = -width + frame / (total - 1) * width * 3;
      const shine = ctx.createLinearGradient(x - width * .3, 0, x + width * .3, height);
      shine.addColorStop(0, "rgba(168,85,247,0)");
      shine.addColorStop(.35, "rgba(0,229,255,.15)");
      shine.addColorStop(.5, "rgba(255,255,255,.3)");
      shine.addColorStop(.65, "rgba(255,0,212,.15)");
      shine.addColorStop(1, "rgba(255,215,0,0)");
      ctx.fillStyle = shine; ctx.fillRect(0, 0, width, height); ctx.restore();
      return ctx.getImageData(0, 0, width, height).data;
    };
    // Palette from a spread of frames, then stream: only one frame in memory.
    const histogram = new Uint32Array(32768);
    for (let f = 0; f < total; f += Math.max(1, Math.floor(total / 12))) addToHistogram(histogram, render(f), transparent!);
    const gif = new GifWriter(width, height, buildPalette(histogram), transparent!, Math.max(2, Math.round(408 / total)));
    for (let f = 0; f < total; f++) gif.addFrame(render(f));
    return new Blob([gif.finish() as BlobPart], { type: "image/gif" });
  }
}
