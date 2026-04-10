"use client";

import { useEffect, useState, useCallback } from "react";
import CardShell from "./ui/CardShell";
import SkeletonCard from "./ui/SkeletonCard";
import ErrorState from "./ui/ErrorState";
import type { NewsData, NewsItem } from "@/app/api/news/route";

const CATEGORY_COLORS: Record<string, string> = {
  politics: "#6366f1",
  economy: "#22c55e",
  international: "#06b6d4",
  science: "#a855f7",
  conflict: "#ef4444",
  technology: "#3b82f6",
  health: "#f59e0b",
  other: "#6b7280",
};

function PriorityDot({ priority }: { priority: NewsItem["priority"] }) {
  const color =
    priority === "breaking"
      ? "#ef4444"
      : priority === "high"
      ? "#f59e0b"
      : "transparent";
  const pulse = priority === "breaking";

  return (
    <span
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        animation: pulse ? "pulse 1.5s infinite" : "none",
      }}
    />
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NewsRow({ item }: { item: NewsItem }) {
  const catColor = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.opacity = "0.8")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.opacity = "1")
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          marginBottom: "4px",
        }}
      >
        <PriorityDot priority={item.priority} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--foreground)",
              lineHeight: 1.4,
              display: "block",
            }}
          >
            {item.title}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "4px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "4px",
                background: `${catColor}20`,
                color: catColor,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {item.category}
            </span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
              {item.source}
            </span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
              {timeAgo(item.publishedAt)}
            </span>
          </div>
          {item.summary && (
            <p
              style={{
                margin: "5px 0 0",
                fontSize: "12px",
                color: "var(--muted)",
                lineHeight: 1.5,
              }}
            >
              {item.summary}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

export default function NewsCard({ animationDelay = 0 }: { animationDelay?: number }) {
  const [data, setData] = useState<NewsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async (bust = false) => {
    setError(null);
    try {
      const res = await fetch(`/api/news${bust ? "?bust=1" : ""}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  if (loading) return <SkeletonCard rows={8} />;
  if (error || !data)
    return (
      <ErrorState
        message={error ?? "Couldn't load news"}
        onRetry={() => { setLoading(true); fetchNews(true); }}
      />
    );

  return (
    <CardShell
      title="World News"
      icon="🌎"
      updatedAt={data.updatedAt}
      onRefresh={() => { setLoading(true); return fetchNews(true); }}
      animationDelay={animationDelay}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      {data.items.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: "13px" }}>No headlines available</p>
      ) : (
        <div>
          {data.items.map((item, i) => (
            <NewsRow key={i} item={item} />
          ))}
        </div>
      )}
    </CardShell>
  );
}
