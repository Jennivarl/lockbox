"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";
import { Vault, DollarSign, Users, Clock, AlertCircle, ArrowLeft, Sun, Dumbbell, Building, KeyRound } from "lucide-react";
import Nav from "@/components/Nav";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

const font = '"Space Mono", "Courier New", monospace';

const TYPES = [
  { value: "savings",        label: "Savings",       Icon: Sun,       desc: "Saving toward a shared goal" },
  { value: "accountability", label: "Accountability", Icon: Dumbbell,  desc: "Habit or commitment pact" },
  { value: "dao",            label: "DAO / Team",     Icon: Building,  desc: "Team or treasury lock" },
  { value: "vesting",        label: "Vesting",        Icon: KeyRound,  desc: "Founder or contributor lock-up" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 8, fontSize: 14,
  fontFamily: font, background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.18)",
  color: "#000000", outline: "none",
};

export default function NewVault() {
  const router = useRouter();
  const { ready, authenticated, login, peerId, peerName } = useAuth();

  useEffect(() => {
    if (ready && !authenticated) login();
  }, [ready, authenticated]);

  const [type,       setType]       = useState("savings");
  const [name,       setName]       = useState("");
  const [desc,       setDesc]       = useState("");
  const [buyIn,      setBuyIn]      = useState("");
  const [maxMembers, setMaxMembers] = useState("5");
  const [penaltyPct, setPenaltyPct] = useState("20");
  const [minLock,    setMinLock]    = useState("48");
  const [deadline,   setDeadline]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !desc.trim() || !buyIn || !deadline) {
      setError("All fields are required."); return;
    }
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

  const label = (text: string) => (
    <label style={{ display: "block", fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000000", marginBottom: 8, letterSpacing: "0.03em" }}>{text}</label>
  );
  const hint = (icon: React.ElementType, text: string) => {
    const Icon = icon;
    return (
      <p style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: font, fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>
        <Icon style={{ width: 12, height: 12 }} /> {text}
      </p>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 32px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: font, fontSize: 13, color: "#6B6B6B", background: "none",
            border: "none", cursor: "pointer", padding: 0,
          }}>
            <ArrowLeft style={{ width: 15, height: 15 }} /> Vaults
          </button>
          <Link href="/" style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none" }}>
            Home
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <h1 style={{ fontFamily: font, fontSize: 32, fontWeight: 900, color: "#000000", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Create a Vault
          </h1>
          <p style={{ fontFamily: font, fontSize: 14, color: "#6B6B6B", marginBottom: 36, lineHeight: 1.6 }}>
            Lock funds with your group. Rage quit early and lose your penalty to those who stayed.
          </p>

          {/* Type */}
          <div style={{ marginBottom: 28 }}>
            {label("Vault Type")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {TYPES.map(t => (
                <button key={t.value} onClick={() => setType(t.value)} style={{
                  padding: "16px 10px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                  background: type === t.value ? "#000000" : "#FFFFFF",
                  border: `1px solid ${type === t.value ? "#000000" : "rgba(0,0,0,0.1)"}`,
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                    <t.Icon style={{ width: 22, height: 22, color: type === t.value ? "#FFFFFF" : "#000000" }} strokeWidth={1.8} />
                  </div>
                  <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: type === t.value ? "#FFFFFF" : "#000000", letterSpacing: "0.04em" }}>
                    {t.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            {label("Vault name")}
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bali Trip 2026" />
          </div>

          <div style={{ marginBottom: 20 }}>
            {label("Description & commitment")}
            <textarea style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 } as React.CSSProperties}
              value={desc} onChange={e => setDesc(e.target.value)} rows={4}
              placeholder="Describe the commitment. What are you all locking in for?" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              {label("Buy-in (RIAO)")}
              <input style={inputStyle} type="number" value={buyIn} onChange={e => setBuyIn(e.target.value)} placeholder="e.g. 1000" />
              {hint(DollarSign, "Per member")}
            </div>
            <div>
              {label("Max members")}
              <input style={inputStyle} type="number" min={2} max={20} value={maxMembers} onChange={e => setMaxMembers(e.target.value)} />
              {hint(Users, "Vault capacity")}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              {label("Rage quit penalty (%)")}
              <input style={inputStyle} type="number" min={1} max={100} value={penaltyPct} onChange={e => setPenaltyPct(e.target.value)} />
              {hint(AlertCircle, "Quitters lose this %")}
            </div>
            <div>
              {label("Min lock period (hours)")}
              <input style={inputStyle} type="number" min={0} value={minLock} onChange={e => setMinLock(e.target.value)} />
              {hint(Clock, "Can't quit before this")}
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            {label("Deadline")}
            <input style={inputStyle} type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
            <p style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>Reactive rule fires automatically at this moment</p>
          </div>

          {/* Info box */}
          <div style={{ borderRadius: 10, padding: "16px 20px", marginBottom: 28, background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", gap: 12 }}>
              <Vault style={{ width: 18, height: 18, color: "#000000", flexShrink: 0, marginTop: 2 }} strokeWidth={1.8} />
              <div>
                <div style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000000", marginBottom: 4 }}>How it works</div>
                <p style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", lineHeight: 1.6 }}>
                  Members who quit early lose their penalty %. That amount is redistributed instantly to everyone who stays.
                  Survivors at deadline share the full pot.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ borderRadius: 8, padding: "12px 16px", marginBottom: 20, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", fontFamily: font, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={submitting} size="lg" style={{ width: "100%", justifyContent: "center" } as React.CSSProperties}>
            <Vault style={{ width: 17, height: 17 }} strokeWidth={1.8} />
            {submitting ? "Creating…" : "Create Vault"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
