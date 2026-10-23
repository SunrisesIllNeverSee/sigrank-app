/**
 * components/share/gif-encode.ts — pure animated-GIF encoder for the shareable
 * holocards (owner 2026-10-22: keep full resolution under the 15 MB X limit).
 *
 * - One global 255-colour palette (median cut over 5-bit RGB), index 255 is
 *   transparent: the card's cut corners and, on frames after the first, every
 *   pixel whose source colour did not change (disposal 1 keeps it).
 * - Changed pixels are Floyd–Steinberg dithered, so holo gradients don't band.
 * - Each later frame is cropped to the box of pixels that changed.
 * - Real variable-width LZW (min code size 8, 12-bit max, clear when full).
 * The file-size budget is spent on frames (smoothness) by the caller.
 */

export interface GifFrames {
  width: number;
  height: number;
  /** RGBA pixels per frame, width × height × 4. */
  frames: Uint8ClampedArray[];
  /** 1 = always transparent (alpha-0 card corners). */
  transparent: Uint8Array;
  /** Frame delay in hundredths of a second. */
  delay: number;
}

const TRANSPARENT = 255;
const key5 = (r: number, g: number, b: number) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);

export class ByteWriter {
  buf = new Uint8Array(1 << 20);
  len = 0;
  private grow(n: number) {
    if (this.len + n <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.len + n) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
  }
  byte(n: number) { this.grow(1); this.buf[this.len++] = n & 255; }
  word(n: number) { this.byte(n); this.byte(n >> 8); }
  text(s: string) { for (const c of s) this.byte(c.charCodeAt(0)); }
  bytes(a: Uint8Array) { this.grow(a.length); this.buf.set(a, this.len); this.len += a.length; }
  out() { return this.buf.slice(0, this.len); }
}

/** Median-cut palette of up to 255 colours from a 5-bit RGB histogram. */
export function buildPalette(histogram: Uint32Array): number[][] {
  let colors: { rgb: number[]; count: number }[] = [];
  for (let k = 0; k < histogram.length; k++) {
    if (histogram[k]) colors.push({ rgb: [((k >> 10) & 31) * 8 + 4, ((k >> 5) & 31) * 8 + 4, (k & 31) * 8 + 4], count: histogram[k] });
  }
  if (!colors.length) colors = [{ rgb: [0, 0, 0], count: 1 }];
  const boxes = [colors];
  const stats = (box: typeof colors) => {
    const lo = [255, 255, 255], hi = [0, 0, 0];
    let total = 0;
    for (const p of box) {
      total += p.count;
      for (let c = 0; c < 3; c++) { if (p.rgb[c] < lo[c]) lo[c] = p.rgb[c]; if (p.rgb[c] > hi[c]) hi[c] = p.rgb[c]; }
    }
    return { range: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]], total };
  };
  const info = boxes.map(stats);
  while (boxes.length < TRANSPARENT) {
    let best = -1, axis = 0, score = -1;
    boxes.forEach((box, index) => {
      if (box.length < 2) return;
      const { range, total } = info[index];
      for (let c = 0; c < 3; c++) {
        const weight = range[c] * Math.sqrt(total);
        if (weight > score) { best = index; axis = c; score = weight; }
      }
    });
    if (best < 0) break;
    const box = boxes.splice(best, 1)[0].sort((a, b) => a.rgb[axis] - b.rgb[axis]);
    info.splice(best, 1);
    const half = box.reduce((n, p) => n + p.count, 0) / 2;
    let sum = 0, split = 1;
    for (let i = 0; i < box.length - 1; i++) { sum += box[i].count; split = i + 1; if (sum >= half) break; }
    const a = box.slice(0, split), b = box.slice(split);
    boxes.push(a, b);
    info.push(stats(a), stats(b));
  }
  return boxes.map((box) => {
    const weight = box.reduce((n, p) => n + p.count, 0);
    return [0, 1, 2].map((c) => Math.round(box.reduce((n, p) => n + p.rgb[c] * p.count, 0) / weight));
  });
}

