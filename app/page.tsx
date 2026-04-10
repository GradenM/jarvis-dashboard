import Header from "@/app/components/Header";
import WeatherCard from "@/app/components/WeatherCard";
import MarketCard from "@/app/components/MarketCard";
import NewsCard from "@/app/components/NewsCard";
import TechNewsCard from "@/app/components/TechNewsCard";
import CyberNewsCard from "@/app/components/CyberNewsCard";

export default function DashboardPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          padding: "24px 32px",
          maxWidth: "1600px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Top row: Weather + Markets side by side, then news below */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
          <WeatherCard animationDelay={0} />
          <MarketCard animationDelay={50} />
          <NewsCard animationDelay={100} />
          <TechNewsCard animationDelay={150} />
          <CyberNewsCard animationDelay={200} />

          {/* Phase 3–4 placeholders */}
          <PlaceholderCard title="AI Chat" icon="💬" delay={250} phase={3} />
          <PlaceholderCard title="Gmail" icon="📧" delay={300} phase={4} />
          <PlaceholderCard title="Calendar" icon="📅" delay={350} phase={4} />
          <PlaceholderCard title="Countdowns" icon="⏳" delay={400} phase={4} />
          <PlaceholderCard title="Quick Links" icon="🔗" delay={450} phase={4} />
        </div>
      </main>

      <footer
        style={{
          padding: "12px 32px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          color: "var(--muted)",
        }}
      >
        JARVIS — Personal Morning Briefing Dashboard
      </footer>
    </div>
  );
}

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
        opacity: 0.6,
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
