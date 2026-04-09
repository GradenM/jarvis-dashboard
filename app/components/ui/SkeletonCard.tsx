"use client";

type Props = {
  rows?: number;
  height?: string;
  title?: boolean;
};

export default function SkeletonCard({ rows = 3, title = true }: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      {title && (
        <div className="skeleton" style={{ width: "40%", height: "14px", marginBottom: "16px" }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              height: "12px",
              width: i === rows - 1 ? "70%" : "100%",
            }}
          />
        ))}
      </div>
    </div>
  );
}
