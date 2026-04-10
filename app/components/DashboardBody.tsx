"use client";

import { useState, useEffect } from "react";
import WeatherCard from "./WeatherCard";
import MarketCard from "./MarketCard";
import NewsCard from "./NewsCard";
import TechNewsCard from "./TechNewsCard";
import CyberNewsCard from "./CyberNewsCard";
import ChatPanel from "./ChatPanel";

function PlaceholderCard({
  title,
  icon,
  delay,
  phase,
}: {
  title: string;
  icon: string;
  delay: number;
  phase: number;
}) {
  return (
    <div
      className="card-enter"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
        minHeight: "120px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        opacity: 0.5,
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--muted)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>{icon}</span>
        {title}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontSize: "12px",
          opacity: 0.6,
        }}
      >
        Phase {phase}
      </div>
    </div>
  );
}

export default function DashboardBody() {
  const [chatOpen, setChatOpen] = useState(true);

  // Persist preference
  useEffect(() => {
    const saved = localStorage.getItem("jarvis-chat-open");
    if (saved !== null) setChatOpen(saved === "true");
  }, []);

  const toggleChat = () => {
    setChatOpen((prev) => {
      localStorage.setItem("jarvis-chat-open", String(!prev));
      return !prev;
    });
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
      {/* Main scrollable content */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "28px 32px 32px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "20px",
          }}
        >
          <WeatherCard animationDelay={0} />
          <MarketCard animationDelay={50} />
          <NewsCard animationDelay={100} />
          <TechNewsCard animationDelay={150} />
          <CyberNewsCard animationDelay={200} />
          <PlaceholderCard title="Gmail" icon="📧" delay={250} phase={4} />
          <PlaceholderCard title="Calendar" icon="📅" delay={300} phase={4} />
          <PlaceholderCard title="Countdowns" icon="⏳" delay={350} phase={4} />
          <PlaceholderCard title="Quick Links" icon="🔗" delay={400} phase={4} />
        </div>

        <footer
          style={{
            padding: "24px 0 8px",
            fontSize: "11px",
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          JARVIS — Personal Morning Briefing Dashboard
        </footer>
      </main>

      {/* Chat toggle tab — always visible on the right edge */}
      <button
        onClick={toggleChat}
        title={chatOpen ? "Collapse chat" : "Open chat"}
        style={{
          position: "relative",
          zIndex: 10,
          width: "22px",
          flexShrink: 0,
          background: "var(--surface)",
          border: "none",
          borderLeft: "1px solid var(--border)",
          borderRight: chatOpen ? "none" : "1px solid var(--border)",
          cursor: "pointer",
          color: "var(--muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.15s, background 0.15s",
          fontSize: "12px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--foreground)";
          e.currentTarget.style.background = "var(--surface-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--muted)";
          e.currentTarget.style.background = "var(--surface)";
        }}
      >
        {chatOpen ? "›" : "‹"}
      </button>

      {/* Chat panel */}
      <div
        style={{
          width: chatOpen ? "360px" : "0px",
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 0.25s ease",
        }}
      >
        <ChatPanel />
      </div>
    </div>
  );
}
