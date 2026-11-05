import { test, expect } from "@playwright/test";
import { freshEmail, rest, signUp } from "./helpers";

test("sign-up by magic link mints an operator and lands on its profile", async ({
  page,
}) => {
  const email = freshEmail();
  const codename = await signUp(page, email);

  const operators = await rest<{ codename: string; claimed: boolean }[]>(
    `operators?codename=eq.${codename}&select=codename,claimed`,
  );
  expect(operators).toEqual([{ codename, claimed: true }]);

  await page.goto("/me");
  await expect(page).toHaveURL(new RegExp(`/user/${codename}`));
});
