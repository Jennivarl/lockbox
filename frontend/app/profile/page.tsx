"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Save, CheckCircle2, PiggyBank, Dumbbell, Building2, Lock } from "lucide-react";
import Nav from "@/components/Nav";
import { useAuth } from "@/lib/useAuth";
import { useBalance } from "@/lib/useBalance";
import { useProfile, AVATAR_COLORS } from "@/lib/useProfile";
import { api } from "@/lib/api";
import type { Vault } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';

const TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  savings:        { icon: PiggyBank, color: "#059669" },
  accountability: { icon: Dumbbell,  color: "#7C3AED" },
  dao:            { icon: Building2, color: "#2563EB" },
  vesting:        { icon: Lock,      color: "#D97706" },
};

function BigAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(/[\s@._\-]+/)
    .map(w => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";
  return (
    <div style={{
      width: 88, height: 88, borderRadius: 22,
      background: color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontFamily: font, fontSize: 28, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
        {initials}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { authenticated, login, peerId, peerName } = useAuth();
  const { balance } = useBalance();
  const { profile, save, loaded } = useProfile();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [saved, setSaved] = useState(false);
  const [vaults, setVaults] = useState<Vault[]>([]);

  useEffect(() => {
    if (loaded) {
      setDisplayName(profile.displayName || peerName);
      setBio(profile.bio);
      setAvatarColor(profile.avatarColor);
    }
  }, [loaded, peerName]);

  useEffect(() => {
    api.vaults().then((vs: Vault[]) => setVaults(vs)).catch(() => {});
  }, []);

  const myActive = vaults.filter(v =>
    v.members.some(m => m.peer_id === peerId && m.status === "active") ||
    (v.creator_id === peerId && (v.status === "filling" || v.status === "active"))
  );
  const survived = vaults.filter(v =>
    v.status === "completed" &&
    v.members.some(m => m.peer_id === peerId && m.status === "paid")
  );
  const totalLocked = myActive
    .flatMap(v => v.members)
    .filter(m => m.peer_id === peerId && m.status === "active")
    .reduce((s, m) => s + m.amount_locked, 0);

  const handleSave = () => {
    save({ displayName, bio, avatarColor });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const label = displayName || peerName;
  const shortId = peerId.length > 22 ? peerId.slice(0, 10) + "…" + peerId.slice(-8) : peerId;

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 32px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
          <button onClick={() => router.back()} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: font, fontSize: 13, color: "#6B6B6B",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}>
            <ArrowLeft style={{ width: 15, height: 15 }} /> Back
          </button>
          <Link href="/" style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none" }}>
            Home
          </Link>
        </div>

        {!authenticated ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: font, fontSize: 15, color: "#6B6B6B", marginBottom: 20 }}>
              Sign in to view your profile
            </div>
            <button onClick={login} style={{
              padding: "12px 28px", borderRadius: 10, fontFamily: font,
              fontSize: 13, fontWeight: 700, letterSpacing: "0.06em",
              background: "#000000", color: "#FFFFFF", border: "none", cursor: "pointer",
            }}>
              Sign In
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>

            {/* LEFT */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
              style={{ borderRadius: 16, padding: 28, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)" }}>

              {/* Preview */}
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
                <BigAvatar name={label} color={avatarColor} />
                <div>
                  <div style={{ fontFamily: font, fontSize: 22, fontWeight: 900, color: "#000000", letterSpacing: "-0.02em" }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B", marginTop: 4 }}>
                    {shortId}
                  </div>
                  {bio && (
                    <div style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", marginTop: 8, lineHeight: 1.65, maxWidth: 320 }}>
                      {bio}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(0,0,0,0.07)", marginBottom: 24 }} />

              <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 18 }}>
                Edit Profile
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontFamily: font, fontSize: 11, color: "#6B6B6B", marginBottom: 7, letterSpacing: "0.04em" }}>
                  Display Name
                </label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={peerName}
                  maxLength={40}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 9,
                    fontFamily: font, fontSize: 14, color: "#000000",
                    background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.1)",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: "block", fontFamily: font, fontSize: 11, color: "#6B6B6B", marginBottom: 7, letterSpacing: "0.04em" }}>
                  Bio <span style={{ color: "#BBBBBB" }}>({bio.length}/120)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 120))}
                  placeholder="DeFi builder. Locking in since 2024."
                  rows={3}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 9,
                    fontFamily: font, fontSize: 13, color: "#000000",
                    background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.1)",
                    outline: "none", resize: "none", lineHeight: 1.65,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 26 }}>
                <label style={{ display: "block", fontFamily: font, fontSize: 11, color: "#6B6B6B", marginBottom: 10, letterSpacing: "0.04em" }}>
                  Avatar Color
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => setAvatarColor(c)} style={{
                      width: 34, height: 34, borderRadius: 9, background: c,
                      border: avatarColor === c ? "3px solid #000000" : "3px solid transparent",
                      outline: avatarColor === c ? "2px solid rgba(0,0,0,0.15)" : "none",
                      outlineOffset: 1,
                      cursor: "pointer",
                      transform: avatarColor === c ? "scale(1.12)" : "scale(1)",
                      transition: "transform 0.12s",
                    }} />
                  ))}
                </div>
              </div>

              <button onClick={handleSave} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 26px", borderRadius: 10,
                fontFamily: font, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
                background: saved ? "#059669" : "#000000", color: "#FFFFFF",
                border: "none", cursor: "pointer", transition: "background 0.25s",
              }}>
                {saved
                  ? <><CheckCircle2 style={{ width: 15, height: 15 }} /> Saved</>
                  : <><Save style={{ width: 15, height: 15 }} /> Save Changes</>}
              </button>
            </motion.div>

            {/* RIGHT */}
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}
                style={{
                  borderRadius: 14, padding: "22px",
                  background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.22)",
                  marginBottom: 16,
                }}>
                <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#059669", marginBottom: 8 }}>
                  RIAO Balance
                </div>
                <div style={{ fontFamily: font, fontSize: 36, fontWeight: 900, color: "#059669", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {balance.toLocaleString()}
                </div>
                <div style={{ fontFamily: font, fontSize: 11, color: "#059669", opacity: 0.65, marginTop: 5 }}>RIAO</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.14 }}
                style={{ borderRadius: 14, padding: "22px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)", marginBottom: 16 }}>
                <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 16 }}>
                  Activity
                </div>
                {[
                  { label: "Active vaults",   value: myActive.length,                  color: "#2563EB" },
                  { label: "Vaults survived",  value: survived.length,                  color: "#059669" },
                  { label: "RIAO locked",      value: `${totalLocked.toLocaleString()}`, color: "#D97706" },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
                    <span style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B" }}>{s.label}</span>
                    <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </motion.div>

              {myActive.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
                  <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 10 }}>
                    My Vaults
                  </div>
                  {myActive.map(v => {
                    const m = TYPE_META[v.type] ?? TYPE_META.vesting;
                    const Icon = m.icon;
                    return (
                      <Link key={v.id} href={`/vaults/${v.id}`} style={{ textDecoration: "none", display: "block" }}>
                        <div style={{
                          borderRadius: 10, padding: "12px 14px", marginBottom: 8,
                          background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
                          display: "flex", alignItems: "center", gap: 10,
                        }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            background: `${m.color}12`, border: `1px solid ${m.color}25`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Icon style={{ width: 14, height: 14, color: m.color }} strokeWidth={1.8} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: "#000000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {v.name}
                            </div>
                            <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginTop: 2 }}>
                              {v.buy_in.toLocaleString()} RIAO · {v.status}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
