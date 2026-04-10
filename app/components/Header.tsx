"use client";

import { useEffect, useState } from "react";

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning, Graden";
  if (hour < 17) return "Good afternoon, Graden";
  return "Good evening, Graden";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Header() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <header
        style={{
          padding: "18px 32px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div className="skeleton" style={{ width: "280px", height: "28px", marginBottom: "6px" }} />
        <div className="skeleton" style={{ width: "180px", height: "14px" }} />
      </header>
    );
  }

  return (
    <header
      style={{
        padding: "18px 32px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
        flexShrink: 0,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--foreground)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {getGreeting(now.getHours())}
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--muted)",
            margin: "3px 0 0",
          }}
        >
          {formatDate(now)}
        </p>
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "var(--muted)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "var(--green)",
          }}
        />
        JARVIS
      </div>
    </header>
  );
}
