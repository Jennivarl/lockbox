"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Trophy, Skull, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { Avatar } from "@/components/Avatar";
import { api } from "@/lib/api";
import type { Peer } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';

function ratio(p: Peer): string {
  const total = p.vaults_survived + p.vaults_quit;
  if (total === 0) return "—";
  return `${Math.round((p.vaults_survived / total) * 100)}%`;
}

const RANK_STYLES = [
  { border: "1px solid rgba(0,0,0,0.15)", background: "#FFFFFF", minHeight: 180 },
  { border: "1px solid rgba(0,0,0,0.09)", background: "#FFFFFF", minHeight: 150 },
  { border: "1px solid rgba(0,0,0,0.09)", background: "#FFFFFF", minHeight: 150 },
];

function RankBadge({ rank }: { rank: number }) {
  const colors = ["#B8860B", "#9B9B9B", "#8B6F47"];
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      background: rank <= 3 ? `${colors[rank - 1]}18` : "rgba(0,0,0,0.04)",
      border: rank <= 3 ? `1px solid ${colors[rank - 1]}40` : "1px solid rgba(0,0,0,0.1)",
      fontFamily: font, fontSize: 12, fontWeight: 900,
      color: rank <= 3 ? colors[rank - 1] : "#9B9B9B",
    }}>
      {rank}
    </div>
  );
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
  const isSurv = tab === "survivors";

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none",
          marginBottom: 24,
        }}>
          <ArrowLeft style={{ width: 15, height: 15 }} /> Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          <h1 style={{ fontFamily: font, fontSize: 32, fontWeight: 900, color: "#000000", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Leaderboard
          </h1>
          <p style={{ fontFamily: font, fontSize: 14, color: "#6B6B6B", marginBottom: 28 }}>
            Who holds the line — and who doesn&apos;t.
          </p>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
            {([
              ["survivors", "Survivors",    Trophy],
              ["quitters",  "Rage Quitters", Skull],
            ] as const).map(([t, l, Icon]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 20px", borderRadius: 8,
                fontFamily: font, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
                cursor: "pointer", transition: "all 0.15s",
                background: tab === t ? "#000000" : "transparent",
                color: tab === t ? "#FFFFFF" : "#6B6B6B",
                border: tab === t ? "1px solid #000000" : "1px solid rgba(0,0,0,0.15)",
              }}>
                <Icon style={{ width: 14, height: 14 }} />
                {l}
              </button>
            ))}
          </div>

          {/* Podium */}
          {!loading && top3.length >= 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
              {[top3[1], top3[0], top3[2]].map((peer, i) => {
                const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
                const rankStyle = RANK_STYLES[rank - 1];
                return (
                  <motion.div key={peer.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    style={{
                      borderRadius: 16, padding: "24px 20px", textAlign: "center",
                      border: rankStyle.border, background: rankStyle.background,
                      minHeight: rankStyle.minHeight, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                    <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 4 }}>
                      #{rank}
                    </div>
                    <Avatar name={peer.name} size="sm" variant={isSurv ? "active" : "inactive"} />
                    <div style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: "#000000" }}>{peer.name}</div>
                    <div style={{ fontFamily: font, fontSize: 26, fontWeight: 900, color: isSurv ? "#059669" : "#DC2626", letterSpacing: "-0.02em" }}>
                      {isSurv ? peer.vaults_survived : peer.vaults_quit}
                    </div>
                    <div style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>
                      {isSurv ? "survived" : "quit"}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Table */}
          <div style={{ borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", background: "#FFFFFF", overflow: "hidden" }}>
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "48px 1fr 80px 70px 100px 80px",
              padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)",
              fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#9B9B9B",
            }}>
              <div>#</div>
              <div>Contributor</div>
              <div style={{ textAlign: "center" }}>Survived</div>
              <div style={{ textAlign: "center" }}>Quit</div>
              <div style={{ textAlign: "right" }}>Earned</div>
              <div style={{ textAlign: "right" }}>Survive%</div>
            </div>

            {loading ? (
              <div style={{ padding: "64px 0", textAlign: "center", fontFamily: font, fontSize: 13, color: "#9B9B9B" }}>
                Loading…
              </div>
            ) : sorted.map((peer, i) => (
              <motion.div key={peer.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                style={{
                  display: "grid", gridTemplateColumns: "48px 1fr 80px 70px 100px 80px",
                  padding: "14px 20px", alignItems: "center",
                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                  background: i % 2 === 0 ? "#FFFFFF" : "#FFFFFF",
                }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <RankBadge rank={i + 1} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Avatar name={peer.name} size="sm" variant={peer.vaults_survived > peer.vaults_quit ? "active" : "inactive"} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: "#000000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {peer.name}
                    </div>
                    {peer.vaults_created > 0 && (
                      <div style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>
                        {peer.vaults_created} vault{peer.vaults_created !== 1 ? "s" : ""} created
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "center", fontFamily: font, fontSize: 14, fontWeight: 700, color: "#059669" }}>
                  {peer.vaults_survived}
                </div>
                <div style={{ textAlign: "center", fontFamily: font, fontSize: 14, fontWeight: 700, color: peer.vaults_quit > 0 ? "#DC2626" : "#9B9B9B" }}>
                  {peer.vaults_quit}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: "#000000" }}>
                    {peer.total_earned.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>RIAO</div>
                </div>
                <div style={{ textAlign: "right", fontFamily: font, fontSize: 13, fontWeight: 700, color: "#2563EB" }}>
                  {ratio(peer)}
                </div>
              </motion.div>
            ))}

            {!loading && sorted.length === 0 && (
              <div style={{ padding: "64px 0", textAlign: "center", fontFamily: font, fontSize: 13, color: "#9B9B9B" }}>
                No data yet — join a vault to appear here.
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  );
}
