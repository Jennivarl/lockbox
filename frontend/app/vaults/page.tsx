"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { PiggyBank, Dumbbell, Building2, Lock, ArrowLeft, Trophy, Target, Plus, ArrowRight } from "lucide-react";
import Nav from "@/components/Nav";
import { Badge } from "@/components/Badge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import type { Vault } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';

const STATUS_VARIANT: Record<string, "info" | "success" | "default" | "danger"> = {
  filling: "info", active: "success", completed: "default", dead: "danger",
};

const TYPE_META: Record<string, {
  icon: React.ElementType; color: string; bg: string; label: string;
  tagline: string; description: string;
}> = {
  savings: {
    icon: PiggyBank, color: "#059669", bg: "rgba(5,150,105,0.08)", label: "Savings",
    tagline: "Commit to your goals",
    description: "Group savings with real skin in the game. Lock RIAO together and hold until the target date. Walk early and your stake goes to everyone who stayed.",
  },
  accountability: {
    icon: Target, color: "#7C3AED", bg: "rgba(124,58,237,0.08)", label: "Accountability",
    tagline: "Skin in the game",
    description: "Public commitments backed by locked funds. Miss your mark or walk away and pay the group. Succeed together and claim the full pot.",
  },
  dao: {
    icon: Building2, color: "#2563EB", bg: "rgba(37,99,235,0.08)", label: "DAO",
    tagline: "Align contributors",
    description: "Collective governance locks that align contributor incentives with protocol outcomes. Quit before the vote and forfeit to those who stayed accountable.",
  },
  vesting: {
    icon: Lock, color: "#D97706", bg: "rgba(217,119,6,0.08)", label: "Vesting",
    tagline: "Founder commitment pacts",
    description: "Founders and core team lock RIAO as a public vesting signal. Leave before the cliff and forfeit your stake to the teammates who held the line.",
  },
};

const STATUS_FILTERS = ["filling", "active", "completed", "dead"] as const;

function getVaultIcon(name: string, type: string): React.ElementType {
  if (type !== "accountability") return TYPE_META[type]?.icon ?? Lock;
  const n = name.toLowerCase();
  if (/world cup|cup final|prediction pact|soccer|football/.test(n)) return Trophy;
  if (/gym|run|workout|fitness|sport|push.?up/.test(n)) return Dumbbell;
  return Target;
}

function useCountdown(deadline: string) {
  const calc = () => {
    const ms = new Date(deadline).getTime() - Date.now();
    if (ms <= 0) return { label: "Ended", color: "#9B9B9B" };
    const totalSec = Math.floor(ms / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    let label = "";
    if (d > 0) label = `${d}d ${h}h`;
    else if (h > 0) label = `${h}h ${m}m`;
    else label = `${m}m ${s}s`;
    const color = d >= 7 ? "#6B6B6B" : d >= 1 ? "#D97706" : "#DC2626";
    return { label, color };
  };
  const [tick, setTick] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTick(calc()), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);
  return tick;
}

