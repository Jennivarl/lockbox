"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, UserX, CheckCircle2, UserPlus, Check, X, PiggyBank, Dumbbell, Building2, Lock, FastForward, Trophy, Target } from "lucide-react";
import Nav from "@/components/Nav";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Avatar } from "@/components/Avatar";
import { ProgressBar } from "@/components/ProgressBar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { useBalance } from "@/lib/useBalance";
import { useProfile } from "@/lib/useProfile";
import type { Vault, Member, ReactiveEvent, Invite } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';

const STATUS_VARIANT: Record<string, "info" | "success" | "default" | "danger"> = {
  filling: "info", active: "success", completed: "default", dead: "danger",
};

const EVENT_COLOR: Record<string, string> = {
  notification: "#2563EB", announcement: "#7C3AED",
  rage_quit: "#DC2626", payout: "#059669", warning: "#D97706",
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

function EventPill({ ev, isNew }: { ev: ReactiveEvent; isNew: boolean }) {
  const color = EVENT_COLOR[ev.event_type] ?? "#6B6B6B";
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)",
      background: isNew ? "rgba(0,0,0,0.02)" : "transparent",
      transition: "background 1s ease",
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1, fontFamily: font, fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{ev.summary}</div>
      <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", flexShrink: 0 }}>
        {new Date(ev.fired_at).toLocaleTimeString()}
      </div>
    </div>
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
          Quit before deadline? You forfeit <strong style={{ color: "#DC2626" }}>{vault.penalty_pct}%</strong> ({Math.round(vault.buy_in * vault.penalty_pct / 100).toLocaleString()} RIAO) to survivors.
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
  const [showConfirm, setShowConfirm] = useState(false);
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
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
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

  const handleQuit = async () => {
    if (!confirm("Are you sure? You will lose your penalty to other members.")) return;
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
                  { label: "Quit penalty", value: `${vault.penalty_pct}%`,           unit: "on quit", color: "#DC2626" },
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
            <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 12 }}>
              Reactive Events
            </div>
            <div style={{ borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", background: "#FFFFFF", overflow: "hidden", maxHeight: 460, overflowY: "auto" }}>
              {events.length === 0 ? (
                <div style={{ padding: 24, fontFamily: font, fontSize: 12, color: "#9B9B9B", textAlign: "center" }}>
                  No events yet — join or quit to see rules fire.
                </div>
              ) : (
                events.map(ev => <EventPill key={ev.id} ev={ev} isNew={newIds.has(ev.id)} />)
              )}
            </div>

            <div style={{ marginTop: 16, borderRadius: 12, padding: "18px 20px", background: meta.bg, border: `1px solid ${meta.color}20` }}>
              <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: meta.color, marginBottom: 12 }}>
                Rules on this vault
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
      </div>
    </div>
  );
}
