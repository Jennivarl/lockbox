"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { Vault, Member, ReactiveEvent } from "@/lib/types";

const MY_ID   = "peer-you";
const MY_NAME = "you.eth";

const STATUS_COLOR: Record<string, string> = {
  filling: "#60a5fa", active: "#10b981", completed: "#a78bfa", dead: "#6b7280",
};

const EVENT_COLOR: Record<string, string> = {
  notification: "#60a5fa", announcement: "#a78bfa",
  rage_quit: "#ef4444", payout: "#10b981", warning: "#f59e0b",
};

function timeLeft(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m left`;
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d ${Math.floor((h % 24))}h left`;
}

function MemberRow({ m, canQuit, onQuit }: { m: Member; canQuit: boolean; onQuit: () => void }) {
  const isMe = m.peer_id === MY_ID;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 16px", borderRadius: 10,
      background: isMe ? "rgba(239,68,68,0.05)" : "rgba(10,6,16,0.4)",
      border: isMe ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(239,68,68,0.06)",
      marginBottom: 8,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: m.status === "quit" ? "rgba(107,114,128,0.2)" : "rgba(239,68,68,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700,
        color: m.status === "quit" ? "#6b7280" : "#fca5a5",
      }}>
        {m.peer_name.slice(0, 2).toUpperCase()}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: m.status === "quit" ? "#6b7280" : "#f0eaf8" }}>
            {m.peer_name} {isMe && <span style={{ fontSize: 11, color: "#ef4444" }}>(you)</span>}
          </span>
          {m.status === "quit" && <span style={{ fontSize: 11, color: "#ef4444" }}>💀 quit</span>}
          {m.status === "paid" && <span style={{ fontSize: 11, color: "#10b981" }}>✓ paid</span>}
        </div>
        <div style={{ fontSize: 11, color: "#4a3860", marginTop: 2 }}>
          locked {m.amount_locked.toLocaleString()} RIAO
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: m.status === "quit" ? "#6b7280" : "#10b981" }}>
          {m.amount_expected.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: "#4a3860" }}>
          {m.status === "quit" ? "refunded" : "expected"}
        </div>
      </div>

      {canQuit && isMe && m.status === "active" && (
        <button onClick={onQuit} style={{
          padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#fca5a5", cursor: "pointer", flexShrink: 0,
        }}>
          ☠️ Quit
        </button>
      )}
    </div>
  );
}

