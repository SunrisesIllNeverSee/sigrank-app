import { describe, it, expect } from "vitest";
import { encodeGif } from "@/components/share/gif-encode";

/** Minimal GIF89a decoder: composites frames (disposal 1, transparent index) to palette RGB. */
function decode(gif: Uint8Array) {
  let p = 0;
  const u8 = () => gif[p++];
  const u16 = () => { const v = gif[p] | (gif[p + 1] << 8); p += 2; return v; };
  const sig = String.fromCharCode(...gif.slice(0, 6)); p = 6;
  const width = u16(), height = u16(), flags = u8(); p += 2;
  const palette: number[][] = [];
  for (let i = 0; i < 2 << (flags & 7); i++) palette.push([u8(), u8(), u8()]);
  const canvas = new Int16Array(width * height).fill(-1);
  const frames: Int16Array[] = [];
  let transparent = -1;
  for (;;) {
    const b = u8();
    if (b === 0x3b) break;
    if (b === 0x21) {
      const label = u8();
      if (label === 0xf9) { p++; const f = u8(); p += 2; const t = u8(); transparent = f & 1 ? t : -1; p++; continue; }
      for (let n = u8(); n; n = u8()) p += n;
      continue;
    }
    const x0 = u16(), y0 = u16(), fw = u16(), fh = u16(); p++;
    const min = u8();
    const data: number[] = [];
    for (let n = u8(); n; n = u8()) { for (let i = 0; i < n; i++) data.push(u8()); }
    const clear = 1 << min, eoi = clear + 1;
    let size = min + 1, dict: number[][] = [], prev: number[] | null = null, bit = 0;
    const out: number[] = [];
    const reset = () => { dict = []; for (let i = 0; i < clear; i++) dict[i] = [i]; dict[clear] = []; dict[eoi] = []; size = min + 1; prev = null; };
    reset();
    for (;;) {
      let code = 0;
      for (let i = 0; i < size; i++, bit++) code |= ((data[bit >> 3] >> (bit & 7)) & 1) << i;
      if (code === clear) { reset(); continue; }
      if (code === eoi) break;
      const entry: number[] = code < dict.length ? dict[code] : [...prev!, prev![0]];
      out.push(...entry);
      if (prev) dict.push([...prev, entry[0]]);
      prev = entry;
      if (dict.length === 1 << size && size < 12) size++;
    }
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const v = out[y * fw + x];
      if (v !== transparent) canvas[(y0 + y) * width + x0 + x] = v;
    }
    frames.push(canvas.slice());
  }
  return { sig, width, height, palette, frames };
}

function frame(w: number, h: number, f: (x: number, y: number) => [number, number, number]) {
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b] = f(x, y);
    px.set([r, g, b, 255], (y * w + x) * 4);
  }
  return px;
}

describe("encodeGif", () => {
  const w = 64, h = 40;
  const base = (x: number, y: number): [number, number, number] => [x * 4, y * 6, (x + y) * 2];
  const frames = [0, 1, 2].map((f) => frame(w, h, (x, y) => (x >= f * 10 && x < f * 10 + 8 ? [255, 255, 255] : base(x, y))));
  const transparent = new Uint8Array(w * h);
  transparent[0] = 1;

  it("round-trips through an LZW decoder with deltas composited", () => {
    const gif = encodeGif({ width: w, height: h, frames, transparent, delay: 17 });
    const d = decode(gif);
    expect(d.sig).toBe("GIF89a");
    expect([d.width, d.height]).toEqual([w, h]);
    expect(d.frames).toHaveLength(3);
    d.frames.forEach((shown, f) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (p === 0) { expect(shown[p]).toBe(-1); continue; }
        const [r, g, b] = d.palette[shown[p]];
        const want = x >= f * 10 && x < f * 10 + 8 ? [255, 255, 255] : base(x, y);
        expect(Math.abs(r - want[0]) + Math.abs(g - want[1]) + Math.abs(b - want[2])).toBeLessThan(40);
      }
    });
  });

  it("compresses repetitive frames well below one byte per pixel", () => {
    const flat = [0, 1, 2, 3].map(() => frame(320, 200, () => [20, 40, 60]));
    const gif = encodeGif({ width: 320, height: 200, frames: flat, transparent: new Uint8Array(320 * 200), delay: 10 });
    expect(gif.length).toBeLessThan(320 * 200 * 0.05);
  });
});
