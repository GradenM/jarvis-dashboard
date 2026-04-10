"use client";

import { useEffect, useState, useCallback } from "react";
import CardShell from "./ui/CardShell";
import SkeletonCard from "./ui/SkeletonCard";
import ErrorState from "./ui/ErrorState";
import type { MarketData } from "@/app/api/markets/route";

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmt(n: number) {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

function Arrow({ up }: { up: boolean }) {
  return (
    <span style={{ fontSize: "12px", marginRight: "2px" }}>{up ? "▲" : "▼"}</span>
  );
}

function StatusBadge({ status }: { status: MarketData["marketStatus"] }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: "Markets Open", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    "pre-market": { label: "Pre-Market", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    "after-hours": { label: "After Hours", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
    closed: { label: "Markets Closed", color: "var(--muted)", bg: "var(--surface-hover)" },
  };
  const c = cfg[status] ?? cfg.closed;
  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        color: c.color,
        background: c.bg,
        letterSpacing: "0.02em",
      }}
    >
      {c.label}
    </span>
  );
}

function FearGreedBar({ score, label }: { score: number; label: string }) {
  const color =
    score <= 25
      ? "#ef4444"
      : score <= 45
      ? "#f97316"
      : score <= 55
      ? "#f59e0b"
      : score <= 75
      ? "#84cc16"
      : "#22c55e";

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
          fontSize: "12px",
        }}
      >
        <span style={{ color: "var(--muted)" }}>Fear & Greed</span>
        <span style={{ fontWeight: 600, color }}>
          {score} — {label}
        </span>
      </div>
      <div
        style={{
          height: "6px",
          borderRadius: "3px",
          background: "var(--surface-hover)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: `linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)`,
            borderRadius: "3px",
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "3px",
          fontSize: "10px",
          color: "var(--muted)",
        }}
      >
        <span>Fear</span>
        <span>Greed</span>
      </div>
    </div>
  );
}

function MoverRow({
  symbol,
  name,
  price,
  changePercent,
  reason,
  direction,
}: {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  reason: string;
  direction: "up" | "down";
}) {
  const color = direction === "up" ? "#22c55e" : "#ef4444";
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: "8px",
        background: "var(--surface-hover)",
        marginBottom: "6px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: "13px",
              color: "var(--foreground)",
              minWidth: "48px",
            }}
          >
            {symbol}
          </span>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>{name}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>${fmt(price)}</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color }}>
            <Arrow up={direction === "up"} />
            {pct(Math.abs(changePercent))}
          </div>
        </div>
      </div>
      {reason && (
        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--muted)", lineHeight: 1.4 }}>
          {reason}
        </p>
      )}
    </div>
  );
}

export default function MarketCard({ animationDelay = 0 }: { animationDelay?: number }) {
  const [data, setData] = useState<MarketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stocks" | "crypto">("stocks");

  const fetchMarkets = useCallback(async (bust = false) => {
    setError(null);
    try {
      const res = await fetch(`/api/markets${bust ? "?bust=1" : ""}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  if (loading) return <SkeletonCard rows={6} />;
  if (error || !data)
    return (
      <ErrorState
        message={error ?? "Couldn't load market data"}
        onRetry={() => { setLoading(true); fetchMarkets(true); }}
      />
    );

  return (
    <CardShell
      title="Market Intelligence"
      icon="📈"
      updatedAt={data.updatedAt}
      onRefresh={() => { setLoading(true); return fetchMarkets(true); }}
      animationDelay={animationDelay}
    >
      {/* Status badge */}
      <div style={{ marginBottom: "14px" }}>
        <StatusBadge status={data.marketStatus} />
      </div>

      {/* Indices */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {data.indices.map((idx) => {
          const up = idx.changePercent >= 0;
          return (
            <div
              key={idx.symbol}
              style={{
                padding: "10px 8px",
                background: "var(--surface-hover)",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>
                {idx.name}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>
                {fmt(idx.price)}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: up ? "#22c55e" : "#ef4444",
                }}
              >
                <Arrow up={up} />
                {pct(Math.abs(idx.changePercent))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fear & Greed */}
      <FearGreedBar score={data.fearGreed.score} label={data.fearGreed.label} />

      {/* Movers tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {(["stocks", "crypto"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              background:
                activeTab === tab ? "var(--accent)" : "var(--surface-hover)",
              color: activeTab === tab ? "#fff" : "var(--muted)",
              transition: "all 0.15s",
            }}
          >
            {tab === "stocks" ? "Stocks" : "Crypto"}
          </button>
        ))}
      </div>

      {activeTab === "stocks" && (
        <div>
          {data.stockMovers.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              No significant movers today
            </p>
          ) : (
            data.stockMovers.map((m) => (
              <MoverRow key={m.symbol} {...m} />
            ))
          )}
        </div>
      )}

      {activeTab === "crypto" && (
        <div>
          {data.cryptoMovers.slice(0, 6).map((m) => (
            <MoverRow key={m.symbol} {...m} />
          ))}
        </div>
      )}

      {/* Narrative */}
      {data.narrative && (
        <div
          style={{
            marginTop: "14px",
            padding: "12px",
            background: "rgba(99,102,241,0.07)",
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: "8px",
            fontSize: "13px",
            lineHeight: 1.6,
            color: "var(--foreground)",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--accent)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Today's Market
          </span>
          {data.narrative}
        </div>
      )}
    </CardShell>
  );
}
