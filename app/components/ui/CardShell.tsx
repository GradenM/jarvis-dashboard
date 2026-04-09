"use client";

import { ReactNode } from "react";
import RefreshButton from "./RefreshButton";

type Props = {
  title: string;
  icon?: string;
  updatedAt?: number | null;
  onRefresh?: () => Promise<void> | void;
  children: ReactNode;
  animationDelay?: number;
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

export default function CardShell({
  title,
  icon,
  updatedAt,
  onRefresh,
  children,
  animationDelay = 0,
}: Props) {
  return (
    <div
      className="card-enter"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        animationDelay: `${animationDelay}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {icon && <span style={{ fontSize: "16px" }}>{icon}</span>}
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted)",
            }}
          >
            {title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {updatedAt && (
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
              {timeAgo(updatedAt)}
            </span>
          )}
          {onRefresh && <RefreshButton onRefresh={onRefresh} />}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "16px", flex: 1 }}>{children}</div>
    </div>
  );
}
