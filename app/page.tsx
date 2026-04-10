import Header from "@/app/components/Header";
import DashboardBody from "@/app/components/DashboardBody";

export default function DashboardPage() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      <Header />
      <DashboardBody />
    </div>
  );
}
