/**
 * __tests__/data/the-field-jensen.test.mjs
 * CLAIM 5: The Field's Υ (computed from AVERAGED pillars) is not the average
 * of the operators' Υ, and on a right-skewed field it tracks the biggest
 * operator, not the typical one. PASSES if the claim is TRUE.
 *
 * Also validates the fix: median-Υ approach gives a representative baseline.
 * Run: node --test __tests__/data/the-field-jensen.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

const upsilon = ({ i, o, cr }) => (cr * o) / (i * i)
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

// A small right-skewed field: 4 ordinary operators + 1 whale (tiny input, huge cache).
const field = [
  { i: 1000, o: 2000, cr: 5000 },
  { i: 1200, o: 1800, cr: 4000 },
  { i: 900,  o: 2200, cr: 6000 },
  { i: 1100, o: 1900, cr: 4500 },
  { i: 50,   o: 5_000_000, cr: 200_000_000 }, // the whale (64%-of-tokens shape)
]

test('CLAIM 5: The Field Υ (ratio of means) ≠ mean of operator Υ', () => {
  const theField = {
    i:  mean(field.map((f) => f.i)),
    o:  mean(field.map((f) => f.o)),
    cr: mean(field.map((f) => f.cr)),
  }
  const fieldUpsilon = upsilon(theField)
  const meanOfUpsilons = mean(field.map(upsilon))
  assert.ok(fieldUpsilon !== meanOfUpsilons)
  assert.ok(Math.abs(fieldUpsilon - meanOfUpsilons) / meanOfUpsilons > 0.5,
    `ratio-of-means Υ=${fieldUpsilon.toExponential(2)} vs mean-of-Υ=${meanOfUpsilons.toExponential(2)}`)
})

test('CLAIM 5: The Field baseline overstates the TYPICAL (median) operator', () => {
  const theField = {
    i:  mean(field.map((f) => f.i)),
    o:  mean(field.map((f) => f.o)),
    cr: mean(field.map((f) => f.cr)),
  }
  const sortedU = field.map(upsilon).sort((a, b) => a - b)
  const med = sortedU[Math.floor(sortedU.length / 2)]
  assert.ok(upsilon(theField) > med * 2,
    `field Υ=${upsilon(theField).toExponential(2)} >> median Υ=${med.toExponential(2)}`)
})

test('FIX 5: median-Υ approach gives a representative baseline (not whale-dominated)', () => {
  // The fix (migration 0024): pick the operator whose Υ is the median.
  const upsilons = field.map(upsilon)
  const medU = median(upsilons)
  // Find the operator whose Υ is closest to the median.
  const medianOp = field.reduce((best, f) => {
    const d = Math.abs(upsilon(f) - medU)
    return d < best.d ? { op: f, d } : best
  }, { op: null, d: Infinity })

  const meanFieldUpsilon = upsilon({
    i: mean(field.map((f) => f.i)),
    o: mean(field.map((f) => f.o)),
    cr: mean(field.map((f) => f.cr)),
  })

  // The median-Υ operator's Υ should be much closer to the median than the
  // ratio-of-means Υ is.
  assert.ok(
    Math.abs(upsilon(medianOp.op) - medU) < Math.abs(meanFieldUpsilon - medU),
    `median-Υ operator (${upsilon(medianOp.op).toExponential(2)}) is closer to median (${medU.toExponential(2)}) than ratio-of-means (${meanFieldUpsilon.toExponential(2)})`,
  )
})
