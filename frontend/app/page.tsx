"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Lock, Shield, Target, ArrowRight } from "lucide-react";
import Nav from "@/components/Nav";
import { OrganicBlob } from "@/components/OrganicBlob";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import type { Stats } from "@/lib/types";

const STEPS = [
  { icon: Lock,   title: "Lock Your Stake",  desc: "Create a vault, set your buy-in and deadline. Everyone commits by locking RIAO." },
  { icon: Shield, title: "Hold the Line",     desc: "Stay committed. Others who quit early forfeit their penalty % to everyone who stays." },
  { icon: Target, title: "Claim Rewards",     desc: "Survive to the deadline and claim your share of the full pot plus quitters' penalties." },
];

const font = '"Space Mono", "Courier New", monospace';

export default function Home() {
  const [stats, setStats] = useState<Stats>({ total_locked: 33250, active_vaults: 3, total_rage_quits: 4, total_vaults: 5, total_survivors: 6, total_peers: 9 });
  useEffect(() => { api.stats().then(s => setStats(s)).catch(() => null); }, []);
  const { authenticated, login } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4", position: "relative", overflow: "hidden" }}>
      {/* Subtle background blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -200, right: -200, width: 700, height: 700, opacity: 0.6 }}><OrganicBlob className="w-full h-full" /></div>
        <div style={{ position: "absolute", top: "40%", left: -280, width: 600, height: 600, opacity: 0.4 }}><OrganicBlob className="w-full h-full" /></div>
      </div>

      <Nav />

      {/* Hero */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "88px 32px 64px", textAlign: "center", position: "relative", zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 99, marginBottom: 32,
            background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.12)",
            fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#000000",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
            Powered by Rialo Reactive Rules
          </div>

          <h1 style={{ fontFamily: font, fontSize: 64, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.08, marginBottom: 24 }}>
            Lock in. Hold the line. Get paid.
          </h1>

          <p style={{ fontFamily: font, fontSize: 18, color: "#6B6B6B", lineHeight: 1.75, maxWidth: 540, margin: "0 auto 44px" }}>
            Lock funds with your group as a public commitment. Anyone who walks away early forfeits a penalty to everyone who stayed. Reach the deadline and the full pot is yours.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <Link href="/vaults" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "15px 36px", borderRadius: 8, fontSize: 15, fontWeight: 700,
              fontFamily: font, letterSpacing: "0.04em",
              background: "#000000", color: "#FFFFFF", textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
            }}>
              Explore Vaults <ArrowRight style={{ width: 18, height: 18 }} />
            </Link>
            {authenticated ? (
              <Link href="/vaults/new" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "15px 36px", borderRadius: 8, fontSize: 15, fontWeight: 600,
                fontFamily: font, letterSpacing: "0.04em",
                background: "transparent", color: "#000000",
                border: "1px solid rgba(0,0,0,0.25)", textDecoration: "none",
              }}>
                Create Vault
              </Link>
            ) : (
              <button onClick={login} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "15px 36px", borderRadius: 8, fontSize: 15, fontWeight: 600,
                fontFamily: font, letterSpacing: "0.04em",
                background: "transparent", color: "#000000",
                border: "1px solid rgba(0,0,0,0.25)", cursor: "pointer",
              }}>
                Create Vault
              </button>
            )}
          </div>
        </motion.div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(0,0,0,0.07)" }} />

      {/* Live Stats — full bleed */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
        {[
          { label: "RIAO locked right now", value: stats.total_locked.toLocaleString(), accent: "#059669", tint: "#064e35" },
          { label: "Active vaults",          value: String(stats.active_vaults),        accent: "#2563EB", tint: "#0f2d6b" },
          { label: "Rage quits fired",       value: String(stats.total_rage_quits),     accent: "#DC2626", tint: "#6b0f0f" },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.45 }}
            style={{
              padding: "48px 56px",
              borderTop: `2px solid ${s.accent}`,
              borderRight: i < 2 ? "1px solid rgba(0,0,0,0.07)" : "none",
              background: `${s.accent}10`,
            }}>
            <div style={{ fontFamily: '"Space Mono", "Courier New", monospace', fontSize: 32, fontWeight: 700, color: s.tint, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 12 }}>
              {s.value ?? "—"}
            </div>
            <div style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", letterSpacing: "0.01em" }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(0,0,0,0.07)" }} />

      {/* How It Works */}
      <section style={{ maxWidth: 1060, margin: "0 auto", padding: "60px 32px 80px", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#444444", marginBottom: 12 }}>How it works</p>
          <h2 style={{ fontFamily: font, fontSize: 36, fontWeight: 900, color: "#000000", letterSpacing: "-0.02em" }}>Three steps to commitment</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {STEPS.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
              style={{
                borderRadius: 16, padding: "36px 28px",
                background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.08)",
              }}>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 52, height: 52, borderRadius: 14, marginBottom: 18,
                background: "#000000",
              }}>
                <s.icon style={{ width: 24, height: 24, color: "#FFFFFF" }} strokeWidth={1.8} />
              </div>
              <h3 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: "#000000", marginBottom: 10, letterSpacing: "-0.01em" }}>{s.title}</h3>
              <p style={{ fontFamily: font, fontSize: 14, color: "#6B6B6B", lineHeight: 1.7 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Reactive rule callout */}
        <div style={{
          marginTop: 28, borderRadius: 16, padding: "32px 36px",
          background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.08)",
        }}>
          <p style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 16 }}>
            Rialo Reactive Rules
          </p>
          <div style={{ fontFamily: "monospace", fontSize: 13, lineHeight: 2.2 }}>
            <div>
              <span style={{ color: "#7C3AED" }}>ON</span>{" "}
              <span style={{ color: "#000000" }}>rage_quit</span>{" "}
              <span style={{ color: "#7C3AED" }}>→</span>{" "}
              <span style={{ color: "#DC2626" }}>SLASH</span>{" "}
              <span style={{ color: "#374151" }}>penalty%</span>{" "}
              <span style={{ color: "#9B9B9B" }}>+</span>{" "}
              <span style={{ color: "#059669" }}>REDISTRIBUTE</span>{" "}
              <span style={{ color: "#9B9B9B" }}>to</span>{" "}
              <span style={{ color: "#000000" }}>active_members</span>
            </div>
            <div>
              <span style={{ color: "#7C3AED" }}>ON</span>{" "}
              <span style={{ color: "#000000" }}>deadline_reached</span>{" "}
              <span style={{ color: "#7C3AED" }}>→</span>{" "}
              <span style={{ color: "#059669" }}>RELEASE payout</span>{" "}
              <span style={{ color: "#9B9B9B" }}>to</span>{" "}
              <span style={{ color: "#000000" }}>all_survivors</span>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "28px 0" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 32px", textAlign: "center", fontFamily: font, fontSize: 13, color: "#444444" }}>
          © 2026 Lockbox · Built on Rialo reactive rules
        </div>
      </footer>
    </div>
  );
}
