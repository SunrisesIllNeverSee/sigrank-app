import { describe, expect, it } from "vitest";
import { calendarDay, proratedDailyTokens, type TokenWindow } from "@/lib/profile/prorated-activity";

const record = (from:string,to:string, tokens:number, submittedAt="2026-10-08T12:00:00Z"):TokenWindow=>({
  periodStart:from,periodEnd:to,submittedAt,
  inputTokens:tokens,outputTokens:0,cacheCreateTokens:0,cacheReadTokens:0,
});
describe("daily proration anchored in actual scored windows",()=>{
 it("selects smallest dated window and spreads raw totals evenly",()=>{
  const windows=[record("2026-09-08","2026-10-08",300),
    record("2026-10-01","2026-10-08",140)];
  expect(proratedDailyTokens(windows,calendarDay("2026-10-06"))).toBe(20);
  expect(proratedDailyTokens(windows,calendarDay("2026-09-22"))).toBe(10);
  expect(proratedDailyTokens(windows,calendarDay("2026-10-08"))).toBeNull();
 });
 it("uses newest scored submission among equally precise windows",()=>{
  const same=[record("2026-10-01","2026-10-08",70,"2026-10-07T12:00:00Z"),
    record("2026-10-01","2026-10-08",140,"2026-10-08T12:00:00Z")];
  expect(proratedDailyTokens(same,calendarDay("2026-10-02"))).toBe(20);
 });
 it("rejects invalid, negative and missing telemetry rather than implying daily data",()=>{
  const nullTokens={...record("2026-10-01","2026-10-08",50),cacheReadTokens:null};
  expect(proratedDailyTokens([nullTokens],calendarDay("2026-10-03"))).toBeNull();
  expect(proratedDailyTokens([record("2026-10-08","2026-10-01",70)],calendarDay("2026-10-03"))).toBeNull();
  expect(proratedDailyTokens([],calendarDay("2026-10-03"))).toBeNull();
 });
});
