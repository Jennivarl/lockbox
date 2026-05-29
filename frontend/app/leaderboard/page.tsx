"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { Peer } from "@/lib/types";

function ratio(p: Peer): string {
  const total = p.vaults_survived + p.vaults_quit;
  if (total === 0) return "—";
  return `${Math.round((p.vaults_survived / total) * 100)}%`;
}

export default function LeaderboardPage() {
  const [peers,   setPeers]   = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<"survivors" | "quitters">("survivors");

  useEffect(() => {
    api.leaderboard(50).then(p => { setPeers(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const sorted = tab === "survivors"
    ? [...peers].sort((a, b) => b.vaults_survived - a.vaults_survived || b.total_earned - a.total_earned)
    : [...peers].sort((a, b) => b.vaults_quit - a.vaults_quit || b.total_lost - a.total_lost);

  const top3 = sorted.slice(0, 3);

  return (
    <div style={{ minHeight: "100vh", background: "#06040a", color: "#f0eaf8" }}>
      <Nav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px" }}>

        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>Leaderboard</h1>
        <p style={{ fontSize: 14, color: "#5a4870", marginBottom: 32 }}>
          Who holds the line — and who doesn't.
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {([["survivors", "🏆 Survivors"], ["quitters", "💀 Rage Quitters"]] as const).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: tab === t
                ? t === "survivors" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"
                : "transparent",
              border: tab === t
                ? t === "survivors" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)"
                : "1px solid rgba(239,68,68,0.08)",
              color: tab === t
                ? t === "survivors" ? "#6ee7b7" : "#fca5a5"
                : "#5a4870",
            }}>
              {l}
            </button>
          ))}
        </div>

        {/* Podium */}
        {!loading && top3.length >= 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
            {[top3[1], top3[0], top3[2]].map((peer, i) => {
              const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
              const medals = ["🥇", "🥈", "🥉"];
              const medal = medals[rank - 1];
              const isSurvivor = tab === "survivors";
              return (
                <div key={peer.id} style={{
                  padding: "20px 16px", borderRadius: 12, textAlign: "center",
                  background: "rgba(10,6,16,0.8)",
                  border: rank === 1
                    ? `1px solid ${isSurvivor ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`
                    : "1px solid rgba(239,68,68,0.08)",
                  minHeight: rank === 1 ? 160 : 130,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{medal}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f0eaf8", marginBottom: 4 }}>{peer.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isSurvivor ? "#10b981" : "#ef4444" }}>
                    {tab === "survivors" ? peer.vaults_survived : peer.vaults_quit}
                  </div>
                  <div style={{ fontSize: 10, color: "#4a3860", letterSpacing: "0.05em" }}>
                    {tab === "survivors" ? "survived" : "quit"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div style={{
          background: "rgba(10,6,16,0.7)", border: "1px solid rgba(239,68,68,0.1)",
          borderRadius: 12, overflow: "hidden",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 80px 90px",
            gap: 12, padding: "10px 20px",
            borderBottom: "1px solid rgba(239,68,68,0.08)",
            background: "rgba(239,68,68,0.03)",
            fontSize: 10, fontWeight: 700, color: "#4a3860",
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            <div>#</div>
            <div>Contributor</div>
            <div style={{ textAlign: "center" }}>Survived</div>
            <div style={{ textAlign: "center" }}>Quit</div>
            <div style={{ textAlign: "right" }}>Earned</div>
            <div style={{ textAlign: "right" }}>Survive %</div>
          </div>

          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#4a3860" }}>Loading…</div>
          ) : sorted.map((peer, i) => (
            <div key={peer.id} style={{
              display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 80px 90px",
              gap: 12, padding: "12px 20px", alignItems: "center",
              borderBottom: "1px solid rgba(239,68,68,0.05)",
              background: i === 0 ? "rgba(239,68,68,0.02)" : "transparent",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: i < 3 ? "#fca5a5" : "#4a3860", textAlign: "center" }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f0eaf8" }}>{peer.name}</div>
                <div style={{ fontSize: 11, color: "#3d3557" }}>{peer.vaults_created > 0 && `${peer.vaults_created} vault${peer.vaults_created !== 1 ? "s" : ""} created`}</div>
              </div>
              <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: "#10b981" }}>{peer.vaults_survived}</div>
              <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: peer.vaults_quit > 0 ? "#ef4444" : "#4a3860" }}>{peer.vaults_quit}</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f0eaf8" }}>{peer.total_earned.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "#4a3860" }}>RIAO</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>{ratio(peer)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
