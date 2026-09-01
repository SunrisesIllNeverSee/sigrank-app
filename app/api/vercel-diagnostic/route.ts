import { NextRequest, NextResponse } from "next/server";

type Check = {
  key: string;
  label: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  detail: string;
};

type FetchResult = {
  status: number | null;
  ok: boolean;
  text: string;
  headers: Headers;
  error?: string;
};

const FETCH_TIMEOUT_MS = 5000;
const MAX_TEXT_BYTES = 200_000;

function validateDeploymentUrl(raw: unknown): URL | null {
  if (typeof raw !== "string" || raw.length > 500) return null;

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const hostname = url.hostname.toLowerCase();

    if (
      url.protocol !== "https:" ||
      !hostname.endsWith(".vercel.app") ||
      hostname === "vercel.app" ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }

    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

async function readTextBounded(response: Response): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";

  try {
    while (bytesRead < MAX_TEXT_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;

      const remaining = MAX_TEXT_BYTES - bytesRead;
      const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
      bytesRead += chunk.byteLength;
      text += decoder.decode(chunk, { stream: bytesRead < MAX_TEXT_BYTES });

      if (value.byteLength > remaining || bytesRead >= MAX_TEXT_BYTES) {
        await reader.cancel("SigRank diagnostic response limit reached");
        break;
      }
    }

    if (bytesRead < MAX_TEXT_BYTES) text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
}

async function safeFetch(base: URL, path: string): Promise<FetchResult> {
  const target = new URL(path, base);

  try {
    const response = await fetch(target, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: {
        "user-agent": "SigRank-Vercel-Diagnostic/1.0 (+https://signalaf.com/vercel)",
        accept: "text/html,text/plain,application/json;q=0.9,*/*;q=0.5",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const canReadText =
      contentType.includes("text/") ||
      contentType.includes("json") ||
      contentType.includes("xml") ||
      contentType === "";

    const text = canReadText ? await readTextBounded(response) : "";

    return {
      status: response.status,
      ok: response.ok,
      text,
      headers: response.headers,
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      text: "",
      headers: new Headers(),
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

function hasTag(html: string, pattern: RegExp) {
  return pattern.test(html);
}

export async function POST(request: NextRequest) {
  let body: { url?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body with { url }." }, { status: 400 });
  }

  const deployment = validateDeploymentUrl(body.url);
  if (!deployment) {
    return NextResponse.json(
      {
        error:
          "Enter an HTTPS *.vercel.app deployment URL. Custom domains are intentionally not scanned by this public diagnostic.",
      },
      { status: 400 },
    );
  }

  const [root, robots, sitemap, llms, mcpManifest, missing] = await Promise.all([
    safeFetch(deployment, "/"),
    safeFetch(deployment, "/robots.txt"),
    safeFetch(deployment, "/sitemap.xml"),
    safeFetch(deployment, "/llms.txt"),
    safeFetch(deployment, "/.well-known/mcp.json"),
    safeFetch(deployment, `/__sigrank_probe_${crypto.randomUUID()}`),
  ]);

  const html = root.text;
  const title = hasTag(html, /<title(?:\s[^>]*)?>[^<]+<\/title>/i);
  const description = hasTag(
    html,
    /<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']+["'][^>]*>|<meta\s+[^>]*content=["'][^"']+["'][^>]*name=["']description["'][^>]*>/i,
  );
  const og = hasTag(html, /<meta\s+[^>]*property=["']og:(title|description)["'][^>]*>/i);
  const real404 = missing.status === 404 || missing.status === 410;
  const mcpJson = mcpManifest.ok && /mcp|model context protocol|streamable/i.test(mcpManifest.text);

  const checks: Check[] = [
    {
      key: "reachable",
      label: "Production surface reachable",
      passed: root.ok,
      points: root.ok ? 20 : 0,
      maxPoints: 20,
      detail: root.status ? `Homepage returned HTTP ${root.status}.` : root.error ?? "Homepage could not be fetched.",
    },
    {
      key: "title",
      label: "Indexable page title",
      passed: title,
      points: title ? 10 : 0,
      maxPoints: 10,
      detail: title ? "A rendered <title> is visible without client-side execution." : "No rendered <title> was found in the initial HTML.",
    },
    {
      key: "description",
      label: "Meta description",
      passed: description,
      points: description ? 10 : 0,
      maxPoints: 10,
      detail: description ? "A rendered meta description is present." : "No rendered meta description was found.",
    },
    {
      key: "social",
      label: "Open Graph metadata",
      passed: og,
      points: og ? 10 : 0,
      maxPoints: 10,
      detail: og ? "Open Graph metadata is exposed for link previews." : "No og:title or og:description tag was found.",
    },
    {
      key: "robots",
      label: "robots.txt",
      passed: robots.ok && robots.text.trim().length > 0,
      points: robots.ok && robots.text.trim().length > 0 ? 10 : 0,
      maxPoints: 10,
      detail: robots.ok ? `robots.txt returned HTTP ${robots.status}.` : `robots.txt returned ${robots.status ?? "no response"}.`,
    },
    {
      key: "sitemap",
      label: "sitemap.xml",
      passed: sitemap.ok && /<urlset|<sitemapindex/i.test(sitemap.text),
      points: sitemap.ok && /<urlset|<sitemapindex/i.test(sitemap.text) ? 10 : 0,
      maxPoints: 10,
      detail: sitemap.ok ? `sitemap.xml returned HTTP ${sitemap.status}.` : `sitemap.xml returned ${sitemap.status ?? "no response"}.`,
    },
    {
      key: "llms",
      label: "Agent discovery file",
      passed: llms.ok && llms.text.trim().length > 0,
      points: llms.ok && llms.text.trim().length > 0 ? 10 : 0,
      maxPoints: 10,
      detail: llms.ok ? "llms.txt is available to agents." : "No llms.txt was found.",
    },
    {
      key: "mcp",
      label: "MCP discovery",
      passed: mcpJson,
      points: mcpJson ? 15 : 0,
      maxPoints: 15,
      detail: mcpJson ? "A machine-readable MCP discovery document is present." : "No recognizable /.well-known/mcp.json was found.",
    },
    {
      key: "404",
      label: "Agent-friendly unknown-path status",
      passed: real404,
      points: real404 ? 5 : 0,
      maxPoints: 5,
      detail: real404 ? `Unknown paths correctly return HTTP ${missing.status}.` : `Unknown-path probe returned ${missing.status ?? "no response"}; agents may encounter a soft 404.`,
    },
  ];

  const score = checks.reduce((sum, check) => sum + check.points, 0);
  const vercelEdge = Boolean(root.headers.get("x-vercel-id") || root.headers.get("server")?.toLowerCase().includes("vercel"));

  return NextResponse.json({
    url: deployment.origin,
    score,
    maxScore: 100,
    checks,
    observed: {
      vercelEdge,
      contentType: root.headers.get("content-type"),
    },
    boundary:
      "This is a public distribution/readiness scan. It does not inspect private project settings, source code, models, runtime logs, or Vercel account data.",
  });
}