function MemberSlots({ filled, total, color }: { filled: number; total: number; color: string }) {
  const display = Math.min(total, 10);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>
          <span style={{ color: "#000000", fontWeight: 900 }}>{filled}</span>/{total} members locked in
        </span>
        <span style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>
          {total - filled} slot{total - filled !== 1 ? "s" : ""} open
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: display }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
            style={{
              flex: 1, height: 6, borderRadius: 3,
              background: i < filled ? color : "rgba(0,0,0,0.1)",
              transformOrigin: "bottom",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function VaultCard({ v, index }: { v: Vault; index: number }) {
  const active   = v.members.filter(m => m.status === "active");
  const quits    = v.members.filter(m => m.status === "quit");
  const meta     = TYPE_META[v.type] ?? TYPE_META.vesting;
  const TypeIcon = getVaultIcon(v.name, v.type);
  const { label: timeLabel, color: timeColor } = useCountdown(v.deadline);

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

        {/* Member slots */}
        <div style={{ marginBottom: 16 }}>
          <MemberSlots filled={active.length} total={v.max_members} color={meta.color} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: font, fontSize: 11 }}>
          {/* Live countdown */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 6,
            background: `${timeColor}12`, border: `1px solid ${timeColor}30`,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: timeColor, flexShrink: 0 }} />
            <span style={{ color: timeColor, fontWeight: 700, letterSpacing: "0.04em" }}>{timeLabel}</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {quits.length > 0 && (
              <span style={{ color: "#DC2626", fontWeight: 700 }}>{quits.length} quit</span>
            )}
            <span style={{
              padding: "3px 8px", borderRadius: 5,
              background: `${meta.color}15`, color: meta.color, fontWeight: 700,
            }}>
              {v.penalty_pct}% slash
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function CategoryCard({
  typeKey, meta, count, locked, index, onClick,
}: {
  typeKey: string;
  meta: typeof TYPE_META[string];
  count: number;
  locked: number;
  index: number;
  onClick: () => void;
}) {
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      whileHover={{ y: -6, boxShadow: `0 16px 48px ${meta.color}28` }}
      onClick={onClick}
      style={{
        borderRadius: 20, padding: "36px 30px",
        background: "#EDF0F5",
        border: `1px solid rgba(0,0,0,0.08)`,
        borderTop: `4px solid ${meta.color}`,
        cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 0,
        transition: "box-shadow 0.2s, transform 0.2s",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Subtle tinted background quadrant */}
      <div style={{
        position: "absolute", bottom: -40, right: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: meta.color, opacity: 0.05,
        pointerEvents: "none",
      }} />

      {/* Icon */}
      <div style={{
        width: 56, height: 56, borderRadius: 16, marginBottom: 22,
        background: `${meta.color}15`, border: `1.5px solid ${meta.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon style={{ width: 26, height: 26, color: meta.color }} strokeWidth={1.7} />
      </div>

      {/* Label + tagline */}
      <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: meta.color, marginBottom: 8 }}>
        {meta.label}
      </div>
      <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 900, color: "#000000",
        letterSpacing: "-0.02em", marginBottom: 12, lineHeight: 1.2 }}>
        {meta.tagline}
      </h2>
      <p style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", lineHeight: 1.7, marginBottom: 28, flex: 1 }}>
        {meta.description}
      </p>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: font, fontSize: 20, fontWeight: 900, color: "#000000", letterSpacing: "-0.02em" }}>
            {count}
          </div>
          <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", letterSpacing: "0.04em" }}>
            VAULTS
          </div>
        </div>
        <div style={{ width: 1, background: "rgba(0,0,0,0.08)" }} />
        <div>
          <div style={{ fontFamily: font, fontSize: 20, fontWeight: 900, color: "#000000", letterSpacing: "-0.02em" }}>
            {locked > 0 ? `${(locked / 1000).toFixed(0)}k` : "0"}
          </div>
          <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", letterSpacing: "0.04em" }}>
            RIAO LOCKED
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        fontFamily: font, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
        color: meta.color,
      }}>
        Explore vaults <ArrowRight style={{ width: 14, height: 14 }} />
      </div>
    </motion.div>
  );
}

function VaultsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { authenticated, login } = useAuth();
  const [vaults,       setVaults]       = useState<Vault[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const typeParam = params.get("type") ?? "";
  const activeType = Object.keys(TYPE_META).includes(typeParam) ? typeParam : "";

  useEffect(() => {
    api.vaults().then(v => { setVaults(v); setLoading(false); }).catch(() => setLoading(false));
    const t = setInterval(() => api.vaults().then(setVaults).catch(() => null), 5000);
    return () => clearInterval(t);
  }, []);

  const setType = (t: string) => {
    const url = t ? `/vaults?type=${t}` : "/vaults";
    router.push(url);
    setStatusFilter("all");
  };

  const typeMeta = activeType ? TYPE_META[activeType] : null;

  const filteredByType = activeType ? vaults.filter(v => v.type === activeType) : vaults;
  const filtered = filteredByType.filter(v =>
    statusFilter === "all" || v.status === statusFilter
  );

  const totalLocked = vaults.reduce((s, v) => s + v.pot_total, 0);
  const totalOpen   = vaults.filter(v => v.status === "active" || v.status === "filling").length;

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 32px" }}>

        {/* Back nav */}
        {activeType ? (
          <button onClick={() => setType("")} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: font, fontSize: 13, color: "#6B6B6B",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            marginBottom: 28,
          }}>
            <ArrowLeft style={{ width: 15, height: 15 }} /> All Categories
          </button>
        ) : (
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none",
            marginBottom: 28,
          }}>
            <ArrowLeft style={{ width: 15, height: 15 }} /> Home
          </Link>
        )}

        {/* ── CATEGORIES HUB ─────────────────────────────────────────── */}
        {!activeType && (
          <>
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 6 }}>
                <h1 style={{ fontFamily: font, fontSize: 32, fontWeight: 900, color: "#000000",
                  letterSpacing: "-0.02em", margin: 0 }}>
                  Vault Categories
                </h1>
                <button onClick={() => authenticated ? router.push("/vaults/new") : login()} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  fontFamily: font, letterSpacing: "0.06em", textTransform: "uppercase",
                  background: "transparent", color: "#000000",
                  border: "1px solid rgba(0,0,0,0.3)", cursor: "pointer",
                }}>
                  <Plus style={{ width: 13, height: 13 }} /> Create Vault
                </button>
              </div>
              <p style={{ fontFamily: font, fontSize: 14, color: "#6B6B6B", margin: 0 }}>
                {totalOpen} open vaults · {totalLocked.toLocaleString()} RIAO at stake
              </p>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "80px 0", fontFamily: font, color: "#9B9B9B" }}>Loading…</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
                {Object.entries(TYPE_META).map(([key, meta], i) => {
                  const typeVaults = vaults.filter(v => v.type === key);
                  const typeLocked = typeVaults.reduce((s, v) => s + v.pot_total, 0);
                  return (
                    <CategoryCard
                      key={key}
                      typeKey={key}
                      meta={meta}
                      count={typeVaults.length}
                      locked={typeLocked}
                      index={i}
                      onClick={() => setType(key)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── FILTERED VAULT GRID ────────────────────────────────────── */}
        {activeType && typeMeta && (
          <>
            {/* Category header */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                borderRadius: 16, padding: "28px 30px", marginBottom: 28,
                background: "#EDF0F5", border: `1px solid rgba(0,0,0,0.08)`,
                borderLeft: `4px solid ${typeMeta.color}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${typeMeta.color}15`, border: `1.5px solid ${typeMeta.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <typeMeta.icon style={{ width: 22, height: 22, color: typeMeta.color }} strokeWidth={1.7} />
                </div>
                <div>
                  <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: typeMeta.color, marginBottom: 4 }}>
                    {typeMeta.label}
                  </div>
                  <h1 style={{ fontFamily: font, fontSize: 24, fontWeight: 900, color: "#000000",
                    letterSpacing: "-0.02em", margin: 0 }}>
                    {typeMeta.tagline}
                  </h1>
                </div>
              </div>
              <button onClick={() => authenticated ? router.push("/vaults/new") : login()} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                fontFamily: font, letterSpacing: "0.05em", textTransform: "uppercase",
                background: "transparent", color: "#000000",
                border: "1px solid rgba(0,0,0,0.3)", cursor: "pointer", flexShrink: 0,
              }}>
                <Plus style={{ width: 13, height: 13 }} /> Create Vault
              </button>
            </motion.div>

            {/* Status filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {["all", ...STATUS_FILTERS].map(f => {
                const isActive = statusFilter === f;
                return (
                  <button key={f} onClick={() => setStatusFilter(f)} style={{
                    padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                    fontFamily: font, letterSpacing: "0.05em", textTransform: "capitalize",
                    cursor: "pointer",
                    background: isActive ? "#000000" : "transparent",
                    color: isActive ? "#FFFFFF" : "#6B6B6B",
                    border: isActive ? "1px solid #000000" : "1px solid rgba(0,0,0,0.15)",
                    transition: "all 0.15s",
                  }}>
                    {f === "all" ? "All" : f}
                  </button>
                );
              })}
              <div style={{ marginLeft: "auto", fontFamily: font, fontSize: 13, color: "#6B6B6B",
                display: "flex", alignItems: "center" }}>
                {filtered.length} vault{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "80px 0", fontFamily: font, color: "#9B9B9B" }}>Loading…</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
                {filtered.map((v, i) => <VaultCard key={v.id} v={v} index={i} />)}
                {filtered.length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", fontFamily: font, color: "#9B9B9B" }}>
                    No {typeMeta.label.toLowerCase()} vaults found.{" "}
                    <button onClick={() => authenticated ? router.push("/vaults/new") : login()}
                      style={{ background: "none", border: "none", fontFamily: font, fontSize: 14,
                        color: "#000000", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
                      Create one →
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default function VaultsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
        <Nav />
        <div style={{ textAlign: "center", padding: "80px 0", fontFamily: '"Space Mono", monospace', color: "#9B9B9B" }}>
          Loading…
        </div>
      </div>
    }>
      <VaultsInner />
    </Suspense>
  );
}
