"use client";
import Link from "next/link";
import Nav from "@/components/Nav";
import { ArrowLeft, CheckCircle2, Circle, Clock, Rocket, Shield, Globe, Smartphone, BarChart3, Vote } from "lucide-react";

const font = '"Space Mono", "Courier New", monospace';

const PHASES = [
  {
    phase: "Phase 1",
    period: "Q2 2026",
    title: "Protocol Launch",
    status: "completed",
    color: "#059669",
    icon: Rocket,
    items: [
      { done: true,  text: "Reactive rules engine (rage quit → slash + redistribute, deadline → payout, vault full → activate)" },
      { done: true,  text: "Four vault types: Savings, Accountability, DAO, Vesting" },
      { done: true,  text: "Privy authentication (wallet, email, Google OAuth)" },
      { done: true,  text: "Creator invite system — whitelist participants before vault fills" },
      { done: true,  text: "Lock-in confirmation modal with simulated RIAO balance deduction" },
      { done: true,  text: "Reactive event feed and leaderboard" },
      { done: true,  text: "Production deployment on Vercel + Railway" },
      { done: true,  text: "Open API with full documentation" },
    ],
  },
  {
    phase: "Phase 2",
    period: "Q3 2026",
    title: "On-Chain Smart Contracts",
    status: "upcoming",
    color: "#2563EB",
    icon: Shield,
    items: [
      { done: false, text: "Deploy Lockbox Vault contracts on Rialo mainnet" },
      { done: false, text: "Migrate reactive rules from off-chain simulation to native Rialo reactive rules" },
      { done: false, text: "RIAO token integration — real on-chain buy-ins and payouts" },
      { done: false, text: "Full non-custodial guarantees — no backend holds funds" },
      { done: false, text: "On-chain audit trail for all rule executions" },
      { done: false, text: "Smart contract audit (Mustapha Abdulaziz Dambatta)" },
    ],
  },
  {
    phase: "Phase 3",
    period: "Q4 2026",
    title: "Reputation & Token-Gating",
    status: "planned",
    color: "#7C3AED",
    icon: Globe,
    items: [
      { done: false, text: "On-chain survival score — follows your wallet across vaults and chains" },
      { done: false, text: "Token-gated vaults — require holding specific token or NFT to join" },
      { done: false, text: "Reputation-based vault discovery — filter by track record" },
      { done: false, text: "Vault templates — one-click creation for common use cases (30-day challenges, DAO budgets, founder lock-ups)" },
      { done: false, text: "Public reputation API — surface survival scores to third-party apps" },
    ],
  },
  {
    phase: "Phase 4",
    period: "Q1 2027",
    title: "Cross-Chain & Mobile",
    status: "planned",
    color: "#D97706",
    icon: Smartphone,
    items: [
      { done: false, text: "Cross-chain vaults — members from different chains locking into the same commitment" },
      { done: false, text: "Native iOS and Android apps with push notifications for deadline warnings and rage quit alerts" },
      { done: false, text: "Chain-agnostic vault discovery — browse vaults across all supported networks" },
      { done: false, text: "Mobile wallet integration — WalletConnect, Coinbase Wallet, MetaMask Mobile" },
    ],
  },
  {
    phase: "Phase 5",
    period: "Q2 2027+",
    title: "DAO Governance & Analytics",
    status: "planned",
    color: "#0891B2",
    icon: Vote,
    items: [
      { done: false, text: "DAO governance — vault members vote on extending deadlines or adjusting rules before execution" },
      { done: false, text: "Public analytics dashboard — commitment rates, survival percentages, penalty flows by vault type" },
      { done: false, text: "Treasury vaults — recurring lock schedules for DAO budget management" },
      { done: false, text: "Vault composability — chain multiple vault commitments into a single meta-commitment" },
      { done: false, text: "Developer SDK — TypeScript + Python client libraries for building on Lockbox" },
    ],
  },
];

