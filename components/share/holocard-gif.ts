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
    const histogram = new Map<number, number>();
    // owner 2026-10-21: palette index 255 is reserved for transparency (the
    // chamfered/cut-corner card shapes have alpha-0 corners). The mask comes
    // from the un-shined card once, so it is identical on every frame and a
    // pixel never flips between opaque and transparent (no smearing).
    const TRANSPARENT = 255;
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
      for (let i = 0; i < pixels.length; i += 16) {
        if (transparent[i >> 2]) continue;
        const key = (pixels[i] >> 4) * 256 + (pixels[i + 1] >> 4) * 16 + (pixels[i + 2] >> 4);
        histogram.set(key, (histogram.get(key) ?? 0) + 1);
      }
    }
    const colors = [...histogram].map(([key, count]) => ({
      rgb: [((key >> 8) & 15) * 17, ((key >> 4) & 15) * 17, (key & 15) * 17], count,
    }));
    const boxes = [colors];
    while (boxes.length < TRANSPARENT) {
      let best = -1, axis = 0, score = -1;
      boxes.forEach((box, index) => {
        if (box.length < 2) return;
        for (let c = 0; c < 3; c++) {
          const range = Math.max(...box.map(p => p.rgb[c])) - Math.min(...box.map(p => p.rgb[c]));
          const weight = range * Math.sqrt(box.reduce((n, p) => n + p.count, 0));
          if (weight > score) { best = index; axis = c; score = weight; }
        }
      });
      if (best < 0) break;
      const box = boxes.splice(best, 1)[0].sort((a, b) => a.rgb[axis] - b.rgb[axis]);
      const half = box.reduce((n, p) => n + p.count, 0) / 2;
      let sum = 0, split = 1;
      for (let i = 0; i < box.length - 1; i++) { sum += box[i].count; split = i + 1; if (sum >= half) break; }
      boxes.push(box.slice(0, split), box.slice(split));
    }
    const palette = boxes.map(box => {
      const weight = box.reduce((n, p) => n + p.count, 0);
      return [0, 1, 2].map(c => Math.round(box.reduce((n, p) => n + p.rgb[c] * p.count, 0) / weight));
    });
    const realColors = Math.max(1, palette.length);
    while (palette.length < 256) palette.push([0, 0, 0]);
    const lookup = new Uint8Array(4096);
    for (let key = 0; key < 4096; key++) {
      const rgb = [((key >> 8) & 15) * 17, ((key >> 4) & 15) * 17, (key & 15) * 17];
      let distance = Infinity;
      palette.forEach((p, index) => {
        if (index >= realColors) return;
        const d = p.reduce((n, v, c) => n + (v - rgb[c]) ** 2, 0);
        if (d < distance) { distance = d; lookup[key] = index; }
      });
    }
    const bytes: number[] = [];
    const word = (n: number) => bytes.push(n & 255, (n >> 8) & 255);
    const text = (s: string) => { for (const c of s) bytes.push(c.charCodeAt(0)); };
    text("GIF89a"); word(width); word(height); bytes.push(247, 0, 0);
    palette.forEach(p => bytes.push(...p));
    bytes.push(33, 255, 11); text("NETSCAPE2.0"); bytes.push(3, 1, 0, 0, 0);
    for (const [frameIndex, pixels] of frames.entries()) {
      const frameX = frameIndex > 0 && options.panelStart != null ? Math.floor(width * options.panelStart) : 0;
      // GCE: disposal 1 (keep frame) | transparent-color flag; index 255.
      bytes.push(33, 249, 4, 5); word(17); bytes.push(TRANSPARENT, 0, 44);
      word(frameX); word(0); word(width - frameX); word(height); bytes.push(0, 8);
      const packed: number[] = [];
      let bits = 0, bitCount = 0, run = 0;
      const code = (n: number) => {
        bits |= n << bitCount; bitCount += 9;
        while (bitCount >= 8) { packed.push(bits & 255); bits >>>= 8; bitCount -= 8; }
      };
      code(256);
      for (let y = 0; y < height; y++) for (let x = frameX; x < width; x++) {
        const i = (y * width + x) * 4;
        if (run === 200) { code(256); run = 0; }
        code(transparent![y * width + x] ? TRANSPARENT : lookup[(pixels[i] >> 4) * 256 + (pixels[i + 1] >> 4) * 16 + (pixels[i + 2] >> 4)]); run++;
      }
      code(257); if (bitCount) packed.push(bits & 255);
      for (let i = 0; i < packed.length; i += 255) { const block = packed.slice(i, i + 255); bytes.push(block.length, ...block); }
      bytes.push(0);
    }
    bytes.push(59);
    return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
  }
}
