/**
 * lib/infra/ai-crawler.ts — turn a detected crawler into one PostHog event.
 *
 * AI and search crawlers don't run JavaScript, so the browser SDK never sees
 * them. The proxy calls crawlerHit() on each request and, when it returns an
 * event, sends it server-side after the response (event.waitUntil), so the
 * page is never delayed or broken by analytics.
 *
 * The event keeps the name the proxy has always used, `ai_bot_detected`, so
 * PostHog charts keep their history (data since 2026-08-17). It has a fixed
 * property set, so a dashboard can break visits down by bot, family, site
 * and page.
 */

import type { BotInfo } from "./bot-detect";

export const AI_CRAWLER_EVENT = "ai_bot_detected";

/**
 * What the crawler is for:
 * - ai_training: collects pages to train models (GPTBot, ClaudeBot, CCBot...)
 * - ai_search: builds an AI search index (OAI-SearchBot, PerplexityBot...)
 * - ai_user_fetch: fetches a page live because a person asked an AI about it
 *   (ChatGPT-User, Claude-User, Perplexity-User...)
 * - search: classic search engine crawler (Googlebot, Bingbot...); Bing's
 *   index also feeds Copilot.
 */
export type CrawlerFamily = "ai_training" | "ai_search" | "ai_user_fetch" | "search";

const FAMILY: Record<string, CrawlerFamily> = {
  // AI training
  "GPTBot": "ai_training",
  "ClaudeBot": "ai_training",
  "anthropic-ai": "ai_training",
  "CCBot": "ai_training",
  "cohere-ai": "ai_training",
  "Bytespider": "ai_training",
  "meta-externalagent": "ai_training",
  "AmazonBot": "ai_training",
  "Diffbot": "ai_training",
  "ImagesiftBot": "ai_training",
  "Omgilibot": "ai_training",
  "Omgili": "ai_training",
  // AI search indexes
  "OAI-SearchBot": "ai_search",
  "Claude-SearchBot": "ai_search",
  "PerplexityBot": "ai_search",
  "YouBot": "ai_search",
  "DuckAssistBot": "ai_search",
  // Live fetches on behalf of a person using an AI assistant
  "ChatGPT-User": "ai_user_fetch",
  "Claude-User": "ai_user_fetch",
  "Claude-Web": "ai_user_fetch",
  "Perplexity-User": "ai_user_fetch",
  "meta-externalfetcher": "ai_user_fetch",
  // Search engines
  "Googlebot": "search",
  "Bingbot": "search",
  "Applebot": "search",
  "DuckDuckBot": "search",
  "Baiduspider": "search",
  "YandexBot": "search",
  "Sogou": "search",
  "Exabot": "search",
};

// Only production traffic is recorded, so previews and local runs don't mix
// into the dashboard.
const PRODUCTION_HOSTS = new Set(["signalaf.com", "www.signalaf.com"]);

// Signed-in areas: never record their paths, even for a crawler user-agent.
const PRIVATE_PATH = /^\/(?:me|settings|auth)(?:\/|$)/;

export function crawlerFamily(botName: string): CrawlerFamily | null {
  return FAMILY[botName] ?? null;
}

export interface CrawlerHit {
  distinctId: string;
  event: typeof AI_CRAWLER_EVENT;
  properties: Record<string, string | boolean>;
}

/**
 * Build the PostHog event for a crawler request, or null when nothing should
 * be sent: people, social link previews, unidentified bots, methods other
 * than GET/HEAD, non-production hosts and signed-in paths. Bots are known by
 * User-Agent only, so a client can claim to be one. The query string is
 * never recorded.
 */
export function crawlerHit(bot: BotInfo, url: URL, method: string): CrawlerHit | null {
  if (!bot.isBot) return null;
  if (method !== "GET" && method !== "HEAD") return null;
  const family = crawlerFamily(bot.botName);
  if (!family) return null;
  const host = url.hostname.toLowerCase();
  if (!PRODUCTION_HOSTS.has(host)) return null;
  const path = url.pathname;
  if (PRIVATE_PATH.test(path)) return null;
  return {
    // One PostHog id per bot, with no person profile: bots aren't people.
    distinctId: `crawler:${bot.botName}`,
    event: AI_CRAWLER_EVENT,
    properties: {
      bot_name: bot.botName,
      bot_operator: bot.botOperator,
      bot_family: family,
      host,
      path,
      method,
      $host: host,
      $pathname: path,
      $current_url: `${url.protocol}//${host}${path}`,
      $process_person_profile: false,
    },
  };
}
