"use client";

/**
 * components/live/demo.tsx — typecheck/standalone fixture for
 * LiveBoardWorkspace. Ports data.js OPERATORS into the LiveBoardInitialState
 * contract (lib/board/live-types.ts) so the workspace can render without a
 * server projection. Not a route — import it from a sandbox/story surface.
 *
 * `demoInitial.fieldMax` is computed here exactly the way WS-2's projection
 * must compute it — over the FULL scope, not the rendered subset.
 */
import type {
  LiveBoardInitialState,
  LiveOperator,
} from "@/lib/board/live-types";
import { LiveBoardWorkspace } from "./LiveBoardWorkspace";
import { numvOf } from "./utils";

type FixtureOp = Pick<
  LiveOperator,
  | "codename"
  | "handle"
  | "klass"
  | "archetype"
  | "total"
  | "snr"
  | "vel"
  | "lev"
  | "dev"
  | "opratio"
  | "eff"
  | "cost"
  | "platform"
  | "last"
  | "mv7"
  | "trend"
  | "raw"
> & { yield: string };

const FIXTURE: FixtureOp[] = [
  { codename: "MO§ES™", handle: "@SunrisesIllNeverSee", klass: "ARCH+", archetype: "amplifier", total: "7.0B", yield: "581.87", snr: 0.595, vel: 1.47, lev: "395.7×", dev: 2.6, opratio: "396:1", eff: "106.16", cost: "$0.58", platform: "us", last: "09/09/26", mv7: 0, trend: [61, 64, 70, 66, 74, 79, 84, 88, 92, 97], raw: { i: "1.2M", o: "3.4B", cr: "4.1B", cw: "62M" } },
  { codename: "Zach Lagden", handle: "@zachlagden", klass: "ARCH", archetype: "builder", total: "7.4B", yield: "269.71", snr: 0.511, vel: 1.05, lev: "200.5×", dev: 2.3, opratio: "200:1", eff: "24.25", cost: "$0.52", platform: "multi", last: "07/19/26", mv7: 1, trend: [40, 44, 41, 49, 55, 52, 58, 63, 66, 70], raw: { i: "9.8M", o: "2.9B", cr: "3.6B", cw: "41M" } },
  { codename: "George", handle: "other", klass: "ARCH", archetype: "recursive", total: "17.1M", yield: "79.40", snr: 0.471, vel: 0.89, lev: "89.1×", dev: 1.95, opratio: "89:1", eff: "24.29", cost: "$0.71", platform: "oth", last: "08/07/26", mv7: 5, trend: [22, 25, 28, 26, 31, 35, 33, 38, 41, 44], raw: { i: "1.9M", o: "6.2M", cr: "7.7M", cw: "1.1M" } },
  { codename: "Geosimar G.", handle: "multi", klass: "POWER", archetype: "contextual", total: "52.1M", yield: "69.28", snr: 0.507, vel: 1.03, lev: "67.3×", dev: 1.83, opratio: "67:1", eff: "24.63", cost: "$1.53", platform: "+1", last: "07/16/26", mv7: 3, trend: [30, 28, 33, 36, 34, 39, 42, 40, 45, 48], raw: { i: "6.1M", o: "18M", cr: "22M", cw: "3.3M" } },
  { codename: "Lakshmi Narayanan G", handle: "@narayanan", klass: "POWER", archetype: "deep-reader", total: "32.6B", yield: "66.46", snr: 0.334, vel: 0.5, lev: "132.4×", dev: 2.12, opratio: "132:1", eff: "34.05", cost: "$0.46", platform: "us", last: "07/31/26", mv7: 2, trend: [35, 38, 36, 41, 39, 44, 47, 45, 50, 52], raw: { i: "4.2M", o: "12B", cr: "16B", cw: "2.4B" } },
  { codename: "kr-yeon", handle: "other", klass: "BASE", archetype: "convergent", total: "2.4B", yield: "41.21", snr: 0.335, vel: 0.5, lev: "82.4×", dev: 1.92, opratio: "82:1", eff: "21.57", cost: "$0.55", platform: "+1", last: "07/21/26", mv7: 7, trend: [18, 21, 19, 24, 27, 25, 30, 33, 31, 36], raw: { i: "2.1M", o: "0.9B", cr: "1.3B", cw: "210M" } },
  { codename: "崔鹏飞 Cui Pengfei", handle: "other", klass: "BASE", archetype: "kinetic", total: "122.7M", yield: "29.15", snr: 0.115, vel: 0.13, lev: "221.5×", dev: 1.33, opratio: "221:1", eff: "5.47", cost: "$0.54", platform: "oth", last: "07/15/26", mv7: 1, trend: [12, 14, 13, 16, 18, 17, 21, 23, 22, 26], raw: { i: "8.8M", o: "41M", cr: "55M", cw: "9.2M" } },
  { codename: "Dai Nguyen Ba", handle: "@it·ba", klass: "SEEKER", archetype: "priming", total: "4.0B", yield: "0.69", snr: 0.052, vel: 0.06, lev: "12.4×", dev: 1.09, opratio: "12:1", eff: "3.29", cost: "$0.71", platform: "+1", last: "07/30/26", mv7: 12, trend: [9, 11, 10, 13, 12, 15, 14, 17, 16, 19], raw: { i: "540K", o: "1.6B", cr: "1.9B", cw: "88M" } },
  { codename: "Gioxa", handle: "other", klass: "REFINER", archetype: "archivist", total: "22.1M", yield: "0.04", snr: 0.033, vel: 0.03, lev: "1.1×", dev: 0.04, opratio: "1.1:1", eff: "0.35", cost: "$2.01", platform: "oth", last: "07/23/26", mv7: 9, trend: [6, 7, 8, 7, 9, 10, 9, 11, 12, 11], raw: { i: "3.3M", o: "7.4M", cr: "8.9M", cw: "1.2M" } },
  { codename: "signal-f2b5be16b0f", handle: "other", klass: "BEARER", archetype: "input-bound", total: "3.9B", yield: "0.01", snr: 0.007, vel: 0.01, lev: "1.5×", dev: 0.17, opratio: "1.5:1", eff: "0.40", cost: "$1.55", platform: "+1", last: "07/16/26", mv7: 4, trend: [5, 6, 5, 7, 6, 8, 9, 8, 10, 9], raw: { i: "1.1M", o: "1.4B", cr: "1.8B", cw: "260M" } },
];

