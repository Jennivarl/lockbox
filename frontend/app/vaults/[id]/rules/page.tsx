"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft, Zap, UserX, DollarSign, Users, TrendingUp,
  PiggyBank, Dumbbell, Building2, Lock, Trophy, Target,
} from "lucide-react";
import Nav from "@/components/Nav";
import { Badge } from "@/components/Badge";
import { api } from "@/lib/api";
import type { Vault } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';

const TYPE_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  savings:        { icon: PiggyBank, color: "#059669", label: "Savings"        },
  accountability: { icon: Target,    color: "#7C3AED", label: "Accountability" },
  dao:            { icon: Building2, color: "#2563EB", label: "DAO"            },
  vesting:        { icon: Lock,      color: "#D97706", label: "Vesting"        },
};

function getVaultIcon(name: string, type: string): React.ElementType {
  if (type !== "accountability") return TYPE_META[type]?.icon ?? Lock;
  const n = name.toLowerCase();
  if (/world cup|cup final|soccer|football/.test(n)) return Trophy;
  if (/gym|run|workout|fitness|sport/.test(n)) return Dumbbell;
  return Target;
}

function timeLeft(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3_600_000);
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
}

function RuleCard({
  index, trigger, triggerSub, action, description, formula, color, icon: Icon, delay,
}: {
  index: number; trigger: string; triggerSub?: string; action: string;
  description: string; formula?: string; color: string; icon: React.ElementType; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        borderRadius: 16, padding: "24px",
        background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
        borderTop: `3px solid ${color}`,
        display: "flex", flexDirection: "column", gap: 0,
      }}
    >
      {/* Rule number */}
      <div style={{ fontFamily: font, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "#BBBBBB", marginBottom: 14 }}>
        Rule {String(index).padStart(2, "0")}
      </div>

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 16,
        background: `${color}12`, border: `1.5px solid ${color}28`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 20, height: 20, color }} strokeWidth={1.8} />
      </div>

      {/* Trigger */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#9B9B9B", marginBottom: 3 }}>TRIGGER</div>
        <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#7C3AED" }}>
          ON <span style={{ color: "#000000" }}>{trigger}</span>
        </div>
        {triggerSub && (
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>{triggerSub}</div>
        )}
      </div>

      {/* Arrow */}
      <div style={{ fontFamily: "monospace", fontSize: 18, color: color, marginBottom: 10, lineHeight: 1 }}>→</div>

      {/* Action */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#9B9B9B", marginBottom: 3 }}>ACTION</div>
        <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color }}>
          {action}
        </div>
      </div>

      {/* Description */}
      <p style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", lineHeight: 1.7, margin: "0 0 14px", flex: 1 }}>
        {description}
      </p>

      {/* Formula */}
      {formula && (
        <div style={{
          borderRadius: 8, padding: "10px 14px",
          background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.07)",
          fontFamily: "monospace", fontSize: 11, color: "#374151", lineHeight: 1.8,
        }}>
          {formula}
        </div>
      )}
    </motion.div>
  );
}

