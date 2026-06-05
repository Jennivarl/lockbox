"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { UserX, DollarSign, Bell, Zap, Clock, ArrowLeft, Radio } from "lucide-react";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { ReactiveEvent, Vault } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';

const EVENT_META: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  rage_quit:    { color: "#DC2626", bg: "rgba(220,38,38,0.08)",   icon: UserX,      label: "Rage Quit"   },
  payout:       { color: "#059669", bg: "rgba(5,150,105,0.08)",   icon: DollarSign, label: "Payout"      },
  announcement: { color: "#7C3AED", bg: "rgba(124,58,237,0.08)",  icon: Zap,        label: "Rule Fired"  },
  notification: { color: "#2563EB", bg: "rgba(37,99,235,0.08)",   icon: Bell,       label: "Event"       },
  warning:      { color: "#D97706", bg: "rgba(217,119,6,0.08)",   icon: Clock,      label: "Warning"     },
};

const FILTERS = [
  { key: "all",          label: "All Events"  },
  { key: "rage_quit",    label: "Rage Quits"  },
  { key: "payout",       label: "Payouts"     },
  { key: "announcement", label: "Rules Fired" },
  { key: "notification", label: "Joins"       },
];

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10)  return "just now";
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function FeedEntry({
  ev, vaultName, vaultId, isNew,
}: {
  ev: ReactiveEvent; vaultName?: string; vaultId?: string; isNew: boolean;
}) {
  const em = EVENT_META[ev.event_type] ?? EVENT_META.notification;
  const Icon = em.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        display: "flex", gap: 16, alignItems: "flex-start",
        padding: "18px 24px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: isNew ? `${em.color}06` : "transparent",
        transition: "background 2s ease",
      }}
    >
      {/* Icon node */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: em.bg, border: `1.5px solid ${em.color}28`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 16, height: 16, color: em.color }} strokeWidth={2} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: font, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: em.color,
            padding: "2px 7px", borderRadius: 4, background: em.bg,
          }}>
            {em.label}
          </span>
          {ev.rule_name && (
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#9B9B9B" }}>
              {ev.rule_name}
            </span>
          )}
          {isNew && (
            <span style={{
              fontFamily: font, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              color: "#059669", padding: "2px 7px", borderRadius: 4,
              background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.25)",
            }}>
              NEW
            </span>
          )}
        </div>

        <div style={{ fontFamily: font, fontSize: 13, color: "#1a1a1a", lineHeight: 1.6, marginBottom: 6 }}>
          {ev.summary}
        </div>

        {vaultName && vaultId && (
          <Link href={`/vaults/${vaultId}`} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontFamily: font, fontSize: 11, color: "#6B6B6B",
            textDecoration: "none",
            padding: "3px 8px", borderRadius: 5,
            background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)",
          }}
            onClick={e => e.stopPropagation()}
          >
            {vaultName}
          </Link>
        )}
      </div>

      {/* Timestamp */}
      <div style={{ fontFamily: font, fontSize: 11, color: "#BBBBBB", flexShrink: 0, marginTop: 2 }}
        title={new Date(ev.fired_at).toLocaleString()}>
        {relativeTime(ev.fired_at)}
      </div>
    </motion.div>
  );
}

