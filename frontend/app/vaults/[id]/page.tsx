"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, UserX, CheckCircle2, UserPlus, Check, X, PiggyBank, Dumbbell, Building2, Lock, FastForward, Trophy, Target, Send, Copy, CheckCheck, TrendingUp, Zap, DollarSign, Clock, Bell } from "lucide-react";
import Nav from "@/components/Nav";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Avatar } from "@/components/Avatar";
import { ProgressBar } from "@/components/ProgressBar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { useBalance } from "@/lib/useBalance";
import { useProfile } from "@/lib/useProfile";
import type { Vault, Member, ReactiveEvent, Invite, Message } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';

const STATUS_VARIANT: Record<string, "info" | "success" | "default" | "danger"> = {
  filling: "info", active: "success", completed: "default", dead: "danger",
};

const EVENT_META: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  notification: { color: "#2563EB", icon: Bell,         label: "Event"     },
  announcement: { color: "#7C3AED", icon: Zap,          label: "Rule fired" },
  rage_quit:    { color: "#DC2626", icon: UserX,        label: "Rage quit" },
  payout:       { color: "#059669", icon: DollarSign,   label: "Payout"    },
  warning:      { color: "#D97706", icon: Clock,        label: "Warning"   },
};

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  savings:        { icon: PiggyBank, color: "#059669", bg: "rgba(5,150,105,0.07)"  },
  accountability: { icon: Target,    color: "#7C3AED", bg: "rgba(124,58,237,0.07)" },
  dao:            { icon: Building2, color: "#2563EB", bg: "rgba(37,99,235,0.07)"  },
  vesting:        { icon: Lock,      color: "#D97706", bg: "rgba(217,119,6,0.07)"  },
};

function getVaultIcon(name: string, type: string): React.ElementType {
  if (type !== "accountability") return TYPE_META[type]?.icon ?? Lock;
  const n = name.toLowerCase();
  if (/world cup|cup final|prediction pact|soccer|football/.test(n)) return Trophy;
  if (/gym|run|workout|fitness|sport|push.?up/.test(n)) return Dumbbell;
  return Target;
}

function timeLeft(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m left`;
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d ${h % 24}h left`;
}

