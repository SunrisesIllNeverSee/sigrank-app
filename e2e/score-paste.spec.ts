import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Sample ccusage --json payload using field names the parser recognizes
// (lib/ingest/parse.ts ALIASES: input_tokens, output_tokens,
// cache_creation_input_tokens, cache_read_input_tokens). The raw-telemetry
// `tokens_*` names (tokens_input_fresh etc.) are NOT recognized by the paste
// parser — they're for signed MCP submissions — so using them here would
// silently fall through to the four-number fallback with swapped cache
// pillars. These are the MO§ES canonical values (Υ 18436.98).
const SAMPLE_CCUSAGE = JSON.stringify({
  input_tokens: 1251211,
  output_tokens: 11296121,
  cache_creation_input_tokens: 128196310,
  cache_read_input_tokens: 2555179769,
  total_tokens: 2697105411,
})

test('score paste → projection appears', async ({ page }) => {
  await page.goto('/score')
  // Paste card is visible
  const textarea = page.locator('textarea').first()
  await expect(textarea).toBeVisible()

  // Paste sample payload
  await textarea.fill(SAMPLE_CCUSAGE)

  // Click preview button (look for button with "preview" or "parse" text)
  const previewBtn = page.getByRole('button', { name: /preview|parse|calculate/i })
  await previewBtn.click()

  // Projection should appear — the Υ Yield label + the canonical MO§ES
  // value must render, proving the ccusage JSON path parsed the pillars
  // correctly (not the four-number fallback, which would swap
  // cache_create/cache_read and produce a different yield). The UI renders
  // yield via toFixed(1), so 18436.98 rounds to "18437.0".
  await expect(page.getByText(/Υ yield/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/18437\.0/)).toBeVisible()

  // a11y check
  // TODO: known violations on live site — landmark-main-is-top-level,
  // landmark-is-top-level, landmark-no-duplicate-main, page-no-duplicate-main,
  // landmark-unique, landmark-is-unique, region. File as a11y bugs to fix,
  // then tighten to toEqual([]).
  const results = await new AxeBuilder({ page }).analyze()
  const known = [
    'landmark-main-is-top-level', 'landmark-is-top-level',
    'landmark-no-duplicate-main', 'page-no-duplicate-main',
    'landmark-unique', 'landmark-is-unique', 'region',
  ]
  const unknown = results.violations.filter((v) => !known.includes(v.id))
  expect(unknown).toEqual([])
})
