import { encodeGif } from "./gif-encode";

export async function holocardGif(png: Blob, options: { width?: number; panelStart?: number } = {}): Promise<Blob> {
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
    const frames: Uint8ClampedArray[] = [];
    // owner 2026-10-21: palette index 255 is reserved for transparency (the
    // chamfered/cut-corner card shapes have alpha-0 corners). The mask comes
    // from the un-shined card once, so it is identical on every frame and a
    // pixel never flips between opaque and transparent (no smearing).
    let transparent: Uint8Array | null = null;
    for (let frame = 0; frame < 24; frame++) {
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
      const x = -width + frame / 23 * width * 3;
      const shine = ctx.createLinearGradient(x - width * .3, 0, x + width * .3, height);
      shine.addColorStop(0, "rgba(168,85,247,0)");
      shine.addColorStop(.35, "rgba(0,229,255,.15)");
      shine.addColorStop(.5, "rgba(255,255,255,.3)");
      shine.addColorStop(.65, "rgba(255,0,212,.15)");
      shine.addColorStop(1, "rgba(255,215,0,0)");
      ctx.fillStyle = shine; ctx.fillRect(0, 0, width, height); ctx.restore();
      const pixels = ctx.getImageData(0, 0, width, height).data;
      frames.push(pixels);
    }
    const gif = encodeGif({ width, height, frames, transparent: transparent!, delay: 17 });
    return new Blob([gif as BlobPart], { type: "image/gif" });
  }
}
