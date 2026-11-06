import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detectBot } from "../../lib/infra/bot-detect.ts";
import { AI_CRAWLER_EVENT, crawlerFamily, crawlerHit } from "../../lib/infra/ai-crawler.ts";

const UA = {
  GPTBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  "OAI-SearchBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  "ChatGPT-User": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
  ClaudeBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  "Claude-User": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)",
  "Claude-SearchBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Searchbot@anthropic.com)",
  PerplexityBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  "Perplexity-User": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)",
  DuckAssistBot: "DuckAssistBot/1.2; (+http://duckduckgo.com/duckassistbot.html)",
  Googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  Bingbot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36",
  Applebot: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)",
  "meta-externalagent": "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
  Bytespider: "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)",
  CCBot: "CCBot/2.0 (https://commoncrawl.org/faq/)",
  AmazonBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot) Chrome/119.0.6045.214 Safari/537.36",
  YouBot: "Mozilla/5.0 (compatible; YouBot (+http://www.you.com))",
  "cohere-ai": "cohere-ai",
};

const FAMILIES = {
  GPTBot: "ai_training", ClaudeBot: "ai_training", CCBot: "ai_training", Bytespider: "ai_training",
  "meta-externalagent": "ai_training", AmazonBot: "ai_training", "cohere-ai": "ai_training",
  "OAI-SearchBot": "ai_search", "Claude-SearchBot": "ai_search", PerplexityBot: "ai_search",
  DuckAssistBot: "ai_search", YouBot: "ai_search",
  "ChatGPT-User": "ai_user_fetch", "Claude-User": "ai_user_fetch", "Perplexity-User": "ai_user_fetch",
  Googlebot: "search", Bingbot: "search", Applebot: "search",
};

const url = new URL("https://SignalAF.com/alternatives/ai-benchmarking-tools?utm_source=x&token=secret");

test("each real crawler user-agent is identified by name and family", () => {
  for (const [name, ua] of Object.entries(UA)) {
    const bot = detectBot(ua);
    assert.equal(bot.botName, name, ua);
    assert.equal(crawlerFamily(bot.botName), FAMILIES[name], name);
  }
});

test("a crawler hit becomes one ai_bot_detected event with a per-bot id and no person profile", () => {
  const hit = crawlerHit(detectBot(UA["ChatGPT-User"]), url, "GET");
  assert.equal(hit.event, AI_CRAWLER_EVENT);
  assert.equal(hit.event, "ai_bot_detected");
  assert.equal(hit.distinctId, "crawler:ChatGPT-User");
  assert.deepEqual(hit.properties, {
    bot_name: "ChatGPT-User",
    bot_operator: "OpenAI",
    bot_family: "ai_user_fetch",
    host: "signalaf.com",
    path: "/alternatives/ai-benchmarking-tools",
    method: "GET",
    $host: "signalaf.com",
    $pathname: "/alternatives/ai-benchmarking-tools",
    $current_url: "https://signalaf.com/alternatives/ai-benchmarking-tools",
    $process_person_profile: false,
  });
});

test("the query string is never recorded", () => {
  const hit = crawlerHit(detectBot(UA.GPTBot), url, "GET");
  assert.doesNotMatch(JSON.stringify(hit), /utm_source|token|secret|\?/);
});

test("people, link previews and unidentified bots send nothing", () => {
  const people = [
    null,
    "",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  ];
  for (const ua of people) assert.equal(crawlerHit(detectBot(ua), url, "GET"), null, String(ua));
  for (const ua of ["Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)", "Twitterbot/1.0", "SomeRandomCrawler/1.0 crawler"]) {
    assert.ok(detectBot(ua).isBot, ua);
    assert.equal(crawlerHit(detectBot(ua), url, "GET"), null, ua);
  }
});

test("proxy sends the crawler event after the response and lets crawlers reach robots, llms and sitemap files", () => {
  const proxy = readFileSync(new URL("../../proxy.ts", import.meta.url), "utf8");
  assert.match(proxy, /export async function proxy\(request: NextRequest, event\?: NextFetchEvent\)/);
  assert.match(proxy, /event\.waitUntil\(sent\)/);
  // The event name lives in lib/infra/ai-crawler.ts only.
  assert.doesNotMatch(proxy, /"ai_bot_detected"/);
  const matcher = proxy.slice(proxy.indexOf("export const config"));
  for (const file of ["/robots.txt", "/llms.txt", "/llms-full.txt", "/sitemap.xml"]) {
    assert.ok(matcher.includes(`"${file}"`), file);
  }
  // Every other .txt and .xml file is still served without the proxy.
  assert.match(matcher, /\|ico\|txt\|xml\|css\|/);
  assert.match(matcher, /_next\/static\|_next\/image/);
});

test("previews, local runs, signed-in paths and non-GET requests send nothing", () => {
  const bot = detectBot(UA.GPTBot);
  for (const host of ["sigrank-app.vercel.app", "sigrank-app-git-x.vercel.app", "localhost", "analyst.signalaf.com"]) {
    assert.equal(crawlerHit(bot, new URL(`https://${host}/`), "GET"), null, host);
  }
  for (const path of ["/me", "/me/profile", "/settings", "/settings/keys", "/auth/callback"]) {
    assert.equal(crawlerHit(bot, new URL(`https://signalaf.com${path}`), "GET"), null, path);
  }
  for (const method of ["POST", "PUT", "DELETE", "OPTIONS"]) {
    assert.equal(crawlerHit(bot, new URL("https://signalaf.com/"), method), null, method);
  }
  assert.ok(crawlerHit(bot, new URL("https://www.signalaf.com/methodology"), "HEAD"));
  assert.ok(crawlerHit(bot, new URL("https://signalaf.com/membership"), "GET"), "only /me itself and below are private");
});
