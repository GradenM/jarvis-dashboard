"use client";

type Props = {
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  message = "Couldn't load data",
  onRetry,
}: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        color: "var(--muted)",
        fontSize: "14px",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: "20px" }}>⚠️</span>
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: "4px",
            padding: "6px 14px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--foreground)",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
