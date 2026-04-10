import { NextRequest } from "next/server";
import type { MarketData } from "@/app/api/markets/route";
import type { NewsData } from "@/app/api/news/route";
import type { TechNewsData } from "@/app/api/tech-news/route";
import type { CyberNewsData } from "@/app/api/cyber-news/route";

// Builds a formatted context string from all live dashboard data.
// Called by the chat panel on mount so Claude knows exactly what's on screen.

function base(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;
    return json as T;
  } catch {
    return null;
  }
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

export async function GET(req: NextRequest) {
  const b = base(req);

  // Fetch all modules in parallel — failures are silently skipped
  const [weather, markets, news, tech, cyber] = await Promise.all([
    safeFetch<{
      temp: number;
      high: number;
      low: number;
      description: string;
      rainChance: number;
      dressCode: string;
      humidity: number;
      windSpeed: number;
    }>(`${b}/api/weather`),
    safeFetch<MarketData>(`${b}/api/markets`),
    safeFetch<NewsData>(`${b}/api/news`),
    safeFetch<TechNewsData>(`${b}/api/tech-news`),
    safeFetch<CyberNewsData>(`${b}/api/cyber-news`),
  ]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines: string[] = [
    `## JARVIS Dashboard Context — ${today}`,
    "",
  ];

  // Weather
  if (weather) {
    lines.push("### Weather (Tuscaloosa, AL)");
    lines.push(
      `Current: ${weather.temp}°F, ${weather.description}`
    );
    lines.push(
      `High: ${weather.high}°F / Low: ${weather.low}°F | Rain: ${weather.rainChance}% | Wind: ${weather.windSpeed} mph | Humidity: ${weather.humidity}%`
    );
    lines.push(`Dress recommendation: ${weather.dressCode}`);
    lines.push("");
  }

  // Markets
  if (markets) {
    lines.push(`### Markets (Status: ${markets.marketStatus})`);

    if (markets.indices.length > 0) {
      lines.push(
        "Indices: " +
          markets.indices
            .map(
              (i) =>
                `${i.name} $${fmt(i.price)} (${i.changePercent >= 0 ? "+" : ""}${fmt(i.changePercent)}%)`
            )
            .join(" | ")
      );
    }

    lines.push(
      `Fear & Greed Index: ${markets.fearGreed.score}/100 — ${markets.fearGreed.label}`
    );

    const gainers = markets.stockMovers.filter((m) => m.direction === "up");
    const losers = markets.stockMovers.filter((m) => m.direction === "down");

    if (gainers.length > 0) {
      lines.push("Top Stock Gainers:");
      gainers.forEach((m) =>
        lines.push(
          `  - ${m.symbol} (${m.name}): +${fmt(m.changePercent)}%${m.reason ? ` — ${m.reason}` : ""}`
        )
      );
    }
    if (losers.length > 0) {
      lines.push("Top Stock Losers:");
      losers.forEach((m) =>
        lines.push(
          `  - ${m.symbol} (${m.name}): ${fmt(m.changePercent)}%${m.reason ? ` — ${m.reason}` : ""}`
        )
      );
    }

    if (markets.cryptoMovers.length > 0) {
      lines.push("Crypto Movers:");
      markets.cryptoMovers.slice(0, 4).forEach((c) =>
        lines.push(
          `  - ${c.name} (${c.symbol}): ${c.changePercent >= 0 ? "+" : ""}${fmt(c.changePercent)}%${c.reason ? ` — ${c.reason}` : ""}`
        )
      );
    }

    if (markets.narrative) {
      lines.push(`Market Narrative: ${markets.narrative}`);
    }
    lines.push("");
  }

  // World News
  if (news && news.items.length > 0) {
    lines.push("### World & US News");
    news.items.forEach((item, i) => {
      lines.push(
        `${i + 1}. [${item.priority.toUpperCase()}] ${item.title} (${item.source})`
      );
      if (item.summary) lines.push(`   → ${item.summary}`);
    });
    lines.push("");
  }

  // Tech / AI News
  if (tech && tech.items.length > 0) {
    lines.push("### Tech & AI News");
    tech.items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.title} (${item.source})`);
      if (item.whyItMatters) lines.push(`   → ${item.whyItMatters}`);
    });
    lines.push("");
  }

  // Cybersecurity
  if (cyber && cyber.items.length > 0) {
    lines.push("### Cybersecurity News");
    cyber.items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.title} (${item.source})`);
      if (item.whyItMatters) lines.push(`   → ${item.whyItMatters}`);
    });
    lines.push("");
  }

  const context = lines.join("\n");
  return Response.json({ context });
}