const operators: LiveOperator[] = FIXTURE.map((o, i) => ({
  ...o,
  slug: o.codename,
  claimed: o.handle.startsWith("@"),
  nc: false,
  wf: null,
  num: {
    yield: numvOf(o.yield),
    lev: numvOf(o.lev),
    total: numvOf(o.total),
    cost: parseFloat(o.cost.replace("$", "")),
  },
  pct: Math.max(0.1, +(((FIXTURE.length - i) / FIXTURE.length) * 100).toFixed(1)),
  scalev: 0,
  mv24: 0,
  ptpd: null,
  otpd: null,
  recs: [],
  sub: "",
  verif: o.handle.startsWith("@") ? "verified" : "unverified",
  supporter: "free",
  delta: "",
  age: 0,
  msgs: 0,
}));

const max = (fn: (o: LiveOperator) => number): number =>
  Math.max(...operators.map(fn)) || 1;

export const demoInitial: LiveBoardInitialState = {
  meta: {
    window: "all_time",
    generatedAt: "",
    ruleset: "1.0",
    source: "fixture (data.js port)",
  },
  operators,
  population: { count: 1660, tag: "LIVE FIELD · ALL-TIME" },
  fieldStats: [
    { field: "total_operators", value: "1,660" },
    { field: "median_yield", value: "34.46" },
    { field: "top_yield", value: "581.87" },
    { field: "window", value: "All-time · fixture" },
  ],
  movers: [],
  hall: [
    { value: "MO§ES™ — Υ 581.87", codename: "MO§ES™" },
    { value: "Zach Lagden — Υ 269.71", codename: "Zach Lagden" },
    { value: "George — Υ 79.40", codename: "George" },
  ],
  featured: {
    name: "MO§ES™",
    handle: "@SunrisesIllNeverSee",
    rank: 1,
    klass: "ARCH+",
    archetype: "amplifier",
    yield: "581.87",
    delta: "+12.4% vs prior window",
    blurb:
      "Highest cascade efficiency in the field. Extreme reuse depth with sustained output.",
  },
  fieldMax: {
    yield: max((o) => numvOf(o.yield)),
    lev: max((o) => numvOf(o.lev)),
    vel: max((o) => o.vel),
    snr: max((o) => o.snr),
    dev: max((o) => o.dev),
    scalev: max((o) => o.scalev),
  },
  totalOperators: operators.length,
};

/** Standalone demo consumer — renders the frozen fixture workspace. */
export function LiveBoardDemo() {
  return <LiveBoardWorkspace initial={demoInitial} />;
}
