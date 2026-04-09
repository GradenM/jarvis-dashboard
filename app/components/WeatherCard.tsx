"use client";

import { useEffect, useState, useCallback } from "react";
import CardShell from "./ui/CardShell";
import SkeletonCard from "./ui/SkeletonCard";
import ErrorState from "./ui/ErrorState";

type WeatherData = {
  temp: number;
  high: number;
  low: number;
  description: string;
  rainChance: number;
  dressCode: string;
  location: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  updatedAt: number;
};

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDressEmoji(dressCode: string): string {
  const map: Record<string, string> = {
    shorts: "🩳",
    "t-shirt": "👕",
    "light jacket": "🧥",
    jacket: "🧥",
    "heavy coat": "🧣",
    umbrella: "☂️",
  };
  return map[dressCode] || "👔";
}

export default function WeatherCard({ animationDelay = 0 }: { animationDelay?: number }) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(async (bust = false) => {
    setError(null);
    try {
      const res = await fetch(`/api/weather${bust ? "?bust=1" : ""}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  if (loading) return <SkeletonCard rows={4} />;
  if (error || !data)
    return (
      <ErrorState
        message={error || "Couldn't load weather"}
        onRetry={() => {
          setLoading(true);
          fetchWeather(true);
        }}
      />
    );

  return (
    <CardShell
      title="Weather"
      icon="🌤"
      updatedAt={data.updatedAt}
      onRefresh={() => {
        setLoading(true);
        return fetchWeather(true);
      }}
      animationDelay={animationDelay}
    >
      {/* Main temp display */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "52px", fontWeight: 700, lineHeight: 1, color: "var(--foreground)" }}>
            {data.temp}°
          </div>
          <div style={{ fontSize: "14px", color: "var(--muted)", marginTop: "4px" }}>
            {capitalize(data.description)}
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>
            {data.location}
          </div>
        </div>
        {/* Weather icon from OpenWeatherMap */}
        <img
          src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
          alt={data.description}
          width={72}
          height={72}
          style={{ filter: "brightness(1.2)" }}
        />
      </div>

      {/* High / Low */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "14px",
          padding: "10px 12px",
          background: "var(--surface-hover)",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>High</span>
          <span style={{ fontSize: "18px", fontWeight: 600, color: "#ef4444" }}>{data.high}°</span>
        </div>
        <div style={{ width: "1px", background: "var(--border)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Low</span>
          <span style={{ fontSize: "18px", fontWeight: 600, color: "#60a5fa" }}>{data.low}°</span>
        </div>
        <div style={{ width: "1px", background: "var(--border)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rain</span>
          <span style={{ fontSize: "18px", fontWeight: 600, color: data.rainChance > 50 ? "#60a5fa" : "var(--foreground)" }}>
            {data.rainChance}%
          </span>
        </div>
        <div style={{ width: "1px", background: "var(--border)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Wind</span>
          <span style={{ fontSize: "18px", fontWeight: 600 }}>{data.windSpeed}</span>
        </div>
      </div>

      {/* Dress code recommendation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        <span style={{ fontSize: "20px" }}>{getDressEmoji(data.dressCode)}</span>
        <span style={{ color: "var(--muted)" }}>Wear:</span>
        <span style={{ fontWeight: 600, color: "var(--foreground)", textTransform: "capitalize" }}>
          {data.dressCode}
        </span>
      </div>
    </CardShell>
  );
}
