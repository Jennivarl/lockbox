"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { Vault } from "@/lib/types";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  filling:   { label: "Filling",   color: "#60a5fa", bg: "rgba(96,165,250,0.1)"  },
  active:    { label: "Active",    color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  completed: { label: "Completed", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  dead:      { label: "Dead",      color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

const TYPE_EMOJI: Record<string, string> = {
  savings: "🏖️", accountability: "💪", dao: "🏛️", vesting: "🔐",
};

function timeLeft(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m left`;
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
}

function VaultCard({ v }: { v: Vault }) {
  const s = STATUS_STYLE[v.status];
  const active = v.members.filter(m => m.status === "active");
  const quits  = v.members.filter(m => m.status === "quit");

  return (
    <Link href={`/vaults/${v.id}`}>
      <div style={{
        background: "rgba(10,6,16,0.8)", borderRadius: 14,
        border: "1px solid rgba(239,68,68,0.1)",
        padding: "22px", cursor: "pointer", height: "100%",
        display: "flex", flexDirection: "column",
        transition: "border-color 150ms, box-shadow 150ms",
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(239,68,68,0.35)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 24px rgba(239,68,68,0.07)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(239,68,68,0.1)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>{TYPE_EMOJI[v.type]}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
              background: s.bg, color: s.color, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              {s.label}
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
              {v.pot_total.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: "#4a3860" }}>RIAO locked</div>
          </div>
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f0eaf8", marginBottom: 8, flex: 1, lineHeight: 1.4 }}>
          {v.name}
        </h3>

        <p style={{
          fontSize: 12, color: "#5a4870", lineHeight: 1.6, marginBottom: 16,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {v.description}
        </p>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#4a3860", marginBottom: 5 }}>
            <span>{active.length}/{v.max_members} members</span>
            {v.buy_in && <span>{v.buy_in.toLocaleString()} RIAO buy-in</span>}
          </div>
          <div style={{ height: 4, borderRadius: 99, background: "rgba(239,68,68,0.1)" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${(active.length / v.max_members) * 100}%`,
              background: v.status === "active" ? "#10b981" : "#ef4444",
              transition: "width 0.3s",
            }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#4a3860" }}>
          <span>⏱ {timeLeft(v.deadline)}</span>
          <div style={{ display: "flex", gap: 10 }}>
            {quits.length > 0 && <span style={{ color: "#ef4444" }}>💀 {quits.length} quit</span>}
            <span>{v.penalty_pct}% penalty</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function VaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "filling" | "active" | "completed" | "dead">("all");

  useEffect(() => {
    api.vaults().then(v => { setVaults(v); setLoading(false); }).catch(() => setLoading(false));
    const t = setInterval(() => api.vaults().then(setVaults).catch(() => null), 5000);
    return () => clearInterval(t);
  }, []);

  const filtered = filter === "all" ? vaults : vaults.filter(v => v.status === filter);

  return (
    <div style={{ minHeight: "100vh", background: "#06040a", color: "#f0eaf8" }}>
      <Nav />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "40px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>Vaults</h1>
            <p style={{ fontSize: 14, color: "#5a4870" }}>
              {vaults.filter(v => v.status === "active" || v.status === "filling").length} open ·{" "}
              {vaults.reduce((s, v) => s + v.pot_total, 0).toLocaleString()} RIAO at stake
            </p>
          </div>
          <Link href="/vaults/new" style={{
            padding: "10px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700,
            background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff",
          }}>
            + New Vault
          </Link>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {(["all", "filling", "active", "completed", "dead"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: filter === f ? "rgba(239,68,68,0.15)" : "transparent",
              border: filter === f ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(239,68,68,0.08)",
              color: filter === f ? "#fca5a5" : "#5a4870",
            }}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#4a3860" }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {filtered.map(v => <VaultCard key={v.id} v={v} />)}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "#4a3860" }}>
                No vaults found. <Link href="/vaults/new" style={{ color: "#ef4444" }}>Create one →</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
