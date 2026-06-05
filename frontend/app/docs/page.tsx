"use client";
import Link from "next/link";
import { useState } from "react";
import Nav from "@/components/Nav";
import {
  BookOpen, FileText, Map, ChevronRight,
  PiggyBank, Dumbbell, Building2, Lock,
  Zap, Users, Shield, Code2,
  Bell, DollarSign, UserX, Play,
  Rocket, Globe, Smartphone, Vote,
} from "lucide-react";

const font = '"Space Mono", "Courier New", monospace';

const SECTIONS = [
  { id: "overview",       label: "Protocol Overview" },
  { id: "rules",          label: "Reactive Rules" },
  { id: "vault-types",    label: "Vault Types" },
  { id: "economics",      label: "Economic Model" },
  { id: "state-machine",  label: "State Machine" },
  { id: "roadmap",        label: "Roadmap" },
  { id: "api",            label: "API Reference" },
];

const API_ENDPOINTS = [
  { method: "GET",  path: "/vaults",                          desc: "List all vaults (filter by status/type)" },
  { method: "POST", path: "/vaults",                          desc: "Create a new vault" },
  { method: "GET",  path: "/vaults/:id",                      desc: "Get vault detail with members" },
  { method: "POST", path: "/vaults/:id/join",                 desc: "Join a vault (lock funds)" },
  { method: "POST", path: "/vaults/:id/quit",                 desc: "Rage quit (penalty applied)" },
  { method: "POST", path: "/vaults/:id/requests",             desc: "Request to join a vault" },
  { method: "GET",  path: "/vaults/:id/requests",             desc: "List pending join requests" },
  { method: "POST", path: "/vaults/:id/requests/:rid/accept", desc: "Accept a join request" },
  { method: "POST", path: "/vaults/:id/requests/:rid/reject", desc: "Reject a join request" },
  { method: "POST", path: "/vaults/:id/trigger",              desc: "Trigger deadline (demo)" },
  { method: "GET",  path: "/feed",                            desc: "Reactive event feed" },
  { method: "GET",  path: "/leaderboard",                     desc: "Survivor rankings" },
  { method: "GET",  path: "/stats",                           desc: "Platform-wide statistics" },
];

const METHOD_COLOR: Record<string, string> = {
  GET: "#2563EB", POST: "#059669", DELETE: "#DC2626",
};

const VAULT_TYPES = [
  {
    icon: PiggyBank, color: "#059669",
    name: "Savings",
    tagline: "Save together, spend never (until deadline)",
    desc: "Group saving toward a shared goal — trips, down payments, emergency funds. Members commit to not touching the pot until the target date.",
    examples: ["Group vacation fund", "Emergency savings pact", "Down-payment club"],
  },
  {
    icon: Dumbbell, color: "#7C3AED",
    name: "Accountability",
    tagline: "Put your RIAO where your streak is",
    desc: "Habit and commitment pacts. Gym streaks, shipping challenges, daily build logs. Quit before the pact ends and lose your penalty to teammates.",
    examples: ["30-day build challenge", "Daily workout streak", "Content creator pact"],
  },
  {
    icon: Building2, color: "#2563EB",
    name: "DAO / Team",
    tagline: "Lock-in signals more than words",
    desc: "Treasury locks and contributor commitments. Core team members lock to signal long-term alignment with the protocol or project.",
    examples: ["Contributor commitment", "DAO treasury lock", "Working group pact"],
  },
  {
    icon: Lock, color: "#D97706",
    name: "Vesting",
    tagline: "Founder commitment, enforced by code",
    desc: "Founder and investor lock-ups. Lock RIAO for a set period as a public commitment to the project. Walk early, lose a percentage to co-founders.",
    examples: ["Founder vesting", "Investor cliff lock", "Advisor commitment"],
  },
];