export default function FeedPage() {
  const [events,    setEvents]    = useState<ReactiveEvent[]>([]);
  const [vaults,    setVaults]    = useState<Vault[]>([]);
  const [filter,    setFilter]    = useState("all");
  const [newIds,    setNewIds]    = useState<Set<string>>(new Set());
  const [lastSeen,  setLastSeen]  = useState(Date.now());
  const [ticks,     setTicks]     = useState(0);
  const prevIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const [evs, vs] = await Promise.all([
        api.feed(60).catch(() => [] as ReactiveEvent[]),
        api.vaults().catch(() => [] as Vault[]),
      ]);
      const fresh = new Set(evs.map((e: ReactiveEvent) => e.id).filter((eid: string) => !prevIds.current.has(eid)));
      if (fresh.size > 0 && prevIds.current.size > 0) setNewIds(fresh);
      prevIds.current = new Set(evs.map((e: ReactiveEvent) => e.id));
      setEvents(evs);
      setVaults(vs);
      setTimeout(() => setNewIds(new Set()), 3000);
    };
    load();
    const t  = setInterval(load, 4000);
    const tt = setInterval(() => setTicks(n => n + 1), 1000);
    return () => { clearInterval(t); clearInterval(tt); };
  }, []);

  const vaultMap = Object.fromEntries(vaults.map(v => [v.id, v]));

  const filtered = filter === "all"
    ? events
    : events.filter(e => e.event_type === filter);

  const rageQuits = events.filter(e => e.event_type === "rage_quit").length;
  const payouts   = events.filter(e => e.event_type === "payout").length;
  const newCount  = events.filter(e => Date.now() - new Date(e.fired_at).getTime() < 3600000).length;

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 32px" }}>

        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none",
          marginBottom: 28,
        }}>
          <ArrowLeft style={{ width: 15, height: 15 }} /> Home
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <h1 style={{ fontFamily: font, fontSize: 30, fontWeight: 900, color: "#000000",
              letterSpacing: "-0.02em", margin: 0 }}>
              Live Protocol Feed
            </h1>
            {/* LIVE badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "5px 12px", borderRadius: 99,
              background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.3)",
            }}>
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669" }}
              />
              <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700,
                letterSpacing: "0.1em", color: "#059669" }}>
                LIVE
              </span>
            </div>
          </div>
          <p style={{ fontFamily: font, fontSize: 14, color: "#6B6B6B", margin: "0 0 20px" }}>
            Every reactive rule firing across all vaults in real time
          </p>

          {/* Stat chips */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Total events", value: events.length, color: "#2563EB" },
              { label: "Rage quits",   value: rageQuits,     color: "#DC2626" },
              { label: "Payouts",      value: payouts,       color: "#059669" },
              { label: "Last hour",    value: newCount,      color: "#D97706" },
            ].map(s => (
              <div key={s.label} style={{
                padding: "10px 16px", borderRadius: 10,
                background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
                display: "flex", flexDirection: "column", alignItems: "center",
              }}>
                <div style={{ fontFamily: font, fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: "-0.02em" }}>
                  {s.value}
                </div>
                <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {FILTERS.map(f => {
            const isActive = filter === f.key;
            const em = f.key !== "all" ? EVENT_META[f.key] : null;
            const count = f.key === "all" ? events.length : events.filter(e => e.event_type === f.key).length;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                fontFamily: font, letterSpacing: "0.04em", cursor: "pointer",
                background: isActive ? (em?.color ?? "#000000") : "transparent",
                color: isActive ? "#FFFFFF" : (em?.color ?? "#444444"),
                border: `1px solid ${isActive ? (em?.color ?? "#000000") : "rgba(0,0,0,0.15)"}`,
                transition: "all 0.15s",
              }}>
                {f.label}
                <span style={{
                  fontFamily: font, fontSize: 10, fontWeight: 700,
                  padding: "1px 5px", borderRadius: 4,
                  background: isActive ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)",
                  color: isActive ? "#FFFFFF" : "#6B6B6B",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>
            <Radio style={{ width: 12, height: 12 }} />
            refreshes every 4s
          </div>
        </div>

        {/* Feed */}
        <motion.div
          layout
          style={{
            borderRadius: 16, overflow: "hidden",
            background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px",
                background: "rgba(0,0,0,0.04)", border: "1px dashed rgba(0,0,0,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Radio style={{ width: 18, height: 18, color: "#CCCCCC" }} />
              </div>
              <div style={{ fontFamily: font, fontSize: 13, color: "#BBBBBB", lineHeight: 1.6 }}>
                No events yet.<br />Join or quit a vault to see rules fire here.
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map(ev => {
                const vaultId = (ev.payload as Record<string, unknown>)?.vault_id as string | undefined;
                const vault   = vaultId ? vaultMap[vaultId] : undefined;
                return (
                  <FeedEntry
                    key={ev.id}
                    ev={ev}
                    vaultName={vault?.name}
                    vaultId={vaultId}
                    isNew={newIds.has(ev.id)}
                  />
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>

      </div>
    </div>
  );
}