/** 5-bit RGB key → nearest palette index. */
export function buildLookup(palette: number[][]): Uint8Array {
  const lookup = new Uint8Array(32768);
  for (let k = 0; k < 32768; k++) {
    const r = ((k >> 10) & 31) * 8 + 4, g = ((k >> 5) & 31) * 8 + 4, b = (k & 31) * 8 + 4;
    let distance = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const p = palette[i];
      const d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2;
      if (d < distance) { distance = d; lookup[k] = i; }
    }
  }
  return lookup;
}

/** GIF LZW (min code size 8) into 255-byte sub-blocks. */
export function lzwEncode(indices: Uint8Array, w: ByteWriter) {
  const MIN = 8, CLEAR = 256, EOI = 257;
  const codes = new Int32Array(4096 * 256);
  const stamp = new Int32Array(4096 * 256);
  let gen = 1;
  let codeSize = MIN + 1, next = EOI + 1;
  const block = new Uint8Array(255);
  let blockLen = 0, bits = 0, bitCount = 0;
  const flushByte = (b: number) => {
    block[blockLen++] = b;
    if (blockLen === 255) { w.byte(255); w.bytes(block); blockLen = 0; }
  };
  const emit = (code: number) => {
    bits |= code << bitCount; bitCount += codeSize;
    while (bitCount >= 8) { flushByte(bits & 255); bits >>>= 8; bitCount -= 8; }
  };
  w.byte(MIN);
  emit(CLEAR);
  if (indices.length) {
    let cur = indices[0];
    for (let i = 1; i < indices.length; i++) {
      const k = indices[i];
      const key = (cur << 8) | k;
      if (stamp[key] === gen) { cur = codes[key]; continue; }
      emit(cur);
      if (next === 4096) {
        emit(CLEAR);
        gen++;
        next = EOI + 1;
        codeSize = MIN + 1;
      } else {
        if (next >= 1 << codeSize) codeSize++;
        codes[key] = next++;
        stamp[key] = gen;
      }
      cur = k;
    }
    emit(cur);
  }
  emit(EOI);
  if (bitCount > 0) flushByte(bits & 255);
  if (blockLen) { w.byte(blockLen); w.bytes(block.subarray(0, blockLen)); }
  w.byte(0);
}

/** RGB → 5-bit histogram, sampling every other pixel; transparent pixels skipped. */
export function addToHistogram(histogram: Uint32Array, px: Uint8ClampedArray, transparent: Uint8Array) {
  for (let p = 0; p < transparent.length; p += 2) {
    if (transparent[p]) continue;
    const i = p * 4;
    histogram[key5(px[i], px[i + 1], px[i + 2])]++;
  }
}

/**
 * Streaming GIF89a writer: holds only the previous source frame, so long
 * animations do not keep every frame in memory. Pixels whose source RGB did
 * not change since the previous frame become transparent (disposal 1 keeps
 * what is shown); changed pixels are quantized with serpentine
 * Floyd–Steinberg dithering (error diffused only among changed pixels).
 */
export class GifWriter {
  private w = new ByteWriter();
  private palette: number[][];
  private lookup: Uint8Array;
  private prev: Uint8ClampedArray | null = null;
  private idx: Uint8Array;
  private changed: Uint8Array;
  private err: Float32Array;
  constructor(
    private width: number,
    private height: number,
    palette: number[][],
    private transparent: Uint8Array,
    private delay: number,
    private dither = 0.75,
  ) {
    this.palette = palette.slice(0, TRANSPARENT);
    this.lookup = buildLookup(this.palette);
    const full = [...this.palette];
    while (full.length < 256) full.push([0, 0, 0]);
    const w = this.w;
    w.text("GIF89a"); w.word(width); w.word(height); w.byte(0xf7); w.byte(0); w.byte(0);
    for (const p of full) { w.byte(p[0]); w.byte(p[1]); w.byte(p[2]); }
    w.byte(33); w.byte(255); w.byte(11); w.text("NETSCAPE2.0"); w.byte(3); w.byte(1); w.word(0); w.byte(0);
    this.idx = new Uint8Array(width * height);
    this.changed = new Uint8Array(width * height);
    this.err = new Float32Array(width * height * 3);
  }

