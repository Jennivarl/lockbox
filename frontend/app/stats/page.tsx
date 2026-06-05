"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { Vault } from "@/lib/types";
import type { Stats } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';

const TYPE_META: Record<string, { color: string; label: string }> = {
  savings:        { color: "#059669", label: "Savings"        },
  accountability: { color: "#7C3AED", label: "Accountability" },
  dao:            { color: "#2563EB", label: "DAO"            },
  vesting:        { color: "#D97706", label: "Vesting"        },
};

const STATUS_META: Record<string, { color: string; label: string }> = {
  filling:   { color: "#2563EB", label: "Filling"   },
  active:    { color: "#059669", label: "Active"    },
  completed: { color: "#6B6B6B", label: "Completed" },
  dead:      { color: "#DC2626", label: "Dead"      },
};

// SVG donut chart
function DonutChart({ slices, size = 120 }: {
  slices: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;
  const r = 44; const cx = size / 2; const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const arcs = slices.map(sl => {
    const pct   = sl.value / total;
    const dash  = pct * circumference;
    const gap   = circumference - dash;
    const rot   = offset * 360 - 90;
    offset += pct;
    return { ...sl, dash, gap, rot };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          fill="none" stroke={a.color} strokeWidth="18"
          strokeDasharray={`${a.dash} ${a.gap}`}
          strokeDashoffset={0}
          transform={`rotate(${a.rot} ${cx} ${cy})`}
          strokeLinecap="butt"
        />
      ))}
      {/* Centre hole */}
      <circle cx={cx} cy={cy} r={26} fill="#FFFFFF" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="Space Mono, monospace" fontSize="13" fontWeight="700" fill="#000000">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontFamily="Space Mono, monospace" fontSize="8" fill="#9B9B9B">
        VAULTS
      </text>
    </svg>
  );
}

// Horizontal bar chart
function HBar({ label, value, max, color, suffix = "" }: {
  label: string; value: number; max: number; color: string; suffix?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: font, fontSize: 12, color: "#374151", fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: font, fontSize: 12, fontWeight: 900, color }}>{value.toLocaleString()}{suffix}</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 99, background: color }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, delay }: {
  label: string; value: string | number; sub?: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        borderRadius: 14, padding: "22px 20px",
        background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
        borderTop: `3px solid ${color}`,
      }}
    >
      <div style={{ fontFamily: font, fontSize: 28, fontWeight: 900, color, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color, opacity: 0.6, marginBottom: 4 }}>{sub}</div>}
      <div style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>{label}</div>
    </motion.div>
  );
}

