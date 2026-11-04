import { test, expect } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";

test.use({ trace: "off", screenshot: "off", video: "off" });

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const supabaseUrl = process.env.E2E_SUPABASE_URL;
const publishableKey = process.env.E2E_SUPABASE_PUBLISHABLE_KEY;

type Jar = { name: string; value: string; options: Record<string, unknown> };

test("signed-in /me lands on the operator profile, not /login", async ({
  page,
  context,
  baseURL,
}) => {
  test.skip(
    !email || !password || !supabaseUrl || !publishableKey,
    "E2E_TEST_EMAIL, E2E_TEST_PASSWORD, E2E_SUPABASE_URL and E2E_SUPABASE_PUBLISHABLE_KEY are not all set",
  );

  const jar = new Map<string, Jar>();
  const sb = createServerClient(supabaseUrl!, publishableKey!, {
    cookies: {
      getAll: () =>
        [...jar.values()].map(({ name, value }) => ({ name, value })),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          jar.set(name, { name, value, options: { ...options } });
        }
      },
    },
  });

  try {
    const { error } = await sb.auth.signInWithPassword({
      email: email!,
      password: password!,
    });
    expect(error, "Supabase sign-in failed (status " + error?.status + ")").toBeNull();
    expect(jar.size, "sign-in set no session cookies").toBeGreaterThan(0);

    const host = new URL(baseURL!).hostname;
    await context.addCookies(
      [...jar.values()]
        .filter(({ value }) => value !== "")
        .map(({ name, value, options }) => {
          const maxAge = options.maxAge as number | undefined;
          return {
            name,
            value,
            domain: host,
            path: (options.path as string | undefined) ?? "/",
            httpOnly: false,
            secure: new URL(baseURL!).protocol === "https:",
            sameSite: "Lax" as const,
            expires: maxAge
              ? Math.floor(Date.now() / 1000) + maxAge
              : -1,
          };
        }),
    );

    const res = await page.goto("/me", { waitUntil: "commit" });
    const chain: string[] = [];
    for (let r = res?.request() ?? null; r; r = r.redirectedFrom()) {
      chain.unshift(new URL(r.url()).pathname);
    }

    expect(chain[0]).toBe("/me");
    expect(chain, "signed-in /me bounced to the login page").not.toContain("/login");
    expect(chain[1]).toMatch(/^\/user\/[^/]+$/);
    expect(res?.status() ?? 0).toBeLessThan(500);
  } finally {
    await sb.auth.signOut().catch(() => undefined);
  }
});
