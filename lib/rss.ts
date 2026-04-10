import { XMLParser } from "fast-xml-parser";

export type RssItem = {
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  source: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export async function fetchRssFeed(
  url: string,
  sourceName: string
): Promise<RssItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "JARVIS-Dashboard/1.0" },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = parser.parse(xml);

    // Handle both RSS 2.0 and Atom formats
    const channel = parsed?.rss?.channel;
    const feed = parsed?.feed;

    let items: RssItem[] = [];

    if (channel) {
      // RSS 2.0
      const rawItems = Array.isArray(channel.item)
        ? channel.item
        : channel.item
        ? [channel.item]
        : [];

      items = rawItems.map(
        (item: {
          title?: string;
          link?: string;
          description?: string;
          pubDate?: string;
          "content:encoded"?: string;
        }) => ({
          title: stripTags(String(item.title ?? "")),
          url: String(item.link ?? ""),
          description: stripTags(
            String(item.description ?? item["content:encoded"] ?? "")
          ).slice(0, 300),
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          source: sourceName,
        })
      );
    } else if (feed) {
      // Atom
      const rawEntries = Array.isArray(feed.entry)
        ? feed.entry
        : feed.entry
        ? [feed.entry]
        : [];

      items = rawEntries.map(
        (entry: {
          title?: string | { "#text": string };
          link?: { "@_href"?: string } | { "@_href"?: string }[];
          summary?: string;
          content?: string;
          published?: string;
          updated?: string;
        }) => {
          const link = Array.isArray(entry.link)
            ? entry.link[0]?.["@_href"] ?? ""
            : entry.link?.["@_href"] ?? "";
          const title =
            typeof entry.title === "object"
              ? entry.title["#text"] ?? ""
              : entry.title ?? "";
          return {
            title: stripTags(String(title)),
            url: String(link),
            description: stripTags(
              String(entry.summary ?? entry.content ?? "")
            ).slice(0, 300),
            publishedAt: entry.published
              ? new Date(entry.published).toISOString()
              : entry.updated
              ? new Date(entry.updated).toISOString()
              : new Date().toISOString(),
            source: sourceName,
          };
        }
      );
    }

    return items.filter((i) => i.title && i.url);
  } catch (e) {
    console.error(`[rss] Failed to fetch ${url}:`, e);
    return [];
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
