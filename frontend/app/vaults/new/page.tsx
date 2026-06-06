"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, PiggyBank, Target, Building2, Lock,
  Dumbbell, Trophy, Check, Vault, Clock, AlertCircle, Users, DollarSign,
} from "lucide-react";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { useBalance } from "@/lib/useBalance";

const font = '"Space Mono", "Courier New", monospace';

const TYPES: {
  value: string; label: string; tagline: string;
  description: string; icon: React.ElementType; color: string; bg: string;
}[] = [
  {
    value: "savings", label: "Savings", tagline: "Commit to your goals",
    description: "Group savings with real skin in the game. Lock RIAO together and hold until the target date.",
    icon: PiggyBank, color: "#059669", bg: "rgba(5,150,105,0.08)",
  },
  {
    value: "accountability", label: "Accountability", tagline: "Skin in the game",
    description: "Public commitments backed by locked funds. Miss your mark or walk away and pay the group.",
    icon: Target, color: "#7C3AED", bg: "rgba(124,58,237,0.08)",
  },
  {
    value: "dao", label: "DAO", tagline: "Align contributors",
    description: "Collective governance locks that align contributor incentives with protocol outcomes.",
    icon: Building2, color: "#2563EB", bg: "rgba(37,99,235,0.08)",
  },
  {
    value: "vesting", label: "Vesting", tagline: "Founder commitment pacts",
    description: "Founders and core team lock RIAO as a public vesting signal. Stay the course or forfeit.",
    icon: Lock, color: "#D97706", bg: "rgba(217,119,6,0.08)",
  },
];

