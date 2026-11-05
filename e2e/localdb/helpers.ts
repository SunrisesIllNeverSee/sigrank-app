import { expect, type Page } from "@playwright/test";

const mailpitUrl = process.env.E2E_LOCAL_MAILPIT_URL ?? "http://127.0.0.1:54324";
const supabaseUrl = process.env.E2E_LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceKey = process.env.E2E_LOCAL_SERVICE_KEY ?? "";

export function freshEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

export async function rest<T>(path: string): Promise<T> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  expect(res.ok, `local REST ${path} answered ${res.status}`).toBe(true);
  return (await res.json()) as T;
}

async function magicLinkFor(email: string): Promise<string> {
  let link = "";
  await expect
    .poll(
      async () => {
        const search = await fetch(
          `${mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
        );
        const { messages } = (await search.json()) as {
          messages?: { ID: string }[];
        };
        if (!messages?.length) return false;
        const msg = await fetch(`${mailpitUrl}/api/v1/message/${messages[0].ID}`);
        const { Text } = (await msg.json()) as { Text: string };
        const found = Text.match(/https?:\/\/\S+\/auth\/v1\/verify\S*/);
        if (!found) return false;
        link = found[0].replace(/[)>\]]+$/, "");
        return true;
      },
      { timeout: 30_000, message: `no magic-link mail for ${email} in local mail catcher` },
    )
    .toBe(true);
  return link;
}

export async function signUp(page: Page, email: string): Promise<string> {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByRole("button", { name: "Email me a magic link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();
  await page.goto(await magicLinkFor(email));
  await page.waitForURL(/\/user\/signal-[0-9a-f]{10}/, { timeout: 30_000 });
  return decodeURIComponent(new URL(page.url()).pathname.split("/")[2]);
}
