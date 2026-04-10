import { NextRequest } from "next/server";
import { getCached, setCached, bustCache, TTL } from "@/lib/cache";
import { fetchRssFeed } from "@/lib/rss";
import { summarizeTechItems } from "@/lib/claude";

const CACHE_KEY = "cyber-news";

const CYBER_FEEDS = [
  { url: "https://krebsonsecurity.com/feed/", name: "Krebs on Security" },
  { url: "https://www.bleepingcomputer.com/feed/", name: "BleepingComputer" },
  { url: "https://therecord.media/feed/", name: "The Record" },
  {
    url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
    name: "CISA KEV",
    isJson: true,
  },
];

export type CyberNewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  whyItMatters: string;
};

export type CyberNewsData = {
  items: CyberNewsItem[];
  updatedAt: number;
};

async function fetchCisaKev(): Promise<{ title: string; url: string; description: string; publishedAt: string; source: string }[]> {
  try {
    const res = await fetch(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const vulns: { cveID: string; vendorProject: string; product: string; vulnerabilityName: string; dateAdded: string; shortDescription: string; requiredAction: string }[] =
      data?.vulnerabilities ?? [];
    // Get the 3 most recently added
    const recent = [...vulns]
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 3);
    return recent.map((v) => ({
      title: `${v.cveID}: ${v.vulnerabilityName} (${v.vendorProject} ${v.product})`,
      url: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog`,
      description: `${v.shortDescription} Required action: ${v.requiredAction}`,
      publishedAt: new Date(v.dateAdded).toISOString(),
      source: "CISA KEV",
    }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const bust = request.nextUrl.searchParams.get("bust") === "1";
  if (bust) bustCache(CACHE_KEY);

  const cached = getCached<CyberNewsData>(CACHE_KEY);
  if (cached) return Response.json(cached);

  try {
    const [rssResults, cisaItems] = await Promise.all([
      Promise.all(
        CYBER_FEEDS.filter((f) => !("isJson" in f)).map((f) =>
          fetchRssFeed(f.url, f.name)
        )
      ),
      fetchCisaKev(),
    ]);

    const allItems = [...rssResults.flat(), ...cisaItems];

    const seen = new Set<string>();
    const deduped = allItems.filter((item) => {
      const key = item.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const sorted = deduped
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);

    let enriched: CyberNewsItem[] = sorted.map((item) => ({
      ...item,
      whyItMatters: "",
    }));

    if (process.env.ANTHROPIC_API_KEY && sorted.length > 0) {
      try {
        const summaries = await summarizeTechItems(
          sorted.map((i) => ({ title: i.title, description: i.description })),
          "cyber"
        );
        const map = new Map(summaries.map((s) => [s.index, s.whyItMatters]));
        enriched = sorted.map((item, idx) => ({
          ...item,
          whyItMatters: map.get(idx + 1) ?? "",
        }));
      } catch (e) {
        console.error("[cyber-news/claude]", e);
      }
    }

    const data: CyberNewsData = { items: enriched.slice(0, 8), updatedAt: Date.now() };
    setCached(CACHE_KEY, data, TTL.NEWS);
    return Response.json(data);
  } catch (err) {
    console.error("[cyber-news]", err);
    return Response.json({ error: "Failed to fetch cyber news" }, { status: 502 });
  }
}
