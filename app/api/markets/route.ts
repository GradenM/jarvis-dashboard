import { NextRequest } from "next/server";
import { getCached, setCached, bustCache, TTL } from "@/lib/cache";
import {
  generateMoverReasons,
  generateMarketNarrative,
  MoverReason,
} from "@/lib/claude";

const CACHE_KEY = "markets";

// Watchlist for mover detection
const STOCK_WATCHLIST = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "JPM", name: "JPMorgan" },
  { symbol: "BAC", name: "Bank of America" },
  { symbol: "XOM", name: "ExxonMobil" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "CRM", name: "Salesforce" },
  { symbol: "COIN", name: "Coinbase" },
];

const INDEX_LIST = [
  { symbol: "SPY", name: "S&P 500" },
  { symbol: "QQQ", name: "Nasdaq" },
  { symbol: "DIA", name: "Dow Jones" },
];

type Quote = {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
};

type StockMover = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  direction: "up" | "down";
  reason: string;
};

type IndexData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
};

type CryptoMover = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  direction: "up" | "down";
  reason: string;
};

type FearGreed = {
  score: number;
  label: string;
};

export type MarketData = {
  indices: IndexData[];
  stockMovers: StockMover[];
  cryptoMovers: CryptoMover[];
  fearGreed: FearGreed;
  narrative: string;
  marketStatus: "open" | "pre-market" | "after-hours" | "closed";
  updatedAt: number;
};

function getMarketStatus(): MarketData["marketStatus"] {
  const etStr = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const et = new Date(etStr);
  const day = et.getDay();
  if (day === 0 || day === 6) return "closed";
  const mins = et.getHours() * 60 + et.getMinutes();
  if (mins >= 570 && mins < 960) return "open";       // 9:30–16:00
  if (mins >= 240 && mins < 570) return "pre-market"; // 4:00–9:30
  if (mins >= 960 && mins < 1200) return "after-hours"; // 16:00–20:00
  return "closed";
}

async function fetchFinnhubQuote(
  symbol: string,
  apiKey: string
): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.c || data.c === 0) return null;
    return data as Quote;
  } catch {
    return null;
  }
}

async function fetchCoinGeckoMovers(): Promise<CryptoMover[]> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h",
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    const coins = await res.json();

    // Sort by absolute % change, get top 6
    const sorted = [...coins].sort(
      (a: { price_change_percentage_24h: number }, b: { price_change_percentage_24h: number }) =>
        Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h)
    );

    return sorted.slice(0, 6).map((c: {
      symbol: string;
      name: string;
      current_price: number;
      price_change_24h: number;
      price_change_percentage_24h: number;
    }) => ({
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price,
      change: c.price_change_24h,
      changePercent: c.price_change_percentage_24h,
      direction: c.price_change_percentage_24h >= 0 ? "up" : "down",
      reason: "",
    })) as CryptoMover[];
  } catch {
    return [];
  }
}

async function fetchFearGreed(): Promise<FearGreed> {
  try {
    // CNN Fear & Greed
    const res = await fetch(
      "https://production.dataviz.cnn.io/index/fearandgreed/graphdata/",
      { next: { revalidate: 0 } }
    );
    if (res.ok) {
      const data = await res.json();
      const fg = data?.fear_and_greed;
      if (fg?.score !== undefined) {
        return { score: Math.round(fg.score), label: fg.rating };
      }
    }
  } catch { /* fall through */ }

  // Fallback: crypto Fear & Greed (alternative.me)
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      const entry = data?.data?.[0];
      if (entry) {
        return { score: parseInt(entry.value), label: entry.value_classification };
      }
    }
  } catch { /* fall through */ }

  return { score: 50, label: "Neutral" };
}

export async function GET(request: NextRequest) {
  const bust = request.nextUrl.searchParams.get("bust") === "1";
  if (bust) bustCache(CACHE_KEY);

  const cached = getCached<MarketData>(CACHE_KEY);
  if (cached) return Response.json(cached);

  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (!finnhubKey) {
    return Response.json({ error: "Finnhub API key not configured" }, { status: 500 });
  }

  try {
    // Fetch all quotes in parallel
    const [indexQuotes, watchlistQuotes, cryptoMovers, fearGreed] =
      await Promise.all([
        Promise.all(INDEX_LIST.map((i) => fetchFinnhubQuote(i.symbol, finnhubKey))),
        Promise.all(STOCK_WATCHLIST.map((s) => fetchFinnhubQuote(s.symbol, finnhubKey))),
        fetchCoinGeckoMovers(),
        fetchFearGreed(),
      ]);

    // Build index data
    const indices: IndexData[] = INDEX_LIST.map((idx, i) => {
      const q = indexQuotes[i];
      return {
        symbol: idx.symbol,
        name: idx.name,
        price: q?.c ?? 0,
        change: q?.d ?? 0,
        changePercent: q?.dp ?? 0,
      };
    }).filter((i) => i.price > 0);

    // Build mover data — sort by absolute % change, take top 3 each direction
    const allStocks = STOCK_WATCHLIST.map((s, i) => {
      const q = watchlistQuotes[i];
      if (!q) return null;
      return {
        symbol: s.symbol,
        name: s.name,
        price: q.c,
        change: q.d,
        changePercent: q.dp,
        direction: (q.dp >= 0 ? "up" : "down") as "up" | "down",
        reason: "",
      };
    }).filter(Boolean) as StockMover[];

    const gainers = allStocks
      .filter((s) => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 3);
    const losers = allStocks
      .filter((s) => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 3);

    const stockMovers = [...gainers, ...losers];

    // Add Claude reasons if key is available
    let enrichedStockMovers = stockMovers;
    let enrichedCryptoMovers = cryptoMovers;
    let narrative = "";

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const [stockReasons, cryptoReasons, narrativeText] = await Promise.all([
          generateMoverReasons(stockMovers),
          generateMoverReasons(cryptoMovers.slice(0, 4)),
          generateMarketNarrative({
            indices,
            topGainers: gainers.slice(0, 3),
            topLosers: losers.slice(0, 3),
            fearGreedScore: fearGreed.score,
            fearGreedLabel: fearGreed.label,
            cryptoMovers: cryptoMovers.slice(0, 3),
          }),
        ]);

        const reasonMap = new Map<string, string>(
          (stockReasons as MoverReason[]).map((r) => [r.symbol, r.reason])
        );
        enrichedStockMovers = stockMovers.map((s) => ({
          ...s,
          reason: reasonMap.get(s.symbol) ?? "",
        }));

        const cryptoReasonMap = new Map<string, string>(
          (cryptoReasons as MoverReason[]).map((r) => [r.symbol, r.reason])
        );
        enrichedCryptoMovers = cryptoMovers.map((c) => ({
          ...c,
          reason: cryptoReasonMap.get(c.symbol) ?? "",
        }));

        narrative = narrativeText;
      } catch (e) {
        console.error("[markets/claude]", e);
      }
    }

    const marketStatus = getMarketStatus();
    const ttl =
      marketStatus === "open" ? TTL.MARKETS : 60 * 60 * 1000;

    const data: MarketData = {
      indices,
      stockMovers: enrichedStockMovers,
      cryptoMovers: enrichedCryptoMovers,
      fearGreed,
      narrative,
      marketStatus,
      updatedAt: Date.now(),
    };

    setCached(CACHE_KEY, data, ttl);
    return Response.json(data);
  } catch (err) {
    console.error("[markets]", err);
    return Response.json({ error: "Failed to fetch market data" }, { status: 502 });
  }
}
