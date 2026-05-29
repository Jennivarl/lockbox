"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";

const MY_ID   = "peer-you";
const MY_NAME = "you.eth";

const TYPES = [
  { value: "savings",        label: "Savings",        emoji: "🏖️", desc: "Saving toward a shared goal" },
  { value: "accountability", label: "Accountability",  emoji: "💪", desc: "Habit or commitment pact" },
  { value: "dao",            label: "DAO / Team",      emoji: "🏛️", desc: "Team or treasury lock" },
  { value: "vesting",        label: "Vesting",         emoji: "🔐", desc: "Founder or contributor lock-up" },
];

const label = { fontSize: 13, fontWeight: 600, color: "#9d8ec0", marginBottom: 6, display: "block" as const };

export default function NewVault() {
  const router = useRouter();
  const [type,        setType]        = useState("savings");
  const [name,        setName]        = useState("");
  const [desc,        setDesc]        = useState("");
  const [buyIn,       setBuyIn]       = useState("");
  const [maxMembers,  setMaxMembers]  = useState("5");
  const [penaltyPct,  setPenaltyPct]  = useState("20");
  const [minLock,     setMinLock]     = useState("48");
  const [deadline,    setDeadline]    = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !desc.trim() || !buyIn || !deadline) {
      setError("All fields are required."); return;
    }
    if (parseInt(penaltyPct) + 100 > 200) { setError("Penalty must be ≤ 100%."); return; }
    setSubmitting(true); setError("");
    try {
      const vault = await api.create({
        name: name.trim(), description: desc.trim(), type,
        buy_in: parseInt(buyIn), max_members: parseInt(maxMembers),
        penalty_pct: parseInt(penaltyPct), min_lock_hours: parseInt(minLock),
        deadline: new Date(deadline).toISOString(),
        creator_id: MY_ID, creator_name: MY_NAME,
      });
      router.push(`/vaults/${vault.id}`);
    } catch (e) {
      setError((e as Error).message || "Failed to create vault.");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06040a", color: "#f0eaf8" }}>
      <Nav />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 40px 80px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Create a Vault
        </h1>
        <p style={{ fontSize: 14, color: "#5a4870", marginBottom: 36 }}>
          Lock funds with your group. Rage quit and lose your penalty to those who stayed.
        </p>

        {/* Type */}
        <div style={{ marginBottom: 24 }}>
          <span style={label}>Type</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t.value)} style={{
                padding: "14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                background: type === t.value ? "rgba(239,68,68,0.12)" : "rgba(10,6,16,0.6)",
                border: type === t.value ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(239,68,68,0.08)",
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{t.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: type === t.value ? "#fca5a5" : "#9d8ec0" }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "#4a3860", marginTop: 2 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={label}>Vault name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bali Trip 2026" />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={label}>Description & commitment</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
            placeholder="Describe the commitment. What are you all locking in for?"
            style={{ resize: "vertical", lineHeight: 1.6 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <div>
            <label style={label}>Buy-in (RIAO)</label>
            <input type="number" value={buyIn} onChange={e => setBuyIn(e.target.value)} placeholder="e.g. 1000" />
          </div>
          <div>
            <label style={label}>Max members</label>
            <input type="number" min={2} max={20} value={maxMembers} onChange={e => setMaxMembers(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <div>
            <label style={label}>Rage quit penalty (%)</label>
            <input type="number" min={1} max={50} value={penaltyPct} onChange={e => setPenaltyPct(e.target.value)} />
            <div style={{ fontSize: 11, color: "#4a3860", marginTop: 4 }}>Quitters lose this % to survivors</div>
          </div>
          <div>
            <label style={label}>Min lock period (hours)</label>
            <input type="number" min={0} value={minLock} onChange={e => setMinLock(e.target.value)} />
            <div style={{ fontSize: 11, color: "#4a3860", marginTop: 4 }}>Can't quit before this window</div>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={label}>Deadline</label>
          <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          <div style={{ fontSize: 11, color: "#4a3860", marginTop: 4 }}>
            Reactive rule fires automatically at this moment
          </div>
        </div>

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 9, marginBottom: 16,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#fca5a5", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting} style={{
          width: "100%", padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: 700,
          background: submitting ? "rgba(239,68,68,0.3)" : "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "#fff", border: "none", cursor: submitting ? "not-allowed" : "pointer",
        }}>
          {submitting ? "Creating…" : "🔒 Create Vault"}
        </button>
      </div>
    </div>
  );
}
