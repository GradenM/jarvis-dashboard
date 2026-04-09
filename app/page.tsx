import Header from "@/app/components/Header";
import WeatherCard from "@/app/components/WeatherCard";

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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          <WeatherCard animationDelay={0} />
          <PlaceholderCard title="Market Intelligence" icon="📈" delay={50} />
          <PlaceholderCard title="World News" icon="🌎" delay={100} />
          <PlaceholderCard title="Tech & AI News" icon="🤖" delay={150} />
          <PlaceholderCard title="Cybersecurity" icon="🛡️" delay={200} />
          <PlaceholderCard title="Trending" icon="🔥" delay={250} />
          <PlaceholderCard title="Gmail" icon="📧" delay={300} />
          <PlaceholderCard title="Calendar" icon="📅" delay={350} />
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
}: {
  title: string;
  icon: string;
  delay: number;
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
        minHeight: "140px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
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
          fontSize: "13px",
          opacity: 0.5,
        }}
      >
        Coming in Phase 2
      </div>
    </div>
  );
}
