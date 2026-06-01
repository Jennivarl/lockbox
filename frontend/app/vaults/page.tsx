"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Timer, Users, Plus, PiggyBank, Dumbbell, Building2, Lock } from "lucide-react";
import Nav from "@/components/Nav";
import { Badge } from "@/components/Badge";
import { ProgressBar } from "@/components/ProgressBar";
import { api } from "@/lib/api";
import type { Vault } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';

const STATUS_VARIANT: Record<string, "info" | "success" | "default" | "danger"> = {
  filling: "info", active: "success", completed: "default", dead: "danger",
};

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  savings:        { icon: PiggyBank, color: "#059669", bg: "rgba(5,150,105,0.08)",   label: "Savings" },
  accountability: { icon: Dumbbell,  color: "#7C3AED", bg: "rgba(124,58,237,0.08)",  label: "Accountability" },
  dao:            { icon: Building2, color: "#2563EB", bg: "rgba(37,99,235,0.08)",   label: "DAO" },
  vesting:        { icon: Lock,      color: "#D97706", bg: "rgba(217,119,6,0.08)",   label: "Vesting" },
};

function timeLeft(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function VaultCard({ v, index }: { v: Vault; index: number }) {
  const active   = v.members.filter(m => m.status === "active");
  const quits    = v.members.filter(m => m.status === "quit");
  const progress = Math.round((active.length / v.max_members) * 100);
  const meta     = TYPE_META[v.type] ?? TYPE_META.vesting;
  const TypeIcon = meta.icon;

  return (
    <Link href={`/vaults/${v.id}`} style={{ textDecoration: "none" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        whileHover={{ y: -4, boxShadow: `0 10px 36px ${meta.color}22` }}
        style={{
          borderRadius: 16, padding: 24,
          background: "#EDF0F5",
          border: `1px solid rgba(0,0,0,0.09)`,
          borderTop: `3px solid ${meta.color}`,
          cursor: "pointer", height: "100%", display: "flex", flexDirection: "column",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: meta.bg, border: `1px solid ${meta.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TypeIcon style={{ width: 17, height: 17, color: meta.color }} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: meta.color, marginBottom: 2 }}>
                {meta.label}
              </div>
              <Badge variant={STATUS_VARIANT[v.status] ?? "default"}>{v.status}</Badge>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: font, fontSize: 19, fontWeight: 900, color: "#000000", letterSpacing: "-0.02em" }}>
              {v.pot_total.toLocaleString()}
            </div>
            <div style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>RIAO locked</div>
          </div>
        </div>

        <h3 style={{
          fontFamily: font, fontSize: 14, fontWeight: 700, color: "#000000",
          marginBottom: 8, lineHeight: 1.4, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        } as React.CSSProperties}>
          {v.name}
        </h3>
        <p style={{
          fontFamily: font, fontSize: 12, color: "#6B6B6B", lineHeight: 1.6,
          marginBottom: 16,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        } as React.CSSProperties}>
          {v.description}
        </p>

        <div style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>
              {active.length}/{v.max_members} members
            </span>
            {v.buy_in > 0 && (
              <span style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>
                {v.buy_in.toLocaleString()} RIAO buy-in
              </span>
            )}
          </div>
          <ProgressBar progress={progress} color={meta.color} delay={index * 0.05 + 0.2} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Timer style={{ width: 13, height: 13 }} />
            <span>{timeLeft(v.deadline)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Users style={{ width: 13, height: 13 }} />
            <span>{active.length}/{v.max_members}</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {quits.length > 0 && (
              <span style={{ color: "#DC2626", fontWeight: 700 }}>{quits.length} quit</span>
            )}
            <span style={{ fontWeight: 700, color: meta.color }}>{v.penalty_pct}% slash</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

const TYPE_FILTERS = ["all", "savings", "accountability", "dao", "vesting"] as const;
const STATUS_FILTERS = ["filling", "active", "completed", "dead"] as const;

export default function VaultsPage() {
  const [vaults,       setVaults]       = useState<Vault[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [typeFilter,   setTypeFilter]   = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    api.vaults().then(v => { setVaults(v); setLoading(false); }).catch(() => setLoading(false));
    const t = setInterval(() => api.vaults().then(setVaults).catch(() => null), 5000);
    return () => clearInterval(t);
  }, []);

  const filtered = vaults.filter(v =>
    (typeFilter === "all" || v.type === typeFilter) &&
    (statusFilter === "all" || v.status === statusFilter)
  );

  const open   = vaults.filter(v => v.status === "active" || v.status === "filling").length;
  const locked = vaults.reduce((s, v) => s + v.pot_total, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 32px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: font, fontSize: 32, fontWeight: 900, color: "#000000", letterSpacing: "-0.02em", marginBottom: 4 }}>Vaults</h1>
            <p style={{ fontFamily: font, fontSize: 14, color: "#6B6B6B" }}>
              {open} open · {locked.toLocaleString()} RIAO at stake
            </p>
          </div>
          <Link href="/vaults/new" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            fontFamily: font, letterSpacing: "0.06em", textTransform: "uppercase",
            background: "#000000", color: "#FFFFFF", textDecoration: "none",
          }}>
            <Plus style={{ width: 15, height: 15 }} /> New Vault
          </Link>
        </div>

        {/* Type filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {TYPE_FILTERS.map(f => {
            const meta = f !== "all" ? TYPE_META[f] : null;
            const active = typeFilter === f;
            return (
              <button key={f} onClick={() => setTypeFilter(f)} style={{
                padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                fontFamily: font, letterSpacing: "0.05em", textTransform: "capitalize",
                cursor: "pointer",
                background: active ? (meta?.color ?? "#000000") : "transparent",
                color: active ? "#FFFFFF" : (meta?.color ?? "#6B6B6B"),
                border: `1px solid ${active ? (meta?.color ?? "#000000") : "rgba(0,0,0,0.15)"}`,
                transition: "all 0.15s",
              }}>
                {f === "all" ? "All Types" : TYPE_META[f].label}
              </button>
            );
          })}
          <div style={{ width: 1, background: "rgba(0,0,0,0.12)", margin: "0 4px" }} />
          {STATUS_FILTERS.map(f => {
            const active = statusFilter === f;
            return (
              <button key={f} onClick={() => setStatusFilter(active ? "all" : f)} style={{
                padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                fontFamily: font, letterSpacing: "0.05em", textTransform: "capitalize",
                cursor: "pointer",
                background: active ? "#000000" : "transparent",
                color: active ? "#FFFFFF" : "#6B6B6B",
                border: active ? "1px solid #000000" : "1px solid rgba(0,0,0,0.15)",
                transition: "all 0.15s",
              }}>
                {f}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", fontFamily: font, color: "#9B9B9B" }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {filtered.map((v, i) => <VaultCard key={v.id} v={v} index={i} />)}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", fontFamily: font, color: "#9B9B9B" }}>
                No vaults found.{" "}
                <Link href="/vaults/new" style={{ color: "#000000", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  Create one →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