export default function VaultRulesPage() {
  const { id } = useParams<{ id: string }>();
  const [vault, setVault] = useState<Vault | null>(null);

  useEffect(() => {
    api.vault(id).then(setVault).catch(() => null);
  }, [id]);

  if (!vault) return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ textAlign: "center", padding: "80px 0", fontFamily: font, color: "#9B9B9B" }}>Loading…</div>
    </div>
  );

  const meta       = TYPE_META[vault.type] ?? TYPE_META.vesting;
  const TypeIcon   = getVaultIcon(vault.name, vault.type);
  const basePct    = vault.penalty_pct;
  const maxPct     = Math.min(basePct * 2, 95);
  const penaltyAmt = Math.round(vault.buy_in * basePct / 100);
  const refund     = vault.buy_in - penaltyAmt;
  const active     = vault.members.filter(m => m.status === "active");

  const rules = [
    {
      trigger: "rage_quit",
      triggerSub: "when any member exits before deadline",
      action: "SLASH + REDISTRIBUTE",
      description: `The quitting member forfeits ${basePct}–${maxPct}% of their locked RIAO. The penalty is immediately redistributed equally among all remaining active members, increasing their expected payout.`,
      formula: `penalty   = locked × ${basePct}% → ${maxPct}% (escalates over time)\nrefund    = locked − penalty\nper_peer  = penalty ÷ remaining_members`,
      color: "#DC2626",
      icon: UserX,
    },
    {
      trigger: "deadline_reached",
      triggerSub: "when vault deadline timestamp passes",
      action: "RELEASE payout",
      description: `Every member who held the line receives their original stake back plus an equal share of all accumulated penalties from any rage quits that occurred during the vault's lifetime.`,
      formula: `survivor_payout = buy_in + (total_penalties ÷ survivor_count)\nall locked funds → released to survivors`,
      color: "#059669",
      icon: DollarSign,
    },
    {
      trigger: "member_joined",
      triggerSub: `when ${vault.max_members}/${vault.max_members} slots are filled`,
      action: "ACTIVATE vault",
      description: `Once the vault reaches its required member count, it automatically transitions from "filling" to "active" status. The lock-in period begins and the penalty escalator starts running.`,
      formula: `if members.active == max_members:\n  vault.status → "active"\n  escalator.start()`,
      color: "#2563EB",
      icon: Users,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "36px 32px" }}>

        {/* Back nav */}
        <Link href={`/vaults/${id}`} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none",
          marginBottom: 28,
        }}>
          <ArrowLeft style={{ width: 15, height: 15 }} /> Back to vault
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          style={{
            borderRadius: 16, padding: "28px 30px", marginBottom: 32,
            background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
            borderLeft: `4px solid ${meta.color}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 13,
                background: `${meta.color}12`, border: `1.5px solid ${meta.color}28`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <TypeIcon style={{ width: 22, height: 22, color: meta.color }} strokeWidth={1.7} />
              </div>
              <div>
                <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: meta.color, marginBottom: 4 }}>
                  {meta.label} · Protocol Rules
                </div>
                <h1 style={{ fontFamily: font, fontSize: 22, fontWeight: 900, color: "#000000",
                  letterSpacing: "-0.02em", margin: 0 }}>
                  {vault.name}
                </h1>
              </div>
            </div>
            <Badge variant={({ filling: "info", active: "success", completed: "default", dead: "danger" } as Record<string, "default" | "success" | "warning" | "info" | "danger">)[vault.status] ?? "default"}>
              {vault.status}
            </Badge>
          </div>

          {/* Parameter chips */}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: "Buy-in",    value: `${vault.buy_in.toLocaleString()} RIAO` },
              { label: "Members",   value: `${active.length}/${vault.max_members}` },
              { label: "Deadline",  value: timeLeft(vault.deadline) },
              { label: "Base penalty", value: `${basePct}%` },
              { label: "Max penalty",  value: `${maxPct}%` },
            ].map(p => (
              <div key={p.label} style={{
                padding: "7px 14px", borderRadius: 8,
                background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.08)",
              }}>
                <span style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>{p.label}: </span>
                <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: "#000000" }}>{p.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rule cards */}
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#9B9B9B", marginBottom: 16 }}>
            Reactive Rules — powered by Rialo
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 28 }}>
          {rules.map((r, i) => (
            <RuleCard key={r.trigger} index={i + 1} {...r} delay={i * 0.08} />
          ))}
        </div>

        {/* Escalator detail */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            borderRadius: 16, padding: "28px 30px", marginBottom: 20,
            background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TrendingUp style={{ width: 16, height: 16, color: "#DC2626" }} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#9B9B9B", marginBottom: 2 }}>
                Penalty Escalator
              </div>
              <div style={{ fontFamily: font, fontSize: 15, fontWeight: 900, color: "#000000" }}>
                The longer you wait, the more you lose
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <p style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", lineHeight: 1.75, margin: "0 0 18px" }}>
                The quit penalty is not fixed — it scales linearly from the base rate at vault activation up to twice the base rate at the deadline. This creates compounding commitment: the more time you have invested, the more it costs to abandon the group.
              </p>
              <div style={{
                borderRadius: 10, padding: "14px 16px",
                background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.08)",
                fontFamily: "monospace", fontSize: 12, lineHeight: 2,
              }}>
                <div><span style={{ color: "#7C3AED" }}>ratio</span>  = (now − start) / (deadline − start)</div>
                <div><span style={{ color: "#DC2626" }}>penalty</span> = base × (1 + ratio)</div>
                <div><span style={{ color: "#9B9B9B" }}>capped</span>  = min(penalty, 95%)</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "At vault activation (day 0)", pct: basePct, note: "base rate" },
                { label: "At 50% through vault lifetime", pct: Math.min(Math.round(basePct * 1.5), 95), note: "midpoint" },
                { label: "At deadline (day N)", pct: maxPct, note: "maximum" },
              ].map((s, i) => (
                <div key={i} style={{
                  borderRadius: 10, padding: "14px 16px",
                  background: i === 2 ? "rgba(220,38,38,0.05)" : "#EDF0F5",
                  border: i === 2 ? "1px solid rgba(220,38,38,0.18)" : "1px solid rgba(0,0,0,0.08)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B" }}>{s.label}</div>
                    <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginTop: 2 }}>{s.note}</div>
                  </div>
                  <div style={{ fontFamily: font, fontSize: 22, fontWeight: 900,
                    color: i === 2 ? "#DC2626" : "#000000", letterSpacing: "-0.02em" }}>
                    {s.pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Redistribution detail */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.4 }}
          style={{
            borderRadius: 16, padding: "28px 30px",
            background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap style={{ width: 16, height: 16, color: "#2563EB" }} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#9B9B9B", marginBottom: 2 }}>
                Redistribution Logic
              </div>
              <div style={{ fontFamily: font, fontSize: 15, fontWeight: 900, color: "#000000" }}>
                Quitters pay survivors — automatically
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              {
                step: "01", label: "Member quits",
                detail: `Penalty deducted from ${vault.buy_in.toLocaleString()} RIAO stake`,
                value: `−${penaltyAmt.toLocaleString()} RIAO`,
                color: "#DC2626",
              },
              {
                step: "02", label: "Penalty collected",
                detail: "Held in vault until redistributed or deadline",
                value: `${penaltyAmt.toLocaleString()} RIAO pooled`,
                color: "#D97706",
              },
              {
                step: "03", label: "Split to survivors",
                detail: `Divided equally among all remaining active members`,
                value: active.length > 1
                  ? `+${Math.round(penaltyAmt / (active.length - 1)).toLocaleString()} RIAO each`
                  : "All to last survivor",
                color: "#059669",
              },
            ].map(s => (
              <div key={s.step} style={{
                borderRadius: 12, padding: "18px",
                background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.08)",
              }}>
                <div style={{ fontFamily: font, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "#BBBBBB", marginBottom: 10 }}>
                  Step {s.step}
                </div>
                <div style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000000", marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B", marginBottom: 12, lineHeight: 1.6 }}>
                  {s.detail}
                </div>
                <div style={{ fontFamily: font, fontSize: 15, fontWeight: 900, color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
