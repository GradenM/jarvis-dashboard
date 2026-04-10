"use client";

import { useEffect, useState, useCallback } from "react";
import CardShell from "./ui/CardShell";
import SkeletonCard from "./ui/SkeletonCard";
import ErrorState from "./ui/ErrorState";
import type { CyberNewsData, CyberNewsItem } from "@/app/api/cyber-news/route";

const SOURCE_COLORS: Record<string, string> = {
  "Krebs on Security": "#ef4444",
  "BleepingComputer": "#f97316",
  "The Record": "#6366f1",
  "CISA KEV": "#dc2626",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CyberNewsRow({ item }: { item: CyberNewsItem }) {
  const color = SOURCE_COLORS[item.source] ?? "#6b7280";
  const isCisa = item.source === "CISA KEV";

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
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
        {isCisa && (
          <span
            title="CISA Known Exploited Vulnerability"
            style={{
              fontSize: "11px",
              marginTop: "1px",
              flexShrink: 0,
              color: "#dc2626",
            }}
          >
            ⚠
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)", lineHeight: 1.4, display: "block" }}>
            {item.title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "4px 0" }}>
            <span
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "4px",
                background: `${color}20`,
                color,
                fontWeight: 600,
              }}
            >
              {item.source}
            </span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>{timeAgo(item.publishedAt)}</span>
          </div>
          {item.whyItMatters && (
            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
              {item.whyItMatters}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

export default function CyberNewsCard({ animationDelay = 0 }: { animationDelay?: number }) {
  const [data, setData] = useState<CyberNewsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async (bust = false) => {
    setError(null);
    try {
      const res = await fetch(`/api/cyber-news${bust ? "?bust=1" : ""}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  if (loading) return <SkeletonCard rows={7} />;
  if (error || !data)
    return (
      <ErrorState
        message={error ?? "Couldn't load cyber news"}
        onRetry={() => { setLoading(true); fetch_(true); }}
      />
    );

  return (
    <CardShell
      title="Cybersecurity"
      icon="🛡️"
      updatedAt={data.updatedAt}
      onRefresh={() => { setLoading(true); return fetch_(true); }}
      animationDelay={animationDelay}
    >
      {data.items.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: "13px" }}>No cyber news available</p>
      ) : (
        data.items.map((item, i) => <CyberNewsRow key={i} item={item} />)
      )}
    </CardShell>
  );
}