const STATUS_CONFIG = {
  completed: { label: "Complete",  bg: "rgba(5,150,105,0.1)",  border: "rgba(5,150,105,0.25)",  text: "#059669" },
  upcoming:  { label: "In Progress", bg: "rgba(37,99,235,0.1)", border: "rgba(37,99,235,0.25)", text: "#2563EB" },
  planned:   { label: "Planned",   bg: "rgba(0,0,0,0.05)",     border: "rgba(0,0,0,0.12)",       text: "#6B6B6B" },
};

export default function RoadmapPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <Link href="/docs" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none" }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Docs
          </Link>
          <Link href="/" style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none" }}>Home</Link>
        </div>

        {/* Header */}
        <div style={{ borderRadius: 16, padding: "36px 40px", background: "#000000", marginBottom: 36 }}>
          <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 12 }}>
            Lockbox Protocol · Roadmap
          </div>
          <h1 style={{ fontFamily: font, fontSize: 30, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.03em", margin: "0 0 12px", lineHeight: 1.1 }}>
            Building the Commitment Layer
          </h1>
          <p style={{ fontFamily: font, fontSize: 13, color: "#AAAAAA", margin: "0 0 24px", lineHeight: 1.75 }}>
            From protocol simulation to on-chain reactive rules — our path to becoming the commitment primitive for decentralised coordination.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.text }} />
                <span style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: 28, top: 0, bottom: 0, width: 2, background: "rgba(0,0,0,0.12)" }} />

          {PHASES.map((phase, phaseIdx) => {
            const cfg = STATUS_CONFIG[phase.status as keyof typeof STATUS_CONFIG];
            const Icon = phase.icon;
            return (
              <div key={phase.phase} style={{ display: "flex", gap: 24, marginBottom: 32, position: "relative" }}>

                {/* Icon dot */}
                <div style={{
                  width: 58, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: phase.status === "completed" ? phase.color : "#FFFFFF",
                    border: `2px solid ${phase.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 8,
                  }}>
                    <Icon style={{ width: 18, height: 18, color: phase.status === "completed" ? "#FFFFFF" : phase.color }} strokeWidth={1.8} />
                  </div>
                </div>

                {/* Card */}
                <div style={{ flex: 1, borderRadius: 14, padding: "22px 24px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)", borderLeft: `3px solid ${phase.color}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: phase.color }}>
                          {phase.phase}
                        </span>
                        <span style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>·</span>
                        <span style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>{phase.period}</span>
                      </div>
                      <h3 style={{ fontFamily: font, fontSize: 17, fontWeight: 900, color: "#000000", margin: 0, letterSpacing: "-0.02em" }}>
                        {phase.title}
                      </h3>
                    </div>
                    <div style={{ padding: "5px 12px", borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color: cfg.text, letterSpacing: "0.04em" }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {phase.items.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        {item.done
                          ? <CheckCircle2 style={{ width: 15, height: 15, color: "#059669", flexShrink: 0, marginTop: 1 }} />
                          : <Circle style={{ width: 15, height: 15, color: "#CCCCCC", flexShrink: 0, marginTop: 1 }} />
                        }
                        <span style={{ fontFamily: font, fontSize: 12, color: item.done ? "#333333" : "#6B6B6B", lineHeight: 1.6 }}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ borderRadius: 14, padding: "24px 28px", background: "#000000", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: font, fontSize: 14, fontWeight: 900, color: "#FFFFFF", marginBottom: 4 }}>
              Start locking in today
            </div>
            <div style={{ fontFamily: font, fontSize: 12, color: "#9B9B9B" }}>
              Phase 1 is live. Join an existing vault or create your own.
            </div>
          </div>
          <Link href="/vaults" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "11px 22px", borderRadius: 10,
            fontFamily: font, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
            background: "#FFFFFF", color: "#000000", textDecoration: "none",
          }}>
            Open App →
          </Link>
        </div>

      </div>
    </div>
  );
}
