"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { Stats } from "@/lib/types";

const STEPS = [
  { icon: "🔒", title: "Lock in", desc: "Create a vault, set your buy-in and deadline. Everyone commits by locking RIAO." },
  { icon: "💀", title: "Rage quit (optional)", desc: "Anyone can leave early — but they lose 20% of their stake. That penalty splits instantly among those who stayed." },
  { icon: "🏆", title: "Survivors get paid", desc: "When the deadline hits, the reactive rule fires automatically. Full pot released to everyone who held the line." },
];

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => null);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#06040a", color: "#f0eaf8" }}>
      <Nav />

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 40px 60px", textAlign: "center" }}>
        <div style={{
          display: "inline-block", padding: "4px 14px", borderRadius: 99,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          fontSize: 12, fontWeight: 700, color: "#fca5a5", letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: 28,
        }}>
          Powered by Rialo Reactive Rules
        </div>

        <h1 style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
          Lock in.{" "}
          <span style={{ color: "#ef4444" }}>Hold the line.</span>
          <br />Get paid.
        </h1>

        <p style={{ fontSize: 18, color: "#7a6080", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
          Commit with your group. Rage quit early and lose 20%
          to the people who stayed. Survive to the deadline and
          everyone gets their money back — plus the quitters' penalty.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/vaults/new" style={{
            padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700,
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "#fff",
          }}>
            Create a Vault
          </Link>
          <Link href="/vaults" style={{
            padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5",
          }}>
            Browse Vaults
          </Link>
        </div>
      </div>

      {/* Live stats */}
      {stats && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 40px 60px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { label: "RIAO locked right now", value: stats.total_locked.toLocaleString(), unit: "RIAO" },
              { label: "Rage quits fired",      value: stats.total_rage_quits, unit: "total" },
              { label: "Active vaults",         value: stats.active_vaults,    unit: "running" },
            ].map(s => (
              <div key={s.label} style={{
                padding: "24px", borderRadius: 14, textAlign: "center",
                background: "rgba(10,6,16,0.8)",
                border: "1px solid rgba(239,68,68,0.1)",
              }}>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em", color: "#f0eaf8" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 4 }}>
                  {s.unit}
                </div>
                <div style={{ fontSize: 12, color: "#4a3860", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 40px 100px" }}>
        <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#4a3860", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 32 }}>
          How it works
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              padding: "28px 24px", borderRadius: 14,
              background: "rgba(10,6,16,0.6)",
              border: "1px solid rgba(239,68,68,0.08)",
            }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f0eaf8", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#5a4870", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Reactive rule callout */}
        <div style={{
          marginTop: 40, padding: "20px 24px", borderRadius: 12,
          background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
          fontFamily: "monospace", fontSize: 13,
        }}>
          <div style={{ color: "#6b5880", marginBottom: 6, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Rialo Reactive Rule
          </div>
          <div style={{ color: "#fca5a5" }}>
            <span style={{ color: "#7c6fa0" }}>ON</span> deadline_reached{" "}
            <span style={{ color: "#7c6fa0" }}>WHERE</span> active_members {">"} 0{" "}
            <span style={{ color: "#7c6fa0" }}>→</span>{" "}
            <span style={{ color: "#10b981" }}>RELEASE payout to all survivors</span>
          </div>
          <div style={{ color: "#fca5a5", marginTop: 6 }}>
            <span style={{ color: "#7c6fa0" }}>ON</span> rage_quit{" "}
            <span style={{ color: "#7c6fa0" }}>→</span>{" "}
            <span style={{ color: "#ef4444" }}>SLASH penalty% + REDISTRIBUTE to survivors</span>
          </div>
        </div>
      </div>
    </div>
  );
}
