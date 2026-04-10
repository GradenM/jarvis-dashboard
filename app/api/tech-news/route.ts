import { NextRequest } from "next/server";
import { getCached, setCached, bustCache, TTL } from "@/lib/cache";
import { fetchRssFeed } from "@/lib/rss";
import { summarizeTechItems } from "@/lib/claude";

const CACHE_KEY = "tech-news";

const TECH_FEEDS = [
  { url: "https://techcrunch.com/feed/", name: "TechCrunch" },
  { url: "https://www.theverge.com/rss/index.xml", name: "The Verge" },
  { url: "https://feeds.arstechnica.com/arstechnica/index", name: "Ars Technica" },
  {
    url: "https://hnrss.org/frontpage?points=100",
    name: "Hacker News",
  },
];

export type TechNewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  whyItMatters: string;
};

export type TechNewsData = {
  items: TechNewsItem[];
  updatedAt: number;
};

export async function GET(request: NextRequest) {
  const bust = request.nextUrl.searchParams.get("bust") === "1";
  if (bust) bustCache(CACHE_KEY);

  const cached = getCached<TechNewsData>(CACHE_KEY);
  if (cached) return Response.json(cached);

  try {
    // Fetch all feeds in parallel
    const feedResults = await Promise.all(
      TECH_FEEDS.map((f) => fetchRssFeed(f.url, f.name))
    );

    // Merge, deduplicate by title, take most recent
    const allItems = feedResults.flat();
    const seen = new Set<string>();
    const deduped = allItems.filter((item) => {
      const key = item.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date desc, take top 10 for Claude
    const sorted = deduped
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);

    // Claude enrichment
    let enriched: TechNewsItem[] = sorted.map((item) => ({
      ...item,
      whyItMatters: "",
    }));

    if (process.env.ANTHROPIC_API_KEY && sorted.length > 0) {
      try {
        const summaries = await summarizeTechItems(
          sorted.map((i) => ({ title: i.title, description: i.description })),
          "tech"
        );
        const map = new Map(summaries.map((s) => [s.index, s.whyItMatters]));
        enriched = sorted.map((item, idx) => ({
          ...item,
          whyItMatters: map.get(idx + 1) ?? "",
        }));
      } catch (e) {
        console.error("[tech-news/claude]", e);
      }
    }

    const data: TechNewsData = { items: enriched.slice(0, 8), updatedAt: Date.now() };
    setCached(CACHE_KEY, data, TTL.NEWS);
    return Response.json(data);
  } catch (err) {
    console.error("[tech-news]", err);
    return Response.json({ error: "Failed to fetch tech news" }, { status: 502 });
  }
}
