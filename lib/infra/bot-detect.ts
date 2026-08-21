/**
 * lib/infra/bot-detect.ts — AI crawler / search-bot detection.
 *
 * Runs in the Next.js middleware (edge) on every request. Checks the
 * User-Agent against known AI answer-engine, AI training, and search-crawler
 * signatures. Returns a structured result so the middleware can log the
 * visit to PostHog server-side without blocking the request.
 *
 * Why server-side: AI bots (GPTBot, ClaudeBot, CCBot, PerplexityBot, etc.)
 * do NOT execute JavaScript, so the PostHog client-side SDK never fires for
 * them. This module lets us see them via the server-side PostHog client
 * (lib/infra/posthog/server.ts) instead.
 */

export interface BotInfo {
  isBot: boolean;
  botName: string;
  botOperator: string;
  category: "ai_answer" | "ai_training" | "ai_fetcher" | "search_crawler" | "other";
  /** Whether this bot is allowed by robots.ts (answer engines = yes, training scrapers = no). */
  allowed: boolean;
}

// Known AI answer-engine crawlers (allowed in robots.ts)
const AI_ANSWER_BOTS: Record<string, { operator: string }> = {
  "GPTBot": { operator: "OpenAI" },
  "OAI-SearchBot": { operator: "OpenAI" },
  "ChatGPT-User": { operator: "OpenAI" },
  "ClaudeBot": { operator: "Anthropic" },
  "anthropic-ai": { operator: "Anthropic" },
  "Claude-Web": { operator: "Anthropic" },
  "CCBot": { operator: "Common Crawl" },
  "Google-Extended": { operator: "Google" },
  "PerplexityBot": { operator: "Perplexity" },
  "Perplexity-User": { operator: "Perplexity" },
  "Applebot-Extended": { operator: "Apple" },
  "cohere-ai": { operator: "Cohere" },
};

// AI training scrapers (blocked in robots.ts but may still hit the edge)
const AI_TRAINING_BOTS: Record<string, { operator: string }> = {
  "Bytespider": { operator: "ByteDance" },
  "meta-externalagent": { operator: "Meta" },
  "meta-externalfetcher": { operator: "Meta" },
  "AmazonBot": { operator: "Amazon" },
  "Diffbot": { operator: "Diffbot" },
  "ImagesiftBot": { operator: "Imagesift" },
  "Omgilibot": { operator: "Omgili" },
  "Omgili": { operator: "Omgili" },
  "YouBot": { operator: "You.com" },
};

// AI fetcher / preview bots (fetch pages to generate citations or previews)
const AI_FETCHER_BOTS: Record<string, { operator: string }> = {
  "Googlebot": { operator: "Google" },
  "Googlebot-Image": { operator: "Google" },
  "AdsBot-Google": { operator: "Google" },
  "Mediapartners-Google": { operator: "Google" },
  "Bingbot": { operator: "Microsoft" },
  "Applebot": { operator: "Apple" },
  "DuckDuckBot": { operator: "DuckDuckGo" },
  "Slackbot": { operator: "Slack" },
  "Twitterbot": { operator: "Twitter/X" },
  "LinkedInBot": { operator: "LinkedIn" },
  "Discordbot": { operator: "Discord" },
  "WhatsApp": { operator: "WhatsApp" },
  "TelegramBot": { operator: "Telegram" },
  "SkypeUriPreview": { operator: "Microsoft" },
};

// Generic search crawlers
const SEARCH_CRAWLERS: Record<string, { operator: string }> = {
  "Baiduspider": { operator: "Baidu" },
  "YandexBot": { operator: "Yandex" },
  "Sogou": { operator: "Sogou" },
  "Exabot": { operator: "Exalead" },
  "facebot": { operator: "Facebook" },
  "ia_archiver": { operator: "Internet Archive" },
};

const NO_BOT: BotInfo = {
  isBot: false,
  botName: "",
  botOperator: "",
  category: "other",
  allowed: true,
};

/**
 * Detect whether a request is from a known AI bot or crawler.
 * Case-insensitive substring match on the User-Agent header.
 */
export function detectBot(userAgent: string | null): BotInfo {
  if (!userAgent) return NO_BOT;
  const ua = userAgent.toLowerCase();

  // Check AI answer engines first (highest value)
  for (const [name, info] of Object.entries(AI_ANSWER_BOTS)) {
    if (ua.includes(name.toLowerCase())) {
      return { isBot: true, botName: name, botOperator: info.operator, category: "ai_answer", allowed: true };
    }
  }

  // AI training scrapers
  for (const [name, info] of Object.entries(AI_TRAINING_BOTS)) {
    if (ua.includes(name.toLowerCase())) {
      return { isBot: true, botName: name, botOperator: info.operator, category: "ai_training", allowed: false };
    }
  }

  // AI fetchers / preview bots
  for (const [name, info] of Object.entries(AI_FETCHER_BOTS)) {
    if (ua.includes(name.toLowerCase())) {
      return { isBot: true, botName: name, botOperator: info.operator, category: "ai_fetcher", allowed: true };
    }
  }

  // Search crawlers
  for (const [name, info] of Object.entries(SEARCH_CRAWLERS)) {
    if (ua.includes(name.toLowerCase())) {
      return { isBot: true, botName: name, botOperator: info.operator, category: "search_crawler", allowed: true };
    }
  }

  // Generic bot/crawler/spider fallback
  if (/\b(bot|crawler|spider|crawl|slurp|fetch)\b/i.test(ua)) {
    return { isBot: true, botName: "unknown", botOperator: "unknown", category: "other", allowed: true };
  }

  return NO_BOT;
}