const STEP_LABELS = ["Category", "Details", "Rules", "Review"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: font, fontSize: 12, fontWeight: 700,
            background: i < current ? "#000000" : i === current ? "#000000" : "transparent",
            color: i <= current ? "#FFFFFF" : "#9B9B9B",
            border: i <= current ? "none" : "2px solid rgba(0,0,0,0.15)",
            transition: "all 0.25s",
            flexShrink: 0,
          }}>
            {i < current ? <Check style={{ width: 14, height: 14 }} /> : i + 1}
          </div>
          <div style={{ marginLeft: 8, marginRight: i < total - 1 ? 0 : 0 }}>
            <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", color: i === current ? "#000000" : "#9B9B9B",
              transition: "color 0.25s",
            }}>
              {STEP_LABELS[i]}
            </div>
          </div>
          {i < total - 1 && (
            <div style={{
              width: 40, height: 1, margin: "0 12px",
              background: i < current ? "#000000" : "rgba(0,0,0,0.15)",
              transition: "background 0.25s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

function NavButtons({
  onBack, onNext, nextLabel = "Next", nextDisabled = false, nextColor = "#000000", loading = false,
}: {
  onBack?: () => void; onNext: () => void; nextLabel?: string;
  nextDisabled?: boolean; nextColor?: string; loading?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
      {onBack && (
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "13px 22px", borderRadius: 10,
          fontFamily: font, fontSize: 13, fontWeight: 700,
          background: "transparent", color: "#6B6B6B",
          border: "1px solid rgba(0,0,0,0.18)", cursor: "pointer",
        }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
        </button>
      )}
      <button onClick={onNext} disabled={nextDisabled || loading} style={{
        flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "13px 22px", borderRadius: 10,
        fontFamily: font, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
        background: nextDisabled ? "#CCCCCC" : nextColor, color: "#FFFFFF",
        border: "none", cursor: nextDisabled || loading ? "not-allowed" : "pointer",
        transition: "background 0.2s",
      }}>
        {loading ? "Launching…" : nextLabel}
        {!loading && <ArrowRight style={{ width: 14, height: 14 }} />}
      </button>
    </div>
  );
}

// ── Step 1: Choose category ───────────────────────────────────────────────────
function Step1({ value, onChange, onNext }: {
  value: string; onChange: (v: string) => void; onNext: () => void;
}) {
  return (
    <div>
      <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 900, color: "#000000",
        letterSpacing: "-0.02em", marginBottom: 6 }}>
        Choose a vault category
      </h2>
      <p style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", marginBottom: 28, lineHeight: 1.6 }}>
        Each category represents a different commitment type and unlocks a different reactive rule set.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {TYPES.map((t, i) => {
          const selected = value === t.value;
          const Icon = t.icon;
          return (
            <motion.button
              key={t.value}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              onClick={() => onChange(t.value)}
              style={{
                borderRadius: 14, padding: "22px 20px", textAlign: "left", cursor: "pointer",
                background: selected ? "#000000" : "#FFFFFF",
                border: selected ? `2px solid #000000` : `2px solid rgba(0,0,0,0.08)`,
                transition: "all 0.2s",
                position: "relative", overflow: "hidden",
              }}
            >
              {selected && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  width: 20, height: 20, borderRadius: "50%",
                  background: t.color, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check style={{ width: 11, height: 11, color: "#FFFFFF" }} strokeWidth={2.5} />
                </div>
              )}
              <div style={{
                width: 40, height: 40, borderRadius: 11, marginBottom: 14,
                background: selected ? `${t.color}25` : t.bg,
                border: `1.5px solid ${t.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon style={{ width: 19, height: 19, color: t.color }} strokeWidth={1.8} />
              </div>
              <div style={{ fontFamily: font, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: selected ? t.color : t.color, marginBottom: 5 }}>
                {t.label}
              </div>
              <div style={{ fontFamily: font, fontSize: 14, fontWeight: 900, letterSpacing: "-0.01em",
                color: selected ? "#FFFFFF" : "#000000", marginBottom: 8 }}>
                {t.tagline}
              </div>
              <div style={{ fontFamily: font, fontSize: 11, color: selected ? "rgba(255,255,255,0.65)" : "#6B6B6B",
                lineHeight: 1.65 }}>
                {t.description}
              </div>
            </motion.button>
          );
        })}
      </div>
      <NavButtons onNext={onNext} nextLabel="Continue" nextDisabled={!value} />
    </div>
  );
}

// ── Step 2: Name + description ────────────────────────────────────────────────
function Step2({ type, name, desc, onName, onDesc, onBack, onNext }: {
  type: string; name: string; desc: string;
  onName: (v: string) => void; onDesc: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  const t = TYPES.find(x => x.value === type)!;
  const Icon = t?.icon ?? Vault;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: t?.bg, border: `1.5px solid ${t?.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon style={{ width: 18, height: 18, color: t?.color }} strokeWidth={1.8} />
        </div>
        <div>
          <div style={{ fontFamily: font, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: t?.color, marginBottom: 2 }}>
            {t?.label}
          </div>
          <h2 style={{ fontFamily: font, fontSize: 18, fontWeight: 900, color: "#000000", margin: 0 }}>
            Name your vault
          </h2>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontFamily: font, fontSize: 11, fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 8 }}>
          Vault Name
        </label>
        <input
          value={name} onChange={e => onName(e.target.value)}
          placeholder='e.g. "Bali Trip 2026" or "Q3 Build Sprint"'
          maxLength={60}
          style={{
            width: "100%", padding: "13px 16px", borderRadius: 10, fontSize: 15,
            fontFamily: font, background: "#FFFFFF", border: "1.5px solid rgba(0,0,0,0.15)",
            color: "#000000", outline: "none", boxSizing: "border-box",
          }}
        />
        <div style={{ fontFamily: font, fontSize: 10, color: "#BBBBBB", marginTop: 5, textAlign: "right" }}>
          {name.length}/60
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontFamily: font, fontSize: 11, fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 8 }}>
          Commitment Description
        </label>
        <textarea
          value={desc} onChange={e => onDesc(e.target.value)}
          placeholder="Describe what the group is committing to. Why are you locking funds? What does success look like?"
          rows={5}
          maxLength={400}
          style={{
            width: "100%", padding: "13px 16px", borderRadius: 10, fontSize: 13,
            fontFamily: font, background: "#FFFFFF", border: "1.5px solid rgba(0,0,0,0.15)",
            color: "#000000", outline: "none", resize: "none", lineHeight: 1.7,
            boxSizing: "border-box",
          }}
        />
        <div style={{ fontFamily: font, fontSize: 10, color: "#BBBBBB", marginTop: 5, textAlign: "right" }}>
          {desc.length}/400
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!name.trim() || !desc.trim()} />
    </div>
  );
}

// ── Step 3: Parameters ────────────────────────────────────────────────────────
function Step3({ type, buyIn, maxMembers, penaltyPct, minLock, deadline,
  onBuyIn, onMaxMembers, onPenalty, onMinLock, onDeadline, onBack, onNext }: {
  type: string; buyIn: string; maxMembers: string; penaltyPct: string;
  minLock: string; deadline: string;
  onBuyIn: (v: string) => void; onMaxMembers: (v: string) => void;
  onPenalty: (v: string) => void; onMinLock: (v: string) => void;
  onDeadline: (v: string) => void; onBack: () => void; onNext: () => void;
}) {
  const t     = TYPES.find(x => x.value === type)!;
  const pct   = parseInt(penaltyPct) || 0;
  const maxPct = Math.min(pct * 2, 95);
  const buy   = parseInt(buyIn) || 0;
  const canNext = !!buyIn && !!maxMembers && !!penaltyPct && !!deadline;

  const fieldLabel = (text: string) => (
    <label style={{ display: "block", fontFamily: font, fontSize: 11, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 7 }}>
      {text}
    </label>
  );
  const fieldInput = (val: string, onChange: (v: string) => void, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input value={val} onChange={e => onChange(e.target.value)} {...props} style={{
      width: "100%", padding: "12px 14px", borderRadius: 9, fontSize: 14,
      fontFamily: font, background: "#FFFFFF", border: "1.5px solid rgba(0,0,0,0.15)",
      color: "#000000", outline: "none", boxSizing: "border-box",
    }} />
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11, background: t?.bg, border: `1.5px solid ${t?.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <t.icon style={{ width: 18, height: 18, color: t?.color }} strokeWidth={1.8} />
        </div>
        <h2 style={{ fontFamily: font, fontSize: 18, fontWeight: 900, color: "#000000", margin: 0 }}>
          Set the rules
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          {fieldLabel("Buy-in (RIAO)")}
          {fieldInput(buyIn, onBuyIn, { type: "number", placeholder: "e.g. 1000", min: "1" })}
          <p style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
            <DollarSign style={{ width: 11, height: 11 }} /> Required from each member
          </p>
        </div>
        <div>
          {fieldLabel("Max members")}
          {fieldInput(maxMembers, onMaxMembers, { type: "number", min: "2", max: "20" })}
          <p style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
            <Users style={{ width: 11, height: 11 }} /> Vault capacity (2–20)
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          {fieldLabel("Rage quit penalty (%)")}
          {fieldInput(penaltyPct, onPenalty, { type: "number", min: "1", max: "90" })}
          {pct > 0 && (
            <p style={{ fontFamily: font, fontSize: 10, color: "#DC2626", marginTop: 5 }}>
              Escalates {pct}% → {maxPct}% over vault lifetime
            </p>
          )}
        </div>
        <div>
          {fieldLabel("Min lock period (hours)")}
          {fieldInput(minLock, onMinLock, { type: "number", min: "0" })}
          <p style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock style={{ width: 11, height: 11 }} /> No quit before this
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        {fieldLabel("Deadline")}
        <input type="datetime-local" value={deadline} onChange={e => onDeadline(e.target.value)}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 9, fontSize: 14,
            fontFamily: font, background: "#FFFFFF", border: "1.5px solid rgba(0,0,0,0.15)",
            color: "#000000", outline: "none", boxSizing: "border-box",
          }} />
        <p style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginTop: 5 }}>
          Reactive rule fires automatically at this moment
        </p>
      </div>

      {/* Penalty preview */}
      {buy > 0 && pct > 0 && (() => {
        const minLockHrs = parseInt(minLock) || 0;
        const dlMs = deadline ? new Date(deadline).getTime() - Date.now() : 0;
        const totalHrs = dlMs > 0 ? dlMs / 3_600_000 : 0;
        const earliestRatio = totalHrs > 0 ? Math.min(minLockHrs / totalHrs, 1) : 0;
        const earliestPct = Math.min(Math.round(pct * (1 + earliestRatio)), 95);
        const earliestLabel = minLockHrs > 0 ? `Earliest quit (after ${minLockHrs}h lock)` : "If quit at day 0";
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            style={{
              marginTop: 16, borderRadius: 10, padding: "14px 16px",
              background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)",
            }}>
            <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#DC2626", marginBottom: 8 }}>
              Penalty preview
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B" }}>{earliestLabel}</div>
                <div style={{ fontFamily: font, fontSize: 16, fontWeight: 900, color: "#DC2626" }}>
                  −{Math.round(buy * earliestPct / 100).toLocaleString()} RIAO
                </div>
                <div style={{ fontFamily: font, fontSize: 9, color: "#9B9B9B", marginTop: 2 }}>{earliestPct}% penalty</div>
              </div>
              <div style={{ width: 1, background: "rgba(220,38,38,0.15)" }} />
              <div>
                <div style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B" }}>If quit at deadline</div>
                <div style={{ fontFamily: font, fontSize: 16, fontWeight: 900, color: "#DC2626" }}>
                  −{Math.round(buy * maxPct / 100).toLocaleString()} RIAO
                </div>
                <div style={{ fontFamily: font, fontSize: 9, color: "#9B9B9B", marginTop: 2 }}>{maxPct}% penalty</div>
              </div>
              <div style={{ width: 1, background: "rgba(220,38,38,0.15)" }} />
              <div>
                <div style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B" }}>Pot if full ({maxMembers || "?"} members)</div>
                <div style={{ fontFamily: font, fontSize: 16, fontWeight: 900, color: t?.color }}>
                  {(buy * (parseInt(maxMembers) || 0)).toLocaleString()} RIAO
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!canNext} />
    </div>
  );
}

// ── Step 4: Review + Launch ───────────────────────────────────────────────────
function Step4({ type, name, desc, buyIn, maxMembers, penaltyPct, minLock, deadline,
  onBack, onLaunch, submitting, error, balance,
}: {
  type: string; name: string; desc: string; buyIn: string; maxMembers: string;
  penaltyPct: string; minLock: string; deadline: string;
  onBack: () => void; onLaunch: () => void; submitting: boolean; error: string; balance: number;
}) {
  const t      = TYPES.find(x => x.value === type)!;
  const Icon   = t?.icon ?? Vault;
  const pct    = parseInt(penaltyPct) || 0;
  const maxPct = Math.min(pct * 2, 95);
  const buy    = parseInt(buyIn) || 0;
  const members = parseInt(maxMembers) || 0;
  const pot    = buy * members;
  const dl     = deadline ? new Date(deadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—";
  const canAfford = balance >= buy;

  return (
    <div>
      <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 900, color: "#000000",
        letterSpacing: "-0.02em", marginBottom: 6 }}>
        Review your vault
      </h2>
      <p style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", marginBottom: 24, lineHeight: 1.6 }}>
        Everything looks right? Launch it — your stake gets locked on join.
      </p>

      {/* Vault preview card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{
          borderRadius: 16, padding: "24px",
          background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
          borderTop: `3px solid ${t?.color}`,
          marginBottom: 16,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: t?.bg, border: `1.5px solid ${t?.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon style={{ width: 17, height: 17, color: t?.color }} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontFamily: font, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: t?.color, marginBottom: 2 }}>
              {t?.label}
            </div>
            <span style={{
              fontFamily: font, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
              background: "rgba(37,99,235,0.1)", color: "#2563EB",
            }}>
              filling
            </span>
          </div>
        </div>
        <div style={{ fontFamily: font, fontSize: 18, fontWeight: 900, color: "#000000",
          letterSpacing: "-0.02em", marginBottom: 8 }}>
          {name}
        </div>
        <div style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", lineHeight: 1.65, marginBottom: 18 }}>
          {desc}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            { label: "Buy-in",    value: `${buy.toLocaleString()} RIAO`, color: t?.color },
            { label: "Members",  value: `0 / ${members}`,                color: "#2563EB" },
            { label: "Penalty",  value: `${pct}% → ${maxPct}%`,          color: "#DC2626" },
            { label: "Full pot", value: `${pot.toLocaleString()} RIAO`,   color: t?.color },
            { label: "Min lock", value: `${minLock}h`,                    color: "#9B9B9B" },
            { label: "Deadline", value: dl,                               color: "#9B9B9B" },
          ].map(s => (
            <div key={s.label} style={{
              borderRadius: 8, padding: "10px 12px",
              background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.07)",
            }}>
              <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Balance check */}
      <div style={{
        borderRadius: 10, padding: "13px 16px", marginBottom: 16,
        background: canAfford ? "rgba(5,150,105,0.06)" : "rgba(220,38,38,0.06)",
        border: `1px solid ${canAfford ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B" }}>Your balance</span>
        <span style={{ fontFamily: font, fontSize: 14, fontWeight: 900,
          color: canAfford ? "#059669" : "#DC2626" }}>
          {balance.toLocaleString()} RIAO {canAfford ? "✓" : "— insufficient"}
        </span>
      </div>

      {error && (
        <div style={{ borderRadius: 8, padding: "12px 16px", marginBottom: 12,
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          fontFamily: font, fontSize: 13, color: "#DC2626", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle style={{ width: 14, height: 14 }} /> {error}
        </div>
      )}

      <NavButtons
        onBack={onBack}
        onNext={onLaunch}
        nextLabel="Launch Vault"
        nextColor={t?.color}
        loading={submitting}
        nextDisabled={submitting}
      />
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function NewVault() {
  const router = useRouter();
  const { ready, authenticated, login, peerId, peerName } = useAuth();
  const { balance, deduct } = useBalance();

  const [step,       setStep]       = useState(0);
  const [direction,  setDirection]  = useState(1);
  const [type,       setType]       = useState("accountability");
  const [name,       setName]       = useState("30-Day Builder Sprint");
  const [desc,       setDesc]       = useState("A group accountability pact for building in public. Lock funds for 30 days — anyone who walks away early forfeits their penalty to everyone who stayed.");
  const [buyIn,      setBuyIn]      = useState("1000");
  const [maxMembers, setMaxMembers] = useState("4");
  const [penaltyPct, setPenaltyPct] = useState("20");
  const [minLock,    setMinLock]    = useState("48");
  const [deadline,   setDeadline]   = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => { if (ready && !authenticated) login(); }, [ready, authenticated]);

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleLaunch = async () => {
    setSubmitting(true); setError("");
    try {
      const vault = await api.create({
        name: name.trim(), description: desc.trim(), type,
        buy_in: parseInt(buyIn), max_members: parseInt(maxMembers),
        penalty_pct: parseInt(penaltyPct), min_lock_hours: parseInt(minLock),
        deadline: new Date(deadline).toISOString(),
        creator_id: peerId, creator_name: peerName,
      });
      router.push(`/vaults/${vault.id}`);
    } catch (e) {
      setError((e as Error).message || "Failed to create vault.");
      setSubmitting(false);
    }
  };

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d * 32 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d * -32 }),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 32px 100px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: font, fontSize: 13, color: "#6B6B6B",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}>
            <ArrowLeft style={{ width: 15, height: 15 }} /> Vaults
          </button>
          <Link href="/" style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none" }}>
            Home
          </Link>
        </div>

        <div style={{ fontFamily: font, fontSize: 24, fontWeight: 900, color: "#000000",
          letterSpacing: "-0.02em", marginBottom: 32 }}>
          Create a Vault
        </div>

        <StepIndicator current={step} total={4} />

        <div style={{ position: "relative", overflow: "hidden", minHeight: 400 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction}
              variants={variants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              {step === 0 && (
                <Step1 value={type} onChange={setType} onNext={() => go(1)} />
              )}
              {step === 1 && (
                <Step2 type={type} name={name} desc={desc}
                  onName={setName} onDesc={setDesc}
                  onBack={() => go(0)} onNext={() => go(2)} />
              )}
              {step === 2 && (
                <Step3 type={type} buyIn={buyIn} maxMembers={maxMembers}
                  penaltyPct={penaltyPct} minLock={minLock} deadline={deadline}
                  onBuyIn={setBuyIn} onMaxMembers={setMaxMembers}
                  onPenalty={setPenaltyPct} onMinLock={setMinLock} onDeadline={setDeadline}
                  onBack={() => go(1)} onNext={() => go(3)} />
              )}
              {step === 3 && (
                <Step4 type={type} name={name} desc={desc} buyIn={buyIn}
                  maxMembers={maxMembers} penaltyPct={penaltyPct} minLock={minLock}
                  deadline={deadline} onBack={() => go(2)}
                  onLaunch={handleLaunch} submitting={submitting}
                  error={error} balance={balance} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
