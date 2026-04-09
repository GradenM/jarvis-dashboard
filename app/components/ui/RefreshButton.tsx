"use client";

import { useState } from "react";

type Props = {
  onRefresh: () => Promise<void> | void;
};

export default function RefreshButton({ onRefresh }: Props) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setSpinning(false), 600);
    }
  };

  return (
    <button
      onClick={handleClick}
      title="Refresh"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--muted)",
        padding: "4px",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        transition: "color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform: spinning ? "rotate(360deg)" : "none",
          transition: spinning ? "transform 0.6s linear" : "none",
        }}
      >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    </button>
  );
}