function MemberRow({ m, canQuit, onQuit, peerId, accentColor }: {
  m: Member; canQuit: boolean; onQuit: () => void; peerId: string; accentColor: string;
}) {
  const isMe = m.peer_id === peerId;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
      borderRadius: 10, marginBottom: 8,
      background: isMe ? `${accentColor}08` : "#FFFFFF",
      border: isMe ? `1px solid ${accentColor}30` : "1px solid rgba(0,0,0,0.08)",
    }}>
      <Avatar name={m.peer_name} size="sm" variant={m.status === "quit" ? "inactive" : "active"} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: m.status === "quit" ? "#9B9B9B" : "#000000" }}>
            {m.peer_name}
          </span>
          {isMe && <span style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B" }}>(you)</span>}
          {m.status === "quit" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: font, fontSize: 11, color: "#DC2626" }}>
              <UserX style={{ width: 11, height: 11 }} /> quit
            </span>
          )}
          {m.status === "paid" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: font, fontSize: 11, color: "#059669" }}>
              <CheckCircle2 style={{ width: 11, height: 11 }} /> paid
            </span>
          )}
        </div>
        <div style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>
          {m.amount_locked.toLocaleString()} RIAO locked
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: font, fontSize: 16, fontWeight: 900,
          color: m.status === "quit" ? "#9B9B9B" : accentColor, letterSpacing: "-0.01em" }}>
          {m.amount_expected.toLocaleString()}
        </div>
        <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>
          {m.status === "quit" ? "refunded" : "expected"} RIAO
        </div>
      </div>
      {canQuit && isMe && m.status === "active" && (
        <Button variant="danger" size="sm" onClick={onQuit}>
          <UserX style={{ width: 13, height: 13 }} /> Quit
        </Button>
      )}
    </div>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function TimelineEntry({ ev, isNew, isLast }: { ev: ReactiveEvent; isNew: boolean; isLast: boolean }) {
  const em = EVENT_META[ev.event_type] ?? EVENT_META.notification;
  const Icon = em.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex", gap: 14, alignItems: "flex-start",
        padding: "14px 18px",
        background: isNew ? `${em.color}06` : "transparent",
        transition: "background 1.5s ease",
        position: "relative",
      }}
    >
      {/* Vertical connecting line */}
      {!isLast && (
        <div style={{
          position: "absolute", left: 29, top: 42, bottom: 0,
          width: 1, background: "rgba(0,0,0,0.07)",
        }} />
      )}

      {/* Icon node */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: `${em.color}12`, border: `1.5px solid ${em.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", zIndex: 1,
      }}>
        <Icon style={{ width: 13, height: 13, color: em.color }} strokeWidth={2} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: font, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: em.color,
            padding: "2px 6px", borderRadius: 4, background: `${em.color}12`,
          }}>
            {em.label}
          </span>
          {ev.rule_name && ev.rule_name !== ev.event_type && (
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#9B9B9B" }}>
              {ev.rule_name}
            </span>
          )}
        </div>
        <div style={{ fontFamily: font, fontSize: 12, color: "#374151", lineHeight: 1.55 }}>
          {ev.summary}
        </div>
      </div>

      {/* Timestamp */}
      <div style={{ fontFamily: font, fontSize: 10, color: "#BBBBBB", flexShrink: 0, marginTop: 1 }}
        title={new Date(ev.fired_at).toLocaleString()}>
        {relativeTime(ev.fired_at)}
      </div>
    </motion.div>
  );
}

function RequestRow({ invite, onAccept, onReject, accentColor }: {
  invite: Invite; onAccept: () => void; onReject: () => void; accentColor: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderRadius: 8, marginBottom: 6,
      background: `${accentColor}06`, border: `1px solid ${accentColor}25`,
    }}>
      <Avatar name={invite.peer_name} size="sm" variant="active" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: "#000000" }}>{invite.peer_name}</div>
        <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginTop: 1 }}>wants to join</div>
      </div>
      <button onClick={onAccept} style={{
        display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px",
        borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: font,
        background: accentColor, color: "#FFFFFF", border: "none", cursor: "pointer",
      }}>
        <Check style={{ width: 11, height: 11 }} /> Accept
      </button>
      <button onClick={onReject} style={{
        display: "inline-flex", alignItems: "center", padding: "6px 10px",
        borderRadius: 6, fontSize: 11, fontFamily: font,
        background: "transparent", color: "#9B9B9B",
        border: "1px solid rgba(0,0,0,0.12)", cursor: "pointer",
      }}>
        <X style={{ width: 11, height: 11 }} />
      </button>
    </div>
  );
}

function LockInModal({ vault, balance, onConfirm, onCancel, accentColor }: {
  vault: Vault; balance: number; onConfirm: () => void; onCancel: () => void; accentColor: string;
}) {
  const after = balance - vault.buy_in;
  const insufficient = balance < vault.buy_in;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
    }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
        style={{
          background: "#FFFFFF", borderRadius: 18, padding: "32px 32px 28px",
          width: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          border: `2px solid ${accentColor}30`,
        }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11, background: `${accentColor}12`,
            border: `1px solid ${accentColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Lock style={{ width: 19, height: 19, color: accentColor }} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontFamily: font, fontSize: 15, fontWeight: 900, color: "#000000", letterSpacing: "-0.01em" }}>
              Lock into vault
            </div>
            <div style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
              {vault.name}
            </div>
          </div>
        </div>

        <div style={{ borderRadius: 12, background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.08)", padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B" }}>Amount to lock</span>
            <span style={{ fontFamily: font, fontSize: 18, fontWeight: 900, color: accentColor, letterSpacing: "-0.02em" }}>
              {vault.buy_in.toLocaleString()} RIAO
            </span>
          </div>
          <div style={{ height: 1, background: "rgba(0,0,0,0.07)", marginBottom: 12 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B" }}>Your balance</span>
            <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: "#000000" }}>
              {balance.toLocaleString()} RIAO
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B" }}>After locking</span>
            <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: insufficient ? "#DC2626" : "#059669" }}>
              {after.toLocaleString()} RIAO
            </span>
          </div>
        </div>

        {insufficient && (
          <div style={{ borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)",
            fontFamily: font, fontSize: 12, color: "#DC2626" }}>
            Insufficient balance — you need {vault.buy_in.toLocaleString()} RIAO to join.
          </div>
        )}

        <div style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B", marginBottom: 20, lineHeight: 1.6 }}>
          Quit before deadline? You forfeit <strong style={{ color: "#DC2626" }}>{vault.penalty_pct}%</strong> ({Math.round(vault.buy_in * vault.penalty_pct / 100).toLocaleString()} RIAO) to survivors. Penalty escalates up to <strong style={{ color: "#DC2626" }}>{Math.min(vault.penalty_pct * 2, 95)}%</strong> the longer you wait.
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px 0", borderRadius: 10,
            fontFamily: font, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
            background: "transparent", color: "#6B6B6B",
            border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={insufficient} style={{
            flex: 2, padding: "12px 0", borderRadius: 10,
            fontFamily: font, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
            background: insufficient ? "#CCCCCC" : accentColor, color: "#FFFFFF",
            border: "none", cursor: insufficient ? "not-allowed" : "pointer",
          }}>
            Lock In — {vault.buy_in.toLocaleString()} RIAO
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function QuitConfirmModal({ vault, lockedAmount, effectivePenalty, remainingCount, accentColor, onConfirm, onCancel }: {
  vault: Vault; lockedAmount: number; effectivePenalty: number; remainingCount: number;
  accentColor: string; onConfirm: () => void; onCancel: () => void;
}) {
  const penaltyAmt   = Math.round(lockedAmount * effectivePenalty / 100);
  const refund       = lockedAmount - penaltyAmt;
  const perMember    = remainingCount > 0 ? Math.round(penaltyAmt / remainingCount) : 0;
  const isEscalated  = effectivePenalty > vault.penalty_pct;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
    }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
        style={{
          background: "#FFFFFF", borderRadius: 20, padding: "30px 30px 24px",
          width: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
          border: "2px solid rgba(220,38,38,0.2)",
        }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <UserX style={{ width: 19, height: 19, color: "#DC2626" }} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontFamily: font, fontSize: 15, fontWeight: 900, color: "#000000" }}>Quit vault?</div>
            <div style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{vault.name}</div>
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ borderRadius: 12, background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.08)", padding: "18px 20px", marginBottom: 16 }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B" }}>Your locked stake</span>
            <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: "#000000" }}>
              {lockedAmount.toLocaleString()} RIAO
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontFamily: font, fontSize: 12, color: "#DC2626" }}>
              Penalty ({effectivePenalty}%{isEscalated ? " — escalated" : ""})
            </span>
            <span style={{ fontFamily: font, fontSize: 14, fontWeight: 900, color: "#DC2626" }}>
              −{penaltyAmt.toLocaleString()} RIAO
            </span>
          </div>

          {isEscalated && (
            <div style={{ fontFamily: font, fontSize: 10, color: "#D97706", marginBottom: 8 }}>
              Base was {vault.penalty_pct}% — escalated +{effectivePenalty - vault.penalty_pct}% over time
            </div>
          )}

          <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "12px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B" }}>You walk away with</span>
            <span style={{ fontFamily: font, fontSize: 18, fontWeight: 900, color: "#059669", letterSpacing: "-0.02em" }}>
              {refund.toLocaleString()} RIAO
            </span>
          </div>

          {remainingCount > 0 && (
            <div style={{
              borderRadius: 8, padding: "10px 14px",
              background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)",
            }}>
              <div style={{ fontFamily: font, fontSize: 11, color: "#DC2626", marginBottom: 4 }}>
                Your {penaltyAmt.toLocaleString()} RIAO penalty is split between {remainingCount} remaining member{remainingCount !== 1 ? "s" : ""}
              </div>
              <div style={{ fontFamily: font, fontSize: 13, fontWeight: 900, color: "#DC2626" }}>
                +{perMember.toLocaleString()} RIAO each
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px 0", borderRadius: 10,
            fontFamily: font, fontSize: 13, fontWeight: 700,
            background: "transparent", color: "#6B6B6B",
            border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer",
          }}>
            Stay In
          </button>
          <button onClick={onConfirm} style={{
            flex: 2, padding: "12px 0", borderRadius: 10,
            fontFamily: font, fontSize: 13, fontWeight: 700, letterSpacing: "0.03em",
            background: "#DC2626", color: "#FFFFFF",
            border: "none", cursor: "pointer",
          }}>
            Confirm Quit — lose {penaltyAmt.toLocaleString()} RIAO
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PenaltyEscalatorChart({ vault, accentColor }: { vault: Vault; accentColor: string }) {
  const basePct = vault.penalty_pct;
  const maxPct  = Math.min(basePct * 2, 95);
  const isActive = vault.status === "active";

  const createdMs  = new Date(vault.created_at).getTime();
  const deadlineMs = new Date(vault.deadline).getTime();
  const nowMs      = Date.now();
  const ratio      = isActive
    ? Math.min(Math.max((nowMs - createdMs) / (deadlineMs - createdMs), 0), 1)
    : 0;
  const currentPct = Math.min(Math.round(basePct * (1 + ratio)), 95);

  // SVG layout
  const VW = 320, VH = 108;
  const PL = 44, PR = 16, PT = 14, PB = 28;
  const pw = VW - PL - PR;
  const ph = VH - PT - PB;

  const px = (r: number) => PL + r * pw;
  const py = (pct: number) => PT + ph - ((pct - basePct) / (maxPct - basePct)) * ph;

  // Curve: 40 points for smooth line
  const pts = Array.from({ length: 41 }, (_, i) => {
    const r = i / 40;
    return `${px(r).toFixed(1)},${py(Math.min(basePct * (1 + r), 95)).toFixed(1)}`;
  }).join(" ");

  const nowX  = px(ratio);
  const nowY  = py(currentPct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{
        borderRadius: 14, padding: "20px 20px 16px",
        background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#9B9B9B", marginBottom: 3 }}>
            Penalty Escalator
          </div>
          <div style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B" }}>
            The longer you wait to quit, the more you lose
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: font, fontSize: 22, fontWeight: 900, color: "#DC2626", letterSpacing: "-0.02em" }}>
            {currentPct}%
          </div>
          <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>
            {isActive ? "now" : "base"} penalty
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: VH, display: "block" }}>
        {/* Y-axis labels */}
        <text x={PL - 6} y={PT + 4} textAnchor="end" fontFamily="Space Mono, monospace" fontSize="9" fill="#9B9B9B">{maxPct}%</text>
        <text x={PL - 6} y={VH - PB + 4} textAnchor="end" fontFamily="Space Mono, monospace" fontSize="9" fill="#9B9B9B">{basePct}%</text>

        {/* Grid lines */}
        <line x1={PL} y1={PT} x2={PL + pw} y2={PT} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
        <line x1={PL} y1={VH - PB} x2={PL + pw} y2={VH - PB} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
        <line x1={PL} y1={PT} x2={PL} y2={VH - PB} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />

        {/* X-axis labels */}
        <text x={PL} y={VH - 4} textAnchor="start" fontFamily="Space Mono, monospace" fontSize="9" fill="#BBBBBB">Start</text>
        <text x={PL + pw} y={VH - 4} textAnchor="end" fontFamily="Space Mono, monospace" fontSize="9" fill="#BBBBBB">Deadline</text>

        {/* Filled area under curve */}
        <polygon
          points={`${px(0)},${VH - PB} ${pts} ${px(1)},${VH - PB}`}
          fill="#DC262610"
        />

        {/* Escalation curve */}
        <polyline points={pts} fill="none" stroke="#DC2626" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round"
          strokeOpacity={isActive ? 1 : 0.35}
        />

        {isActive && (
          <>
            {/* "YOU ARE HERE" vertical dashed line */}
            <line x1={nowX} y1={PT} x2={nowX} y2={VH - PB}
              stroke="#DC2626" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.5" />

            {/* Current position dot */}
            <circle cx={nowX} cy={nowY} r="5" fill="#DC2626" />
            <circle cx={nowX} cy={nowY} r="9" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeOpacity="0.3" />

            {/* "NOW" label — flip side if too close to right edge */}
            <text
              x={ratio > 0.78 ? nowX - 8 : nowX + 8}
              y={nowY - 10}
              textAnchor={ratio > 0.78 ? "end" : "start"}
              fontFamily="Space Mono, monospace" fontSize="9" fontWeight="700" fill="#DC2626"
            >
              NOW · {currentPct}%
            </text>
          </>
        )}

        {!isActive && (
          <text x={PL + pw / 2} y={PT + ph / 2 + 4} textAnchor="middle"
            fontFamily="Space Mono, monospace" fontSize="10" fill="#BBBBBB">
            Escalation begins when vault activates
          </text>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 2, background: "#DC2626", borderRadius: 1 }} />
          <span style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>
            {basePct}% → {maxPct}% over vault lifetime
          </span>
        </div>
        {isActive && (
          <span style={{ fontFamily: font, fontSize: 10, color: "#DC2626", fontWeight: 700 }}>
            +{currentPct - basePct}% escalated so far
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function VaultPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { authenticated, login, peerId, peerName } = useAuth();
  const { balance, deduct, add } = useBalance();
  const { profile } = useProfile();
  const displayName = profile.displayName || peerName;

  const [vault,       setVault]       = useState<Vault | null>(null);
  const [events,      setEvents]      = useState<ReactiveEvent[]>([]);
  const [requests,    setRequests]    = useState<Invite[]>([]);
  const [newIds,      setNewIds]      = useState<Set<string>>(new Set());
  const [flash,       setFlash]       = useState("");
  const [quitMsg,     setQuitMsg]     = useState("");
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [chatInput,   setChatInput]   = useState("");
  const [copied,      setCopied]      = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevIds = useRef<Set<string>>(new Set());

  const load = async () => {
    const [v, evs] = await Promise.all([api.vault(id), api.feed(20)]);
    setVault(v);
    const fresh = new Set(evs.map(e => e.id).filter(eid => !prevIds.current.has(eid)));
    if (fresh.size > 0) setNewIds(fresh);
    prevIds.current = new Set(evs.map(e => e.id));
    setEvents(evs.filter(e => { const p = e.payload as Record<string, unknown>; return p.vault_id === id; }));
    setTimeout(() => setNewIds(new Set()), 2500);
  };

  const loadRequests = async () => {
    try {
      const reqs = await api.getRequests(id);
      setRequests(reqs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
    loadMessages();
    const t = setInterval(load, 3000);
    const tm = setInterval(loadMessages, 5000);
    return () => { clearInterval(t); clearInterval(tm); };
  }, [id]);

  useEffect(() => {
    if (vault && authenticated && peerId === vault.creator_id) {
      loadRequests();
      const t = setInterval(loadRequests, 5000);
      return () => clearInterval(t);
    }
  }, [vault?.id, authenticated, peerId]);

  if (!vault) return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ textAlign: "center", padding: "80px 0", fontFamily: font, color: "#9B9B9B" }}>Loading…</div>
    </div>
  );

  const meta       = TYPE_META[vault.type] ?? TYPE_META.vesting;
  const TypeIcon   = getVaultIcon(vault.name, vault.type);
  const active     = vault.members.filter(m => m.status === "active");
  const progress   = Math.round((active.length / vault.max_members) * 100);
  const isMember   = vault.members.some(m => m.peer_id === peerId && m.status === "active");
  const isCreator  = peerId === vault.creator_id;
  const canJoin    = vault.status === "filling" && !isMember && authenticated && isCreator;
  const canRequest = vault.status === "filling" && !isMember && authenticated && !isCreator;
  const canQuit    = (vault.status === "filling" || vault.status === "active") && isMember;
  const canTrig    = vault.status === "filling" || vault.status === "active";

  // Escalated penalty: scales base → 2× base over vault lifetime
  const effectivePenalty = (() => {
    if (vault.status !== "active") return vault.penalty_pct;
    try {
      const dl = new Date(vault.deadline).getTime();
      const cr = new Date(vault.created_at).getTime();
      const ratio = Math.min(Math.max((Date.now() - cr) / (dl - cr), 0), 1);
      return Math.min(Math.round(vault.penalty_pct * (1 + ratio)), 95);
    } catch { return vault.penalty_pct; }
  })();

  const handleJoin = () => {
    if (!authenticated) { login(); return; }
    setShowConfirm(true);
  };

  const handleRequest = () => {
    if (!authenticated) { login(); return; }
    setShowConfirm(true);
  };

  const handleConfirmJoin = async () => {
    if (!vault) return;
    setShowConfirm(false);
    try {
      const r = await api.join(id, { peer_id: peerId, peer_name: displayName }) as { events_fired: number };
      deduct(vault.buy_in);
      setFlash(`Locked in! ${r.events_fired} rule(s) fired.`);
      setTimeout(() => setFlash(""), 3000);
      load();
    } catch (e) { setFlash((e as Error).message); setTimeout(() => setFlash(""), 4000); }
  };

  const handleQuit = () => setShowQuitConfirm(true);

  const handleConfirmQuit = async () => {
    setShowQuitConfirm(false);
    try {
      const r = await api.quit(id, { peer_id: peerId }) as { ok: boolean; penalty: number; refund: number; reason?: string; hours_remaining?: number };
      if (!r.ok && r.reason === "too_early") {
        setQuitMsg(`Too early — ${r.hours_remaining}h remaining in lock period.`);
      } else if (r.ok) {
        add(r.refund);
        setQuitMsg(`You quit. Lost ${r.penalty.toLocaleString()} RIAO, got ${r.refund.toLocaleString()} RIAO back.`);
      }
      setTimeout(() => setQuitMsg(""), 5000);
      load();
    } catch (e) { setQuitMsg((e as Error).message); setTimeout(() => setQuitMsg(""), 4000); }
  };

  const handleTrigger = async () => {
    try {
      const r = await api.trigger(id) as { events_fired: number };
      setFlash(`Deadline triggered — ${r.events_fired} rule(s) fired.`);
      setTimeout(() => setFlash(""), 4000);
      load();
    } catch (e) { setFlash((e as Error).message); setTimeout(() => setFlash(""), 4000); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadMessages = async () => {
    try { setMessages(await api.getMessages(id) as Message[]); } catch {}
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !authenticated) return;
    try {
      await api.postMessage(id, { peer_id: peerId, peer_name: displayName, content: chatInput.trim() });
      setChatInput("");
      await loadMessages();
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {}
  };

  const handleAccept = async (rid: string) => {
    try {
      await api.acceptRequest(id, rid, { creator_id: peerId });
      setFlash("Request accepted — member added!");
      setTimeout(() => setFlash(""), 3000);
      load(); loadRequests();
    } catch (e) { setFlash((e as Error).message); setTimeout(() => setFlash(""), 4000); }
  };

  const handleReject = async (rid: string) => {
    try {
      await api.rejectRequest(id, rid, { creator_id: peerId });
      loadRequests();
    } catch (e) { setFlash((e as Error).message); setTimeout(() => setFlash(""), 4000); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      {showConfirm && vault && (
        <LockInModal
          vault={vault}
          balance={balance}
          accentColor={meta.color}
          onConfirm={handleConfirmJoin}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {showQuitConfirm && vault && (() => {
        const myMember = vault.members.find(m => m.peer_id === peerId && m.status === "active");
        const remaining = vault.members.filter(m => m.peer_id !== peerId && m.status === "active");
        if (!myMember) return null;
        return (
          <QuitConfirmModal
            vault={vault}
            lockedAmount={myMember.amount_locked}
            effectivePenalty={effectivePenalty}
            remainingCount={remaining.length}
            accentColor={meta.color}
            onConfirm={handleConfirmQuit}
            onCancel={() => setShowQuitConfirm(false)}
          />
        );
      })()}
      <Nav />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "36px 32px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: font, fontSize: 13, color: "#6B6B6B",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}>
            <ArrowLeft style={{ width: 15, height: 15 }} /> All Vaults
          </button>
          <Link href="/" style={{
            fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none",
          }}>
            Home
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
          {/* LEFT */}
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{
                borderRadius: 16, padding: "28px 28px 24px",
                border: "1px solid rgba(0,0,0,0.09)",
                borderTop: `3px solid ${meta.color}`,
                background: "#FFFFFF", marginBottom: 20,
              }}>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: meta.bg, border: `1px solid ${meta.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <TypeIcon style={{ width: 17, height: 17, color: meta.color }} strokeWidth={1.8} />
                </div>
                <Badge variant={STATUS_VARIANT[vault.status] ?? "default"}>{vault.status}</Badge>
                <span style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B" }}>by {vault.creator_name}</span>
              </div>

              <h1 style={{ fontFamily: font, fontSize: 26, fontWeight: 900, color: "#000000", letterSpacing: "-0.02em", marginBottom: 10 }}>
                {vault.name}
              </h1>
              <p style={{ fontFamily: font, fontSize: 14, color: "#6B6B6B", lineHeight: 1.65, marginBottom: 24 }}>
                {vault.description}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Pot locked",   value: vault.pot_total.toLocaleString(), unit: "RIAO",   color: meta.color },
                  { label: "Time left",    value: timeLeft(vault.deadline),          unit: "",        color: "#2563EB" },
                  { label: "Quit penalty", value: `${effectivePenalty}%`,             unit: vault.status === "active" && effectivePenalty > vault.penalty_pct ? "escalated" : "on quit", color: "#DC2626" },
                ].map(s => (
                  <div key={s.label} style={{ borderRadius: 10, padding: "14px 12px", textAlign: "center", background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div style={{ fontFamily: font, fontSize: 20, fontWeight: 900, color: s.color, marginBottom: 2, letterSpacing: "-0.01em" }}>{s.value}</div>
                    {s.unit && <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9B9B9B" }}>{s.unit}</div>}
                    <div style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B", marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <ProgressBar progress={progress} color={meta.color} showLabel />
            </motion.div>

            {/* Penalty Escalator */}
            <PenaltyEscalatorChart vault={vault} accentColor={meta.color} />

            {/* Members */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 12 }}>
                Members — {active.length}/{vault.max_members}
              </div>
              {vault.members.map(m => (
                <MemberRow key={m.id} m={m} canQuit={canQuit} onQuit={handleQuit} peerId={peerId} accentColor={meta.color} />
              ))}
              {Array.from({ length: vault.max_members - vault.members.length }).map((_, i) => (
                <div key={i} style={{
                  padding: "14px 16px", borderRadius: 10, marginBottom: 8,
                  border: "1.5px dashed rgba(0,0,0,0.25)",
                  background: "rgba(255,255,255,0.5)",
                  fontFamily: font, fontSize: 13, fontWeight: 600,
                  color: "#6B6B6B", fontStyle: "italic",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, border: "1.5px dashed rgba(0,0,0,0.2)", background: "rgba(0,0,0,0.04)" }} />
                  open slot
                </div>
              ))}
            </div>

            {/* Pending requests — visible to creator */}
            {isCreator && requests.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: meta.color, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <UserPlus style={{ width: 13, height: 13 }} />
                  Pending Requests — {requests.length}
                </div>
                {requests.map(r => (
                  <RequestRow key={r.id} invite={r}
                    onAccept={() => handleAccept(r.id)}
                    onReject={() => handleReject(r.id)}
                    accentColor={meta.color} />
                ))}
              </div>
            )}

            {flash && (
              <div style={{ borderRadius: 8, padding: "12px 16px", marginBottom: 12, background: `${meta.color}0d`, border: `1px solid ${meta.color}30`, fontFamily: font, fontSize: 13, color: meta.color }}>
                {flash}
              </div>
            )}
            {quitMsg && (
              <div style={{ borderRadius: 8, padding: "12px 16px", marginBottom: 12, background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)", fontFamily: font, fontSize: 13, color: "#DC2626" }}>
                {quitMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {canJoin && (
                <Button onClick={handleJoin} size="lg">
                  Lock In — {vault.buy_in.toLocaleString()} RIAO
                </Button>
              )}
              {canRequest && (
                <button onClick={handleRequest} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  fontFamily: font, letterSpacing: "0.04em",
                  background: meta.color, color: "#FFFFFF", border: "none", cursor: "pointer",
                  transition: "opacity 0.15s",
                }}>
                  <UserPlus style={{ width: 16, height: 16 }} />
                  Request to Join
                </button>
              )}
              {!authenticated && vault.status === "filling" && (
                <button onClick={login} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  fontFamily: font, letterSpacing: "0.04em",
                  background: "#000000", color: "#FFFFFF", border: "none", cursor: "pointer",
                }}>
                  Sign in to Join
                </button>
              )}
              {canTrig && (
                <button onClick={handleTrigger} title="Fast-forward deadline (demo only)"
                  style={{
                    width: 44, height: 44, borderRadius: 10,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontFamily: font, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                    color: "#444444", background: "rgba(0,0,0,0.06)",
                    border: "1px solid rgba(0,0,0,0.18)", cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.11)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,0,0,0.28)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.06)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,0,0,0.18)"; }}
                >
                  <FastForward style={{ width: 15, height: 15 }} />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B" }}>
                Vault Timeline
              </div>
              {events.length > 0 && (
                <span style={{ fontFamily: font, fontSize: 10, color: "#BBBBBB" }}>
                  {events.length} event{events.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div style={{
              borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)",
              background: "#FFFFFF", overflow: "hidden",
              maxHeight: 480, overflowY: "auto",
            }}>
              {events.length === 0 ? (
                <div style={{ padding: "32px 24px", textAlign: "center" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, margin: "0 auto 12px",
                    background: "rgba(0,0,0,0.04)", border: "1px dashed rgba(0,0,0,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Zap style={{ width: 16, height: 16, color: "#CCCCCC" }} />
                  </div>
                  <div style={{ fontFamily: font, fontSize: 12, color: "#BBBBBB", lineHeight: 1.6 }}>
                    No events yet.<br />Join or quit to see rules fire.
                  </div>
                </div>
              ) : (
                events.map((ev, i) => (
                  <TimelineEntry
                    key={ev.id}
                    ev={ev}
                    isNew={newIds.has(ev.id)}
                    isLast={i === events.length - 1}
                  />
                ))
              )}
            </div>

            <div style={{ marginTop: 16, borderRadius: 12, padding: "18px 20px", background: meta.bg, border: `1px solid ${meta.color}20` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: meta.color }}>
                  Rules on this vault
                </div>
                <Link href={`/vaults/${id}/rules`} style={{
                  fontFamily: font, fontSize: 10, fontWeight: 700, color: meta.color,
                  textDecoration: "none", letterSpacing: "0.04em",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  Full spec →
                </Link>
              </div>
              {[
                ["ON rage_quit",            "→ SLASH + REDISTRIBUTE"],
                ["ON deadline_reached",     "→ RELEASE payout"],
                ["ON member_joined (full)", "→ ACTIVATE vault"],
              ].map(([trigger, action]) => (
                <div key={trigger} style={{ fontFamily: "monospace", fontSize: 11, marginBottom: 8 }}>
                  <span style={{ color: "#7C3AED" }}>{trigger}</span>{" "}
                  <span style={{ color: meta.color }}>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Share + Activity Chart + Chat ─────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>

          {/* Share Invite Link */}
          <div style={{ borderRadius: 14, padding: "20px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)" }}>
            <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 12 }}>
              Share Vault
            </div>
            <p style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", margin: "0 0 14px", lineHeight: 1.6 }}>
              Invite someone to join this vault by sharing the link.
            </p>
            <button onClick={handleCopyLink} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 9, width: "100%", justifyContent: "center",
              fontFamily: font, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
              background: copied ? "#059669" : "#000000", color: "#FFFFFF",
              border: "none", cursor: "pointer", transition: "background 0.2s",
            }}>
              {copied ? <><CheckCheck style={{ width: 14, height: 14 }} /> Link Copied!</> : <><Copy style={{ width: 14, height: 14 }} /> Copy Invite Link</>}
            </button>
          </div>

          {/* Activity Chart */}
          <div style={{ borderRadius: 14, padding: "20px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <TrendingUp style={{ width: 13, height: 13, color: meta.color }} />
              <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B" }}>
                Pot Activity
              </div>
            </div>
            <ActivityChart vault={vault} color={meta.color} />
          </div>
        </div>

        {/* Chat Panel */}
        <div style={{ borderRadius: 14, marginTop: 20, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B" }}>
              Vault Chat
            </div>
            <span style={{ fontFamily: font, fontSize: 10, color: "#BBBBBB" }}>{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto", padding: "12px 20px" }}>
            {messages.length === 0 ? (
              <p style={{ fontFamily: font, fontSize: 12, color: "#BBBBBB", textAlign: "center", padding: "20px 0", margin: 0 }}>
                No messages yet. Be the first.
              </p>
            ) : messages.map(m => (
              <div key={m.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: m.peer_id === peerId ? meta.color : "#000000" }}>
                    {m.peer_name}
                  </span>
                  <span style={{ fontFamily: font, fontSize: 10, color: "#BBBBBB" }}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ fontFamily: font, fontSize: 12, color: "#333333", margin: 0, lineHeight: 1.6 }}>{m.content}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: 10 }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
              placeholder={authenticated ? "Say something…" : "Sign in to chat"}
              disabled={!authenticated}
              maxLength={500}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 9,
                fontFamily: font, fontSize: 13, color: "#000000",
                background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.1)",
                outline: "none",
              }}
            />
            <button onClick={handleSendMessage} disabled={!authenticated || !chatInput.trim()} style={{
              width: 42, height: 42, borderRadius: 9, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: authenticated && chatInput.trim() ? meta.color : "#CCCCCC",
              border: "none", cursor: authenticated && chatInput.trim() ? "pointer" : "not-allowed",
            }}>
              <Send style={{ width: 16, height: 16, color: "#FFFFFF" }} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function ActivityChart({ vault, color }: { vault: Vault; color: string }) {
  const events: { t: number; pot: number }[] = [];
  const sorted = [...vault.members].sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
  let pot = 0;
  const start = sorted[0] ? new Date(sorted[0].joined_at).getTime() : Date.now();

  sorted.forEach(m => {
    pot += m.amount_locked;
    events.push({ t: new Date(m.joined_at).getTime(), pot });
  });

  const quits = vault.members.filter(m => m.quit_at).sort((a, b) => new Date(a.quit_at!).getTime() - new Date(b.quit_at!).getTime());
  quits.forEach(m => {
    const refund = Math.round(m.amount_locked * 0.75);
    pot = Math.max(0, pot - refund);
    events.push({ t: new Date(m.quit_at!).getTime(), pot });
  });

  events.push({ t: Date.now(), pot });
  events.sort((a, b) => a.t - b.t);

  if (events.length < 2) return (
    <p style={{ fontFamily: '"Space Mono",monospace', fontSize: 11, color: "#BBBBBB", margin: 0, textAlign: "center", paddingTop: 16 }}>
      No activity yet
    </p>
  );

  const W = 240, H = 72;
  const maxPot = Math.max(...events.map(e => e.pot), 1);
  const minT = events[0].t, maxT = events[events.length - 1].t || minT + 1;
  const px = (t: number) => ((t - minT) / (maxT - minT)) * W;
  const py = (p: number) => H - (p / maxPot) * H * 0.9 - 4;
  const pts = events.map(e => `${px(e.t).toFixed(1)},${py(e.pot).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 72, display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {events.map((e, i) => (
        <circle key={i} cx={px(e.t)} cy={py(e.pot)} r="3" fill={color} />
      ))}
    </svg>
  );
}