  get size() { return this.w.len; }

  addFrame(px: Uint8ClampedArray) {
    const { width, height, transparent, changed, idx, err, lookup, palette } = this;
    const n = width * height;
    const first = !this.prev;
    let x0 = width, y0 = height, x1 = -1, y1 = -1;
    for (let p = 0; p < n; p++) {
      const i = p * 4;
      const ch = !transparent[p] && (first || px[i] !== this.prev![i] || px[i + 1] !== this.prev![i + 1] || px[i + 2] !== this.prev![i + 2]);
      changed[p] = ch ? 1 : 0;
      if (!ch) continue;
      const x = p % width, y = (p / width) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (first) { x0 = 0; y0 = 0; x1 = width - 1; y1 = height - 1; }
    if (x1 < 0) { x0 = 0; y0 = 0; x1 = 0; y1 = 0; }
    err.fill(0);
    const k = this.dither;
    for (let y = y0; y <= y1; y++) {
      const ltr = (y & 1) === 0;
      for (let s = 0; s <= x1 - x0; s++) {
        const x = ltr ? x0 + s : x1 - s;
        const p = y * width + x;
        if (!changed[p]) { idx[p] = TRANSPARENT; continue; }
        const i = p * 4, e = p * 3;
        const r = Math.max(0, Math.min(255, px[i] + err[e]));
        const g = Math.max(0, Math.min(255, px[i + 1] + err[e + 1]));
        const b = Math.max(0, Math.min(255, px[i + 2] + err[e + 2]));
        const v = lookup[key5(r, g, b)];
        idx[p] = v;
        if (!k) continue;
        const q = palette[v];
        const er = (r - q[0]) * k, eg = (g - q[1]) * k, eb = (b - q[2]) * k;
        const dx = ltr ? 1 : -1;
        const push = (xx: number, yy: number, f: number) => {
          if (xx < x0 || xx > x1 || yy > y1) return;
          const pp = yy * width + xx;
          if (!changed[pp]) return;
          err[pp * 3] += er * f; err[pp * 3 + 1] += eg * f; err[pp * 3 + 2] += eb * f;
        };
        push(x + dx, y, 7 / 16); push(x - dx, y + 1, 3 / 16); push(x, y + 1, 5 / 16); push(x + dx, y + 1, 1 / 16);
      }
    }
    const fw = x1 - x0 + 1, fh = y1 - y0 + 1;
    const sub = new Uint8Array(fw * fh);
    for (let y = 0; y < fh; y++) sub.set(idx.subarray((y0 + y) * width + x0, (y0 + y) * width + x0 + fw), y * fw);
    const w = this.w;
    // GCE: disposal 1 (keep frame) | transparent-color flag; index 255.
    w.byte(33); w.byte(249); w.byte(4); w.byte(5); w.word(this.delay); w.byte(TRANSPARENT); w.byte(0);
    w.byte(44); w.word(x0); w.word(y0); w.word(fw); w.word(fh); w.byte(0);
    lzwEncode(sub, w);
    this.prev = this.prev ?? new Uint8ClampedArray(px.length);
    this.prev.set(px);
  }

  finish(): Uint8Array {
    this.w.byte(59);
    return this.w.out();
  }
}

/** Encode frames into a looping GIF89a (convenience over GifWriter). */
export function encodeGif({ width, height, frames, transparent, delay }: GifFrames, dither = 0.75): Uint8Array {
  const histogram = new Uint32Array(32768);
  for (const px of frames) addToHistogram(histogram, px, transparent);
  const gif = new GifWriter(width, height, buildPalette(histogram), transparent, delay, dither);
  for (const px of frames) gif.addFrame(px);
  return gif.finish();
}