export default function StatsPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [stats,  setStats]  = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([api.vaults(), api.stats()]).then(([vs, s]) => {
      setVaults(vs); setStats(s);
    }).catch(() => null);
    const t = setInterval(() => {
      Promise.all([api.vaults(), api.stats()]).then(([vs, s]) => {
        setVaults(vs); setStats(s);
      }).catch(() => null);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  // Derived analytics
  const byType = Object.keys(TYPE_META).map(t => {
    const tvaults = vaults.filter(v => v.type === t);
    const locked  = tvaults.reduce((s, v) => s + v.pot_total, 0);
    const quits   = tvaults.flatMap(v => v.members).filter(m => m.status === "quit").length;
    const active  = tvaults.flatMap(v => v.members).filter(m => m.status === "active").length;
    const paid    = tvaults.flatMap(v => v.members).filter(m => m.status === "paid").length;
    return { type: t, ...TYPE_META[t], count: tvaults.length, locked, quits, active, paid };
  });

  const byStatus = Object.keys(STATUS_META).map(s => ({
    ...STATUS_META[s], key: s,
    count: vaults.filter(v => v.status === s).length,
  }));

  const totalMembers  = vaults.flatMap(v => v.members).length;
  const totalQuits    = vaults.flatMap(v => v.members).filter(m => m.status === "quit").length;
  const totalPaid     = vaults.flatMap(v => v.members).filter(m => m.status === "paid").length;
  const totalLocked   = vaults.reduce((s, v) => s + v.pot_total, 0);
  const survivalRate  = totalPaid + totalQuits > 0
    ? Math.round((totalPaid / (totalPaid + totalQuits)) * 100) : 0;
  const avgBuyIn      = vaults.length > 0
    ? Math.round(vaults.reduce((s, v) => s + v.buy_in, 0) / vaults.length) : 0;

  const maxLocked = Math.max(...byType.map(t => t.locked), 1);
  const maxQuits  = Math.max(...byType.map(t => t.quits), 1);

  // Top 5 vaults by pot
  const topVaults = [...vaults].sort((a, b) => b.pot_total - a.pot_total).slice(0, 5);

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "36px 32px" }}>

        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none",
          marginBottom: 28,
        }}>
          <ArrowLeft style={{ width: 15, height: 15 }} /> Home
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TrendingUp style={{ width: 18, height: 18, color: "#000000" }} strokeWidth={2} />
            </div>
            <h1 style={{ fontFamily: font, fontSize: 28, fontWeight: 900, color: "#000000",
              letterSpacing: "-0.02em", margin: 0 }}>
              Protocol Analytics
            </h1>
          </div>
          <p style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", margin: 0 }}>
            Live metrics across all {vaults.length} vaults on Lockbox
          </p>
        </motion.div>

        {/* Key metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "RIAO locked",      value: totalLocked,          sub: "RIAO",  color: "#059669", delay: 0    },
            { label: "Total vaults",     value: vaults.length,        sub: "",      color: "#2563EB", delay: 0.05 },
            { label: "Active members",   value: stats?.active_vaults ?? 0, sub: "vaults", color: "#7C3AED", delay: 0.1 },
            { label: "Rage quits",       value: totalQuits,           sub: "",      color: "#DC2626", delay: 0.15 },
            { label: "Survivors paid",   value: totalPaid,            sub: "",      color: "#059669", delay: 0.2  },
            { label: "Survival rate",    value: `${survivalRate}%`,   sub: "",      color: "#D97706", delay: 0.25 },
          ].map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Row 1: RIAO by type + Status donut */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>

          {/* RIAO locked by type */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
            style={{ borderRadius: 16, padding: "24px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)" }}>
            <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#9B9B9B", marginBottom: 20 }}>
              RIAO Locked by Category
            </div>
            {byType.map(t => (
              <HBar key={t.type} label={t.label} value={t.locked} max={maxLocked} color={t.color} suffix=" RIAO" />
            ))}
          </motion.div>

          {/* Vault status donut */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}
            style={{ borderRadius: 16, padding: "24px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)" }}>
            <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#9B9B9B", marginBottom: 20 }}>
              Vault Status Distribution
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <DonutChart
                slices={byStatus.filter(s => s.count > 0).map(s => ({ value: s.count, color: s.color, label: s.label }))}
              />
              <div style={{ flex: 1 }}>
                {byStatus.map(s => (
                  <div key={s.key} style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                      <span style={{ fontFamily: font, fontSize: 11, color: "#374151" }}>{s.label}</span>
                    </div>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 900, color: s.color }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2: Rage quits by type + Vault count by type */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Quit rate by type */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}
            style={{ borderRadius: 16, padding: "24px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)" }}>
            <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#9B9B9B", marginBottom: 20 }}>
              Rage Quits by Category
            </div>
            {byType.map(t => (
              <HBar key={t.type} label={t.label} value={t.quits} max={maxQuits} color={t.color} />
            ))}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.07)",
              display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>Total rage quits</span>
              <span style={{ fontFamily: font, fontSize: 13, fontWeight: 900, color: "#DC2626" }}>{totalQuits}</span>
            </div>
          </motion.div>

          {/* Vault count per type as tall bars */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }}
            style={{ borderRadius: 16, padding: "24px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)" }}>
            <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#9B9B9B", marginBottom: 20 }}>
              Vault Count by Category
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 120, paddingBottom: 0 }}>
              {byType.map(t => {
                const maxCount = Math.max(...byType.map(x => x.count), 1);
                const barH = (t.count / maxCount) * 100;
                return (
                  <div key={t.type} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 900, color: t.color }}>{t.count}</span>
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: barH }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                      style={{ width: "100%", borderRadius: "6px 6px 0 0", background: t.color, minHeight: 4 }}
                    />
                    <span style={{ fontFamily: font, fontSize: 9, color: "#9B9B9B", textAlign: "center",
                      letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      {t.label.slice(0, 6)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.07)",
              display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>Avg buy-in</span>
              <span style={{ fontFamily: font, fontSize: 13, fontWeight: 900, color: "#000000" }}>
                {avgBuyIn.toLocaleString()} RIAO
              </span>
            </div>
          </motion.div>
        </div>

        {/* Top vaults leaderboard */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
          style={{ borderRadius: 16, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#9B9B9B" }}>
              Top Vaults by Pot Size
            </div>
          </div>
          {topVaults.map((v, i) => {
            const tm = TYPE_META[v.type] ?? TYPE_META.vesting;
            const members = v.members.filter(m => m.status === "active").length;
            return (
              <Link key={v.id} href={`/vaults/${v.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "16px 24px", borderBottom: "1px solid rgba(0,0,0,0.05)",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#F8F9FB"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{ fontFamily: font, fontSize: 18, fontWeight: 900, color: "#DDDDDD",
                    width: 28, textAlign: "right", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{
                    width: 8, height: 8, borderRadius: 2, background: tm.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000000",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.name}
                    </div>
                    <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginTop: 2 }}>
                      {tm.label} · {members}/{v.max_members} members · {v.status}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: font, fontSize: 16, fontWeight: 900, color: tm.color,
                      letterSpacing: "-0.02em" }}>
                      {v.pot_total.toLocaleString()}
                    </div>
                    <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>RIAO</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </motion.div>

      </div>
    </div>
  );
}
