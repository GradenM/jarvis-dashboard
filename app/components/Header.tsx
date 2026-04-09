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
    // SSR placeholder
    return (
      <header
        style={{
          padding: "28px 32px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="skeleton" style={{ width: "300px", height: "32px", marginBottom: "8px" }} />
        <div className="skeleton" style={{ width: "200px", height: "16px" }} />
      </header>
    );
  }

  return (
    <header
      style={{
        padding: "28px 32px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "28px",
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
            fontSize: "15px",
            color: "var(--muted)",
            margin: "6px 0 0",
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
