import Anthropic from "@anthropic-ai/sdk";

// Lazy-initialize so missing key only errors on use, not import
function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type NewsCategory =
  | "politics"
  | "economy"
  | "international"
  | "science"
  | "conflict"
  | "technology"
  | "health"
  | "other";

export type NewsPriority = "breaking" | "high" | "normal";

export type SummarizedNewsItem = {
  index: number;
  summary: string;
  category: NewsCategory;
  priority: NewsPriority;
};

export type MoverReason = {
  symbol: string;
  reason: string;
};

// ─── News summarization ───────────────────────────────────────────────────────

export async function summarizeNewsItems(
  items: { title: string; description?: string }[]
): Promise<SummarizedNewsItem[]> {
  if (items.length === 0) return [];

  const client = getClient();

  const numbered = items
    .map(
      (item, i) =>
        `${i + 1}. Title: "${item.title}"${item.description ? `\n   Context: "${item.description.slice(0, 200)}"` : ""}`
    )
    .join("\n");

  const prompt = `You are a morning briefing assistant. Analyze these news headlines and for each provide:
1. A one-sentence "why it matters" summary (not a restatement — explain the significance)
2. A category: politics, economy, international, science, conflict, technology, health, or other
3. A priority: "breaking" (major developing story), "high" (significant news), "normal"

Headlines:
${numbered}

Respond with ONLY a valid JSON array, no other text:
[{"index":1,"summary":"...","category":"...","priority":"..."}]`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "[]";

  // Strip any markdown code fences if present
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean) as SummarizedNewsItem[];
}

// ─── Tech / cyber news "why it matters" ──────────────────────────────────────

export async function summarizeTechItems(
  items: { title: string; description?: string }[],
  domain: "tech" | "cyber"
): Promise<{ index: number; whyItMatters: string }[]> {
  if (items.length === 0) return [];

  const client = getClient();

  const context =
    domain === "tech"
      ? "tech/AI industry news"
      : "cybersecurity/threat intelligence";

  const numbered = items
    .map(
      (item, i) =>
        `${i + 1}. "${item.title}"${item.description ? ` — ${item.description.slice(0, 150)}` : ""}`
    )
    .join("\n");

  const prompt = `You are briefing a developer on ${context}. For each headline, write one punchy sentence explaining why it matters — focus on practical impact, not just what happened.

Headlines:
${numbered}

Respond with ONLY valid JSON, no other text:
[{"index":1,"whyItMatters":"..."}]`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean) as { index: number; whyItMatters: string }[];
}

// ─── Market mover reasons ─────────────────────────────────────────────────────

export async function generateMoverReasons(
  movers: { symbol: string; name: string; changePercent: number }[]
): Promise<MoverReason[]> {
  if (movers.length === 0) return [];

  const client = getClient();

  const list = movers
    .map(
      (m) =>
        `${m.symbol} (${m.name}): ${m.changePercent > 0 ? "+" : ""}${m.changePercent.toFixed(1)}%`
    )
    .join("\n");

  const prompt = `You are a market analyst giving a morning briefing. For each of these price movers, provide one short sentence (under 12 words) explaining the likely reason based on your knowledge of these companies and recent market trends. If you're uncertain, make a reasonable inference.

Movers:
${list}

Respond with ONLY valid JSON, no other text:
[{"symbol":"...","reason":"..."}]`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean) as MoverReason[];
}

// ─── Market narrative paragraph ───────────────────────────────────────────────

export async function generateMarketNarrative(data: {
  indices: { name: string; changePercent: number }[];
  topGainers: { symbol: string; changePercent: number }[];
  topLosers: { symbol: string; changePercent: number }[];
  fearGreedScore: number;
  fearGreedLabel: string;
  cryptoMovers: { name: string; changePercent: number }[];
}): Promise<string> {
  const client = getClient();

  const prompt = `Write a 2-3 sentence market briefing for this morning. Be direct, specific, and useful. Mention the overall direction, what's notable, and the mood.

Data:
- Indices: ${data.indices.map((i) => `${i.name} ${i.changePercent > 0 ? "+" : ""}${i.changePercent.toFixed(1)}%`).join(", ")}
- Top gainers: ${data.topGainers.map((m) => `${m.symbol} +${m.changePercent.toFixed(1)}%`).join(", ")}
- Top losers: ${data.topLosers.map((m) => `${m.symbol} ${m.changePercent.toFixed(1)}%`).join(", ")}
- Fear & Greed: ${data.fearGreedScore}/100 (${data.fearGreedLabel})
- Crypto: ${data.cryptoMovers.map((c) => `${c.name} ${c.changePercent > 0 ? "+" : ""}${c.changePercent.toFixed(1)}%`).join(", ")}

Write only the paragraph, no preamble or labels.`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}