const ROADMAP_PHASES = [
  { phase: "Phase 1", period: "Q2 2026", title: "Protocol Launch",             status: "completed", color: "#059669", icon: Rocket },
  { phase: "Phase 2", period: "Q3 2026", title: "On-Chain Smart Contracts",     status: "upcoming",  color: "#2563EB", icon: Shield },
  { phase: "Phase 3", period: "Q4 2026", title: "Reputation & Token-Gating",    status: "planned",   color: "#7C3AED", icon: Globe },
  { phase: "Phase 4", period: "Q1 2027", title: "Cross-Chain & Mobile",         status: "planned",   color: "#D97706", icon: Smartphone },
  { phase: "Phase 5", period: "Q2 2027", title: "DAO Governance & Analytics",   status: "planned",   color: "#0891B2", icon: Vote },
];

const STATUS_CONFIG = {
  completed: { label: "Live",        bg: "rgba(5,150,105,0.1)",  border: "rgba(5,150,105,0.3)",  text: "#059669" },
  upcoming:  { label: "In Progress", bg: "rgba(37,99,235,0.1)", border: "rgba(37,99,235,0.3)",  text: "#2563EB" },
  planned:   { label: "Planned",     bg: "rgba(0,0,0,0.05)",    border: "rgba(0,0,0,0.15)",     text: "#6B6B6B" },
};

