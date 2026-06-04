"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { ReactiveEvent } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';

interface QuitRecord {
  id: string;
  quitter: string;
  vault_name: string;
  vault_id: string;
  penalty: number;
  penalty_pct: number;
  survivors: number;
  fired_at: string;
}

function timeAgo(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ShamePage() {
  const [quits, setQuits] = useState<QuitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPenalties, setTotalPenalties] = useState(0);

  useEffect(() => {
    api.feed(200).then((events: ReactiveEvent[]) => {
      const rq = events
        .filter(e => e.event_type === "rage_quit")
        .map(e => ({
          id: e.id,
          quitter: e.payload.quitter as string,
          vault_name: (e.summary.match(/"([^"]+)"/) || [])[1] ?? "Unknown Vault",
          vault_id: e.payload.vault_id as string,
          penalty: e.payload.penalty as number,
          penalty_pct: (e.payload.penalty_pct as number) ?? 0,
          survivors: ((e.payload.survivors as string[]) ?? []).length,
          fired_at: e.fired_at,
        }))
        .sort((a, b) => b.penalty - a.penalty);
      setQuits(rq);
      setTotalPenalties(rq.reduce((s, r) => s + r.penalty, 0));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ borderRadius: 16, padding: "32px 36px", background: "#1A0000", marginBottom: 28, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.08, userSelect: "none" }}>💀</div>
          <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FF6B6B", marginBottom: 10 }}>
            Hall of Shame
          </div>
          <h1 style={{ fontFamily: font, fontSize: 28, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 10px", lineHeight: 1.1 }}>
            They quit.<br />They paid.
          </h1>
          <p style={{ fontFamily: font, fontSize: 13, color: "#999999", margin: "0 0 20px", lineHeight: 1.6 }}>
            Every rage quit, ranked by the penalty forfeited to those who stayed.
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div style={{ fontFamily: font, fontSize: 24, fontWeight: 900, color: "#DC2626", letterSpacing: "-0.02em" }}>
                {quits.length}
              </div>
              <div style={{ fontFamily: font, fontSize: 10, color: "#666666", marginTop: 2 }}>rage quits</div>
            </div>
            <div>
              <div style={{ fontFamily: font, fontSize: 24, fontWeight: 900, color: "#FF6B6B", letterSpacing: "-0.02em" }}>
                {totalPenalties.toLocaleString()}
              </div>
              <div style={{ fontFamily: font, fontSize: 10, color: "#666666", marginTop: 2 }}>RIAO forfeited</div>
            </div>
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", textAlign: "center", padding: "40px 0" }}>Loading…</div>
        ) : quits.length === 0 ? (
          <div style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", textAlign: "center", padding: "40px 0" }}>
            No rage quits yet. Everyone is holding the line.
          </div>
        ) : (
          <div>
            {quits.map((q, i) => (
              <motion.div key={q.id}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: 12, padding: "16px 20px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 10 }}>

                {/* Rank */}
                <div style={{ width: 32, height: 32, borderRadius: 8, background: i === 0 ? "#DC2626" : i === 1 ? "#EA580C" : i === 2 ? "#D97706" : "#EDF0F5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: font, fontSize: 12, fontWeight: 900, color: i < 3 ? "#FFFFFF" : "#6B6B6B" }}>
                    #{i + 1}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000000", marginBottom: 3 }}>
                    {q.quitter}
                  </div>
                  <Link href={`/vaults/${q.vault_id}`} style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B", textDecoration: "none" }}>
                    {q.vault_name}
                  </Link>
                </div>

                {/* Penalty */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: font, fontSize: 16, fontWeight: 900, color: "#DC2626", letterSpacing: "-0.02em" }}>
                    -{q.penalty.toLocaleString()} RIAO
                  </div>
                  <div style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B", marginTop: 2 }}>
                    {timeAgo(q.fired_at)} · {q.survivors} survivor{q.survivors !== 1 ? "s" : ""} gained
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/vaults" style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", textDecoration: "none" }}>
            ← Back to Vaults
          </Link>
        </div>
      </div>
    </div>
  );
}