function EventPill({ ev, isNew }: { ev: ReactiveEvent; isNew: boolean }) {
  const color = EVENT_COLOR[ev.event_type] ?? "#7c6fa0";
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      padding: "10px 14px", borderRadius: 8,
      background: isNew ? "rgba(239,68,68,0.06)" : "transparent",
      borderBottom: "1px solid rgba(239,68,68,0.05)",
      transition: "background 1s ease",
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1, fontSize: 12, color: "#c4b5fd", lineHeight: 1.5 }}>{ev.summary}</div>
      <div style={{ fontSize: 10, color: "#3d3557", flexShrink: 0 }}>
        {new Date(ev.fired_at).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default function VaultPage() {
  const { id } = useParams<{ id: string }>();
  const [vault,   setVault]   = useState<Vault | null>(null);
  const [events,  setEvents]  = useState<ReactiveEvent[]>([]);
  const [newIds,  setNewIds]  = useState<Set<string>>(new Set());
  const [flash,   setFlash]   = useState("");
  const [quitMsg, setQuitMsg] = useState("");
  const prevEventIds = useRef<Set<string>>(new Set());

  const load = async () => {
    const [v, evs] = await Promise.all([
      api.vault(id),
      api.feed(20),
    ]);
    setVault(v);
    const fresh = new Set(evs.map(e => e.id).filter(eid => !prevEventIds.current.has(eid)));
    if (fresh.size > 0) setNewIds(fresh);
    prevEventIds.current = new Set(evs.map(e => e.id));
    setEvents(evs.filter(e => e.payload && (e.payload as Record<string,unknown>).vault_id === id || evs.indexOf(e) < 20));
    setTimeout(() => setNewIds(new Set()), 2500);
  };

  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [id]);

  if (!vault) return (
    <div style={{ minHeight: "100vh", background: "#06040a" }}>
      <Nav />
      <div style={{ textAlign: "center", padding: 80, color: "#4a3860" }}>Loading…</div>
    </div>
  );

  const active    = vault.members.filter(m => m.status === "active");
  const statusCol = STATUS_COLOR[vault.status];
  const isMember  = vault.members.some(m => m.peer_id === MY_ID && m.status === "active");
  const canJoin   = vault.status === "filling" && !isMember;
  const canQuit   = (vault.status === "filling" || vault.status === "active") && isMember;
  const canTrigger = vault.status === "filling" || vault.status === "active";
  const vaultEvents = events.filter(e => {
    const p = e.payload as Record<string, unknown>;
    return p.vault_id === id;
  });

  const handleJoin = async () => {
    try {
      const r = await api.join(id, { peer_id: MY_ID, peer_name: MY_NAME }) as { events_fired: number };
      setFlash(`Joined! ${r.events_fired} rule(s) fired.`);
      setTimeout(() => setFlash(""), 3000);
      load();
    } catch (e) { setFlash((e as Error).message); setTimeout(() => setFlash(""), 4000); }
  };

  const handleQuit = async () => {
    if (!confirm("Are you sure? You will lose your penalty to other members.")) return;
    try {
      const r = await api.quit(id, { peer_id: MY_ID }) as { ok: boolean; penalty: number; refund: number; reason?: string; hours_remaining?: number };
      if (!r.ok && r.reason === "too_early") {
        setQuitMsg(`Too early — ${r.hours_remaining}h remaining in lock period.`);
      } else if (r.ok) {
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

  return (
    <div style={{ minHeight: "100vh", background: "#06040a", color: "#f0eaf8" }}>
      <Nav />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "36px 40px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>

        {/* LEFT */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 99,
                background: `${statusCol}18`, color: statusCol,
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {vault.status}
              </span>
              <span style={{ fontSize: 12, color: "#4a3860" }}>by {vault.creator_name}</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>{vault.name}</h1>
            <p style={{ fontSize: 14, color: "#5a4870", lineHeight: 1.6 }}>{vault.description}</p>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Pot locked", value: vault.pot_total.toLocaleString(), unit: "RIAO" },
              { label: "Time left",  value: timeLeft(vault.deadline),         unit: ""     },
              { label: "Penalty",    value: `${vault.penalty_pct}%`,          unit: "on quit" },
            ].map(s => (
              <div key={s.label} style={{
                padding: "16px", borderRadius: 10, textAlign: "center",
                background: "rgba(10,6,16,0.6)", border: "1px solid rgba(239,68,68,0.08)",
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f0eaf8" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.unit}</div>
                <div style={{ fontSize: 11, color: "#4a3860", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Members */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4a3860", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              Members — {active.length}/{vault.max_members}
            </div>
            {vault.members.map(m => (
              <MemberRow key={m.id} m={m} canQuit={canQuit} onQuit={handleQuit} />
            ))}
            {Array.from({ length: vault.max_members - vault.members.length }).map((_, i) => (
              <div key={i} style={{
                padding: "12px 16px", borderRadius: 10, marginBottom: 8,
                background: "rgba(10,6,16,0.2)", border: "1px dashed rgba(239,68,68,0.1)",
                fontSize: 13, color: "#3d3557", fontStyle: "italic",
              }}>
                open slot
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {flash && (
            <div style={{ padding: "12px 16px", borderRadius: 9, marginBottom: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#6ee7b7", fontSize: 13 }}>
              {flash}
            </div>
          )}
          {quitMsg && (
            <div style={{ padding: "12px 16px", borderRadius: 9, marginBottom: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13 }}>
              {quitMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {canJoin && (
              <button onClick={handleJoin} style={{
                padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer",
                background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none",
              }}>
                🔒 Join — {vault.buy_in.toLocaleString()} RIAO
              </button>
            )}
            {canTrigger && (
              <button onClick={handleTrigger} style={{
                padding: "12px 24px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa",
              }}>
                ⚡ Trigger Deadline
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — event feed */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#4a3860", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Reactive Events
          </div>
          <div style={{
            background: "rgba(10,6,16,0.7)", border: "1px solid rgba(239,68,68,0.1)",
            borderRadius: 12, overflow: "hidden", maxHeight: 520, overflowY: "auto",
          }}>
            {vaultEvents.length === 0 ? (
              <div style={{ padding: 24, fontSize: 12, color: "#3d3557", textAlign: "center" }}>
                No events yet — join or quit to see rules fire.
              </div>
            ) : (
              vaultEvents.map(ev => <EventPill key={ev.id} ev={ev} isNew={newIds.has(ev.id)} />)
            )}
          </div>

          {/* Rule reference */}
          <div style={{ marginTop: 20, padding: "14px", borderRadius: 10, background: "rgba(10,6,16,0.5)", border: "1px solid rgba(239,68,68,0.07)" }}>
            <div style={{ fontSize: 10, color: "#3d3557", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Rialo rules on this vault
            </div>
            {[
              ["ON rage_quit", "→ SLASH + REDISTRIBUTE"],
              ["ON deadline_reached", "→ RELEASE payout"],
              ["ON member_joined (full)", "→ ACTIVATE vault"],
            ].map(([trigger, action]) => (
              <div key={trigger} style={{ fontSize: 11, color: "#5a4870", marginBottom: 6, fontFamily: "monospace" }}>
                <span style={{ color: "#7c6fa0" }}>{trigger}</span>{" "}
                <span style={{ color: "#9d8ec0" }}>{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