export default function DocsPage() {
  const [active, setActive] = useState("overview");

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 32px", display: "flex", gap: 40, alignItems: "flex-start" }}>

        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0, position: "sticky", top: 84 }}>
          <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 14 }}>
            Documentation
          </div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 12px", borderRadius: 8, marginBottom: 2,
              fontFamily: font, fontSize: 12, fontWeight: active === s.id ? 700 : 400,
              color: active === s.id ? "#000000" : "#6B6B6B",
              background: active === s.id ? "rgba(0,0,0,0.07)" : "transparent",
              border: "none", cursor: "pointer", transition: "all 0.15s",
            }}>
              {s.label}
            </button>
          ))}
          <div style={{ height: 1, background: "rgba(0,0,0,0.1)", margin: "16px 0" }} />
          <Link href="/docs/whitepaper" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontFamily: font, fontSize: 12, color: "#000000", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", marginBottom: 8 }}>
            <FileText style={{ width: 13, height: 13 }} /> Whitepaper
          </Link>
          <Link href="/docs/roadmap" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontFamily: font, fontSize: 12, color: "#000000", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)" }}>
            <Map style={{ width: 13, height: 13 }} /> Roadmap
          </Link>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <div style={{ borderRadius: 16, padding: "36px 40px", background: "#000000", color: "#FFFFFF", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <BookOpen style={{ width: 20, height: 20, color: "#9B9B9B" }} />
              <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9B9B" }}>
                Lockbox Protocol v1.0 &middot; June 2026
              </span>
            </div>
            <h1 style={{ fontFamily: font, fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 14px", lineHeight: 1.1 }}>
              A Reactive Commitment Vault on Rialo
            </h1>
            <p style={{ fontFamily: font, fontSize: 13, color: "#BBBBBB", margin: "0 0 8px", lineHeight: 1.8 }}>
              <strong style={{ color: "#FFFFFF" }}>Abstract.</strong>{" "}
              Lockbox lets groups lock funds as a public on-chain commitment. Quit early and an automatic slash rule fires &mdash; redistributing your penalty to every survivor. Reach the deadline and the full pot is yours. No custodian. No manual trigger. Every action fires a reactive rule on the Rialo protocol layer.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
              {([
                { href: "/docs/whitepaper", label: "Technical Whitepaper", icon: FileText },
                { href: "/docs/roadmap",    label: "Full Roadmap",         icon: Map },
                { href: "/vaults",          label: "Open App",             icon: ChevronRight },
              ] as Array<{ href: string; label: string; icon: typeof FileText }>).map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 18px", borderRadius: 9,
                  fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                  background: "rgba(255,255,255,0.1)", color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.15)", textDecoration: "none",
                }}>
                  <Icon style={{ width: 12, height: 12 }} /> {label}
                </Link>
              ))}
            </div>
          </div>

          {/* 01 PROTOCOL OVERVIEW */}
          <section id="overview" style={{ marginBottom: 52 }}>
            <SectionHeader n="01" title="Protocol Overview" />
            <Prose>
              Lockbox addresses a fundamental coordination problem: how do groups make credible commitments without a trusted third party? Social pressure fails at scale. Legal contracts are slow and expensive. Custodians introduce counterparty risk.
            </Prose>
            <Prose>
              The Lockbox primitive is simple: a <strong>vault</strong> where participants lock equal buy-ins for a fixed period. The rules are set at creation and enforced by code &mdash; no admin can change them once the vault is live.
            </Prose>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {([
                { icon: Shield, color: "#059669", title: "Non-custodial", desc: "Funds are locked in the protocol. No admin key, no multisig, no operator can unilaterally move them." },
                { icon: Zap,    color: "#7C3AED", title: "Reactive",      desc: "Every event fires a deterministic rule instantly. No cron jobs, no manual triggers, no intermediary." },
                { icon: Users,  color: "#2563EB", title: "Group-native",  desc: "Designed for 2-20 participants with a shared goal, deadline, and equal buy-in." },
                { icon: Code2,  color: "#D97706", title: "Open API",      desc: "Every vault, event, and payout is queryable. Build dashboards, bots, and integrations on top." },
              ] as Array<{ icon: typeof Shield; color: string; title: string; desc: string }>).map(({ icon: Icon, color, title, desc }) => (
                <div key={title} style={{ borderRadius: 12, padding: "18px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderTop: "3px solid " + color }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: color + "12", border: "1px solid " + color + "24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 13, height: 13, color }} strokeWidth={1.8} />
                    </div>
                    <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: "#000000" }}>{title}</span>
                  </div>
                  <p style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", margin: 0, lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: 12, padding: "20px 24px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 14 }}>Key Terms</div>
              {[
                { term: "Vault",         def: "The core primitive. A shared pot with a deadline, penalty, and max members. Enforced entirely by reactive rules." },
                { term: "Buy-in",        def: "Equal amount every member deposits. Sum of all buy-ins = the pot." },
                { term: "Penalty",       def: "Percentage of buy-in forfeited on rage quit. Instantly redistributed to survivors." },
                { term: "Reactive Rule", def: "A rule that fires automatically when a triggering event occurs, with no off-chain coordination." },
                { term: "ReactiveEvent", def: "An immutable on-chain record emitted every time a rule fires. Forms the audit trail." },
                { term: "Survivor",      def: "A member who holds until the deadline. Receives full buy-in plus share of all accumulated penalties." },
              ].map(({ term, def }, i) => (
                <div key={term} style={{ borderBottom: i < 5 ? "1px solid rgba(0,0,0,0.06)" : "none", paddingBottom: 12, marginBottom: 12, display: "flex", gap: 16 }}>
                  <div style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: "#000000", width: 130, flexShrink: 0 }}>{term}</div>
                  <p style={{ fontFamily: font, fontSize: 12, color: "#444444", margin: 0, lineHeight: 1.65 }}>{def}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 02 REACTIVE RULES */}
          <section id="rules" style={{ marginBottom: 52 }}>
            <SectionHeader n="02" title="Reactive Rules" />
            <Prose>
              Lockbox uses Rialo&apos;s reactive execution model. Rules are registered at vault creation and fire deterministically in response to on-chain events.
            </Prose>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {([
                { trigger: "ON member_joined WHERE member_count = max_members", action: "ACTIVATE vault", icon: Play, color: "#2563EB", label: "Vault Activation", desc: "Fires the moment the last slot is filled. The vault transitions from FILLING to ACTIVE and the countdown begins." },
                { trigger: "ON rage_quit", action: "SLASH penalty_pct FROM quitter / REDISTRIBUTE pro-rata TO survivors", icon: UserX, color: "#DC2626", label: "Slash & Redistribute", desc: "Fires synchronously on quit. Penalty is calculated, deducted from the quitter, and split among all active survivors before the transaction settles." },
                { trigger: "ON deadline_reached", action: "RELEASE full_balance TO each survivor / MARK vault COMPLETED", icon: DollarSign, color: "#059669", label: "Payout Release", desc: "Fires at the deadline timestamp. Every surviving member receives their buy-in plus accumulated bonuses from all prior quitters." },
              ] as Array<{ trigger: string; action: string; icon: typeof Play; color: string; label: string; desc: string }>).map(({ trigger, action, icon: Icon, color, label, desc }) => (
                <div key={label} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: "#000000", borderLeft: "4px solid " + color }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: color + "28", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 13, height: 13, color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: font, fontSize: 10, color, fontWeight: 700, marginBottom: 3 }}>{trigger}</div>
                      <div style={{ fontFamily: font, fontSize: 10, color: "#FFFFFF" }}>{"→"} {action}</div>
                    </div>
                    <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{label}</span>
                  </div>
                  <div style={{ padding: "12px 18px", background: "#FFFFFF" }}>
                    <p style={{ fontFamily: font, fontSize: 12, color: "#555555", margin: 0, lineHeight: 1.65 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: 12, padding: "22px 24px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 16 }}>Event Pipeline</div>
              <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
                {([
                  { label: "On-chain\nEvent",    sub: "rage_quit\nmember_joined\ndeadline",        color: "#7C3AED", icon: Bell    },
                  { arrow: true },
                  { label: "Rule\nEngine",       sub: "Match trigger\nEvaluate conditions",        color: "#2563EB", icon: Zap     },
                  { arrow: true },
                  { label: "Execute\nAction",    sub: "Slash / Redistribute\nRelease / Activate",  color: "#DC2626", icon: Play    },
                  { arrow: true },
                  { label: "Emit\nReactiveEvent",sub: "Immutable log\nFeed + API",                 color: "#059669", icon: Bell    },
                ] as Array<{ arrow?: boolean; label?: string; sub?: string; color?: string; icon?: typeof Bell }>).map((node, i) => {
                  if (node.arrow) return (
                    <div key={i} style={{ color: "#CCCCCC", fontFamily: font, fontSize: 18, flexShrink: 0, padding: "0 8px" }}>{"→"}</div>
                  );
                  const { label, sub, color, icon: Icon } = node as { label: string; sub: string; color: string; icon: typeof Bell };
                  return (
                    <div key={i} style={{ flexShrink: 0, borderRadius: 10, padding: "12px 14px", background: color + "08", border: "1px solid " + color + "28", minWidth: 110, textAlign: "center" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: color + "18", border: "1px solid " + color + "30", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                        <Icon style={{ width: 12, height: 12, color }} />
                      </div>
                      <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color: "#000000", whiteSpace: "pre-line", lineHeight: 1.4, marginBottom: 6 }}>{label}</div>
                      <div style={{ fontFamily: font, fontSize: 9, color: "#9B9B9B", whiteSpace: "pre-line", lineHeight: 1.5 }}>{sub}</div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", margin: "14px 0 0", lineHeight: 1.65 }}>
                All rule executions emit a <code style={{ fontFamily: font, background: "rgba(0,0,0,0.06)", padding: "2px 5px", borderRadius: 4, fontSize: 11 }}>ReactiveEvent</code> stored permanently and surfaced in the live feed at <Link href="/feed" style={{ color: "#000000", fontWeight: 700 }}>/feed</Link>.
              </p>
            </div>
          </section>

          {/* 03 VAULT TYPES */}
          <section id="vault-types" style={{ marginBottom: 52 }}>
            <SectionHeader n="03" title="Vault Types" />
            <Prose>
              Lockbox supports four vault types. The type is cosmetic at the protocol level &mdash; reactive rules are identical across all &mdash; but signals intent, affects discoverability, and drives UI rendering.
            </Prose>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {VAULT_TYPES.map(({ icon: Icon, color, name, tagline, desc, examples }) => (
                <div key={name} style={{ borderRadius: 14, padding: "20px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderTop: "3px solid " + color }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: color + "12", border: "1px solid " + color + "28", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 15, height: 15, color }} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000000" }}>{name}</div>
                      <div style={{ fontFamily: font, fontSize: 10, color, marginTop: 1 }}>{tagline}</div>
                    </div>
                  </div>
                  <p style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", margin: "0 0 12px", lineHeight: 1.65 }}>{desc}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {examples.map(ex => (
                      <span key={ex} style={{ fontFamily: font, fontSize: 10, padding: "3px 9px", borderRadius: 20, background: color + "0C", border: "1px solid " + color + "22", color: "#444444" }}>{ex}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, textAlign: "right" }}>
              <Link href="/vaults" style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: "#6B6B6B", textDecoration: "none", letterSpacing: "0.04em" }}>
                Browse vaults by category
              </Link>
            </div>
          </section>

          {/* 04 ECONOMIC MODEL */}
          <section id="economics" style={{ marginBottom: 52 }}>
            <SectionHeader n="04" title="Economic Model" />
            <Prose>
              The economics of Lockbox align incentives: the longer you stay, the more you stand to gain from others quitting. Every quit increases the expected payout for survivors.
            </Prose>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Pot",          formula: "pot = buy_in x member_count",               note: "Fixed at vault activation." },
                { label: "Quit Penalty",        formula: "penalty = buy_in x (penalty_pct / 100)",    note: "Deducted from quitter immediately." },
                { label: "Per-Survivor Bonus",  formula: "bonus = penalty / n_active_survivors",      note: "Pro-rata at time of quit." },
                { label: "Final Payout",        formula: "payout_i = buy_in + sum(bonus_j)",          note: "Sum of bonuses from all prior quits." },
              ].map(({ label, formula, note }) => (
                <div key={label} style={{ borderRadius: 12, padding: "16px 18px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 10 }}>{label}</div>
                  <div style={{ borderRadius: 8, padding: "10px 14px", background: "#000000", fontFamily: font, fontSize: 12, color: "#A8E6CF", letterSpacing: "0.02em", marginBottom: 8 }}>{formula}</div>
                  <p style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B", margin: 0 }}>{note}</p>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: 12, padding: "20px 24px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 14 }}>
              <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 12 }}>Penalty Escalator</div>
              <Prose>
                The effective penalty grows linearly with elapsed vault time &mdash; doubling from base_pct at creation to 2x base_pct at the deadline (capped at 95%). Quitting near the deadline costs significantly more.
              </Prose>
              <div style={{ borderRadius: 8, padding: "12px 16px", background: "#000000", fontFamily: font, fontSize: 12, color: "#A8E6CF", letterSpacing: "0.02em" }}>
                effective_pct = min(base_pct x (1 + ratio), 95)<br />
                ratio = (now - created_at) / (deadline - created_at)
              </div>
            </div>

            <div style={{ borderRadius: 12, padding: "18px 22px", background: "#EDF0F5", border: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: 16 }}>
              <div style={{ width: 3, borderRadius: 99, background: "#059669", flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: "#000000", marginBottom: 6 }}>Positive feedback loop</div>
                <p style={{ fontFamily: font, fontSize: 12, color: "#444444", margin: 0, lineHeight: 1.65 }}>
                  Surviving members are financially incentivised to stay &mdash; every quit increases their expected payout. This creates a self-reinforcing dynamic that makes group commitments naturally more stable than social contracts alone.
                </p>
              </div>
            </div>
          </section>

          {/* 05 STATE MACHINE */}
          <section id="state-machine" style={{ marginBottom: 52 }}>
            <SectionHeader n="05" title="State Machine" />
            <Prose>
              Every vault is a state machine. The reactive rules engine drives all transitions automatically &mdash; no user action or admin trigger is required.
            </Prose>

            <div style={{ borderRadius: 12, padding: "28px 24px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap", overflowX: "auto" }}>
                <StateBox label="FILLING"   color="#2563EB" desc={"Members joining\nNot yet started"} />
                <StateArrow label="vault full" />
                <StateBox label="ACTIVE"    color="#7C3AED" desc={"Countdown live\nQuits incur penalty"} />
                <StateArrow label="deadline reached" />
                <StateBox label="COMPLETED" color="#059669" desc={"Survivors paid out\nVault closed"} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 2, height: 20, background: "rgba(0,0,0,0.15)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 80, height: 2, background: "rgba(0,0,0,0.15)" }} />
                    <StateBox label="DEAD" color="#9B9B9B" desc={"All members quit\nbefore fill/deadline"} small />
                    <div style={{ width: 80, height: 2, background: "rgba(0,0,0,0.15)" }} />
                  </div>
                  <div style={{ fontFamily: font, fontSize: 9, color: "#9B9B9B", marginTop: 4 }}>all members quit</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { state: "FILLING",   color: "#2563EB", desc: "Members can join. Each join fires member_joined. When max_members is reached the vault activates automatically." },
                { state: "ACTIVE",    color: "#7C3AED", desc: "Countdown running. Members can rage quit (penalty applies) but new members cannot join. Rules fire on every event." },
                { state: "COMPLETED", color: "#059669", desc: "Deadline reached. All surviving members have been paid out. The vault is permanently closed and immutable." },
                { state: "DEAD",      color: "#9B9B9B", desc: "All members quit before the vault was completed. No payout occurs; the vault is marked dead permanently." },
              ].map(({ state, color, desc }) => (
                <div key={state} style={{ borderRadius: 10, padding: "14px 16px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color }}>{state}</span>
                  </div>
                  <p style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B", margin: 0, lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 06 ROADMAP */}
          <section id="roadmap" style={{ marginBottom: 52 }}>
            <SectionHeader n="06" title="Roadmap" />
            <Prose>
              Lockbox launched in June 2026 as a protocol simulation on Rialo. The path to full on-chain deployment follows five phases.
            </Prose>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {ROADMAP_PHASES.map(({ phase, period, title, status, color, icon: Icon }) => {
                const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                return (
                  <div key={phase} style={{ borderRadius: 12, padding: "16px 20px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderLeft: "4px solid " + color, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: status === "completed" ? color : color + "14", border: "1px solid " + color + "28", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 16, height: 16, color: status === "completed" ? "#FFFFFF" : color }} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color, letterSpacing: "0.06em" }}>{phase}</span>
                        <span style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>&middot;</span>
                        <span style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>{period}</span>
                      </div>
                      <div style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000000" }}>{title}</div>
                    </div>
                    <div style={{ padding: "4px 12px", borderRadius: 20, background: cfg.bg, border: "1px solid " + cfg.border }}>
                      <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color: cfg.text, letterSpacing: "0.04em" }}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "right" }}>
              <Link href="/docs/roadmap" style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: "#6B6B6B", textDecoration: "none", letterSpacing: "0.04em" }}>
                View full roadmap with milestones
              </Link>
            </div>
          </section>

          {/* 07 API REFERENCE */}
          <section id="api" style={{ marginBottom: 48 }}>
            <SectionHeader n="07" title="API Reference" />
            <Prose>
              The Lockbox backend exposes a RESTful HTTP API. Base URL:{" "}
              <code style={{ fontFamily: font, background: "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>
                https://ragevault-api-production.up.railway.app
              </code>
            </Prose>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
              {API_ENDPOINTS.map((e, i) => (
                <div key={e.path} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "11px 16px",
                  background: i % 2 === 0 ? "#FFFFFF" : "#F7F8FA",
                  borderBottom: i < API_ENDPOINTS.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                }}>
                  <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color: METHOD_COLOR[e.method] ?? "#000", width: 36, flexShrink: 0 }}>{e.method}</span>
                  <code style={{ fontFamily: font, fontSize: 11, color: "#000000", flex: "0 0 auto" }}>{e.path}</code>
                  <span style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B", marginLeft: "auto", textAlign: "right" }}>{e.desc}</span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function SectionHeader({ n, title }: { n: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
      <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: "#BBBBBB" }}>{n}</span>
      <h2 style={{ fontFamily: font, fontSize: 20, fontWeight: 900, color: "#000000", margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: font, fontSize: 13, color: "#444444", margin: "0 0 14px", lineHeight: 1.75 }}>
      {children}
    </p>
  );
}

function StateBox({ label, color, desc, small }: { label: string; color: string; desc: string; small?: boolean }) {
  return (
    <div style={{
      borderRadius: small ? 8 : 10,
      padding: small ? "8px 14px" : "14px 18px",
      background: "#FFFFFF",
      border: "2px solid " + color,
      textAlign: "center",
      minWidth: small ? 110 : 130,
      flexShrink: 0,
    }}>
      <div style={{ fontFamily: font, fontSize: small ? 10 : 12, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: font, fontSize: 9, color: "#9B9B9B", whiteSpace: "pre-line", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

function StateArrow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 6px", flexShrink: 0 }}>
      <div style={{ fontFamily: font, fontSize: 9, color: "#9B9B9B", marginBottom: 4, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ color: "#BBBBBB", fontSize: 18 }}>{"→"}</div>
    </div>
  );
}
