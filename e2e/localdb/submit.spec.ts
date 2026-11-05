import { test, expect } from "@playwright/test";
import { freshEmail, rest, signUp } from "./helpers";

const CCUSAGE = JSON.stringify({
  input_tokens: 1251211,
  output_tokens: 11296121,
  cache_creation_input_tokens: 128196310,
  cache_read_input_tokens: 2555179769,
  total_tokens: 2697105411,
});

test("signed-in paste submission is scored and recorded against the operator", async ({
  page,
}) => {
  const codename = await signUp(page, freshEmail());

  await page.goto("/score/paste");
  await page.locator("textarea").first().fill(CCUSAGE);
  await page.getByRole("button", { name: "Parse & preview" }).click();
  await page.getByRole("button", { name: "Run my numbers" }).click();

  await expect(page.getByText("◈ Your cascade — projected")).toBeVisible();
  await expect(page.getByText(/18437\.0/)).toBeVisible();

  const footer = await page.getByText(/ran as .* id paste_[0-9a-f]{8}/).innerText();
  const submissionId = footer.match(/paste_[0-9a-f]{8}/)![0];

  const [operator] = await rest<{ operator_id: string }[]>(
    `operators?codename=eq.${codename}&select=operator_id`,
  );
  const rows = await rest<
    { operator_id: string; signature: string; payload_json: Record<string, unknown> }[]
  >(
    `snapshot_submissions?snapshot_hash=eq.${submissionId}&select=operator_id,signature,payload_json`,
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].operator_id).toBe(operator.operator_id);
  expect(rows[0].signature).toBe("web_paste");
  expect(rows[0].payload_json).toMatchObject({
    codename,
    source: "web_paste",
    status: "pending_review",
    pillars: { cacheRead: 2555179769 },
  });
});

test("anonymous submission is refused and nothing is recorded", async ({
  request,
}) => {
  const res = await request.post("/api/v1/ingest-paste", {
    data: { raw_paste: CCUSAGE },
  });
  expect(res.status()).toBe(401);
});
