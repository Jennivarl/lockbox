"use client";
import Link from "next/link";
import { useState } from "react";
import Nav from "@/components/Nav";
import { BookOpen, FileText, Map, ChevronRight, PiggyBank, Dumbbell, Building2, Lock, Zap, Users, Shield, Code2 } from "lucide-react";

const font = '"Space Mono", "Courier New", monospace';
const serif = '"Space Mono", monospace';

const SECTIONS = [
  { id: "introduction",  label: "Introduction" },
  { id: "concepts",      label: "Core Concepts" },
  { id: "vault-types",   label: "Vault Types" },
  { id: "rules-engine",  label: "Rules Engine" },
  { id: "user-flows",    label: "User Flows" },
  { id: "api",           label: "API Reference" },
];

const API_ENDPOINTS = [
  { method: "GET",  path: "/vaults",                            desc: "List all vaults (filter by status/type)" },
  { method: "POST", path: "/vaults",                            desc: "Create a new vault" },
  { method: "GET",  path: "/vaults/:id",                        desc: "Get vault detail with members" },
  { method: "POST", path: "/vaults/:id/join",                   desc: "Join a vault (lock funds)" },
  { method: "POST", path: "/vaults/:id/quit",                   desc: "Rage quit (penalty applied)" },
  { method: "POST", path: "/vaults/:id/requests",               desc: "Request to join a vault" },
  { method: "GET",  path: "/vaults/:id/requests",               desc: "List pending join requests" },
  { method: "POST", path: "/vaults/:id/requests/:rid/accept",   desc: "Accept a join request" },
  { method: "POST", path: "/vaults/:id/requests/:rid/reject",   desc: "Reject a join request" },
  { method: "POST", path: "/vaults/:id/trigger",                desc: "Trigger deadline (demo/testing)" },
  { method: "GET",  path: "/feed",                              desc: "Reactive event feed" },
  { method: "GET",  path: "/leaderboard",                       desc: "Survivor rankings" },
  { method: "GET",  path: "/stats",                             desc: "Platform-wide statistics" },
];

const METHOD_COLOR: Record<string, string> = {
  GET: "#2563EB", POST: "#059669", DELETE: "#DC2626",
};

export default function DocsPage() {
  const [active, setActive] = useState("introduction");

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px", display: "flex", gap: 40, alignItems: "flex-start" }}>

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
            <FileText style={{ width: 13, height: 13 }} /> Whitepaper →
          </Link>
          <Link href="/docs/roadmap" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontFamily: font, fontSize: 12, color: "#000000", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)" }}>
            <Map style={{ width: 13, height: 13 }} /> Roadmap →
          </Link>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <div style={{ borderRadius: 16, padding: "32px 36px", background: "#000000", color: "#FFFFFF", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <BookOpen style={{ width: 22, height: 22, color: "#9B9B9B" }} />
              <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9B9B" }}>
                Lockbox Protocol · v1.0
              </span>
            </div>
            <h1 style={{ fontFamily: font, fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 12px", lineHeight: 1.1 }}>
              Developer Documentation
            </h1>
            <p style={{ fontFamily: font, fontSize: 14, color: "#AAAAAA", margin: 0, lineHeight: 1.7 }}>
              Everything you need to understand, integrate, and build on the Lockbox commitment protocol.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {[
                { href: "/docs/whitepaper", label: "Read Whitepaper", icon: FileText },
                { href: "/docs/roadmap",    label: "View Roadmap",    icon: Map },
                { href: "/vaults",          label: "Open App",        icon: ChevronRight },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 18px", borderRadius: 9,
                  fontFamily: font, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                  background: "rgba(255,255,255,0.1)", color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.15)", textDecoration: "none",
                }}>
                  <Icon style={{ width: 13, height: 13 }} /> {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Introduction */}
          <section id="introduction" style={{ marginBottom: 48 }}>
            <SectionHeader n="01" title="Introduction" />
            <Prose>
              Lockbox is a <strong>reactive commitment protocol</strong> built on Rialo. It allows groups of people to lock funds together as a public on-chain commitment — quit early and you lose a penalty percentage redistributed to everyone who stayed. Survive until the deadline and you receive your full payout automatically.
            </Prose>
            <Prose>
              The core insight is that coordination problems (staying accountable, vesting commitments, group savings goals) become much easier when there are real financial consequences enforced by code rather than trust.
            </Prose>
            <Prose>
              Every action in Lockbox — a member joining, a rage quit, a deadline passing — fires a <strong>reactive rule</strong> that executes immediately on the protocol layer with no intermediary, no manual intervention, and no custody.
            </Prose>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
              {[
                { icon: Shield, title: "Non-custodial", desc: "Funds are locked in the protocol. No admin can touch them." },
                { icon: Zap, title: "Reactive", desc: "Rules fire instantly on every event. No cron jobs, no manual triggers." },
                { icon: Users, title: "Group-native", desc: "Designed for groups of 2–10 with shared commitments." },
                { icon: Code2, title: "Composable", desc: "Open API. Build dashboards, bots, and integrations on top." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{ borderRadius: 12, padding: "16px 18px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Icon style={{ width: 15, height: 15, color: "#000000" }} strokeWidth={1.8} />
                    <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: "#000000" }}>{title}</span>
                  </div>
                  <p style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", margin: 0, lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Core Concepts */}
          <section id="concepts" style={{ marginBottom: 48 }}>
            <SectionHeader n="02" title="Core Concepts" />
            {[
              {
                term: "Vault",
                def: "A vault is the core primitive. Each vault has a buy-in amount, a maximum number of members, a penalty percentage, a minimum lock period, and a deadline. Once full, it locks and the countdown begins.",
              },
              {
                term: "Buy-in",
                def: "The amount every member must deposit to enter the vault. All members pay the same buy-in. The sum of all buy-ins forms the pot.",
              },
              {
                term: "Penalty",
                def: "When a member rage quits, they forfeit a percentage of their buy-in. This penalty is immediately redistributed proportionally to all surviving members.",
              },
              {
                term: "Reactive Rule",
                def: "A rule that fires automatically when a triggering event occurs. Rules are deterministic and execute without any off-chain coordination. The three built-in rules are: rage_quit → slash + redistribute; deadline_reached → release payout; vault_full → activate vault.",
              },
              {
                term: "Reactive Event",
                def: "An on-chain record emitted every time a rule fires. Events form an immutable audit trail of everything that happened in a vault.",
              },
              {
                term: "Survivor",
                def: "A member who remains in the vault until the deadline. Survivors split the full pot plus any accumulated penalties from quitters.",
              },
            ].map(({ term, def }) => (
              <div key={term} style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000000", marginBottom: 6 }}>{term}</div>
                <p style={{ fontFamily: font, fontSize: 13, color: "#444444", margin: 0, lineHeight: 1.7 }}>{def}</p>
              </div>
            ))}
          </section>

          {/* Vault Types */}
          <section id="vault-types" style={{ marginBottom: 48 }}>
            <SectionHeader n="03" title="Vault Types" />
            <Prose>
              Lockbox supports four vault types. The type is cosmetic at the protocol level — rules are identical — but signals intent and affects discoverability and UI rendering.
            </Prose>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
              {[
                { icon: PiggyBank, color: "#059669", name: "Savings", desc: "Group saving toward a shared goal. Trips, down payments, emergency funds. Members commit to not touching the pot until the target date." },
                { icon: Dumbbell,  color: "#7C3AED", name: "Accountability", desc: "Habit and commitment pacts. Gym streaks, shipping challenges, daily build updates. Quit before the pact ends and lose your penalty." },
                { icon: Building2, color: "#2563EB", name: "DAO / Team", desc: "Treasury locks and contributor commitments. Core team members lock to signal long-term alignment with the protocol or project." },
                { icon: Lock,      color: "#D97706", name: "Vesting", desc: "Founder and investor lock-ups. Lock RIAO for a set period as a public commitment to the project. Walk early, lose a percentage to co-founders." },
              ].map(({ icon: Icon, color, name, desc }) => (
                <div key={name} style={{ borderRadius: 12, padding: "18px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderTop: `3px solid ${color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 14, height: 14, color }} strokeWidth={1.8} />
                    </div>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000000" }}>{name}</span>
                  </div>
                  <p style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", margin: 0, lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Rules Engine */}
          <section id="rules-engine" style={{ marginBottom: 48 }}>
            <SectionHeader n="04" title="Rules Engine" />
            <Prose>
              The rules engine is what makes Lockbox reactive. Instead of users manually triggering payouts or checking conditions, every vault has three immutable rules that fire automatically when their conditions are met.
            </Prose>
            <div style={{ borderRadius: 12, padding: "20px 24px", background: "#000000", marginBottom: 20 }}>
              {[
                { trigger: "ON member_joined (full)", action: "ACTIVATE vault", color: "#2563EB" },
                { trigger: "ON rage_quit",            action: "SLASH penalty → REDISTRIBUTE to survivors", color: "#DC2626" },
                { trigger: "ON deadline_reached",     action: "RELEASE payout to all survivors", color: "#059669" },
              ].map(({ trigger, action, color }) => (
                <div key={trigger} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontFamily: font, fontSize: 11, color, fontWeight: 700, whiteSpace: "nowrap", marginTop: 2 }}>
                    {trigger}
                  </span>
                  <span style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B" }}>→</span>
                  <span style={{ fontFamily: font, fontSize: 11, color: "#FFFFFF" }}>{action}</span>
                </div>
              ))}
            </div>
            <Prose>
              Rules are composable and deterministic. When a member quits, the slash-and-redistribute rule fires synchronously: the penalty is calculated, deducted, and split among active members before the transaction settles. No state inconsistency is possible.
            </Prose>
            <Prose>
              All rule executions emit a <code style={{ fontFamily: font, background: "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>ReactiveEvent</code> that is stored permanently and surfaced in the event feed.
            </Prose>
          </section>

          {/* User Flows */}
          <section id="user-flows" style={{ marginBottom: 48 }}>
            <SectionHeader n="05" title="User Flows" />
            {[
              {
                title: "Creating a Vault",
                steps: ["Authenticate with wallet, email, or Google (via Privy)", "Navigate to /vaults/new", "Set name, type, buy-in, max members, penalty %, and deadline", "Submit — you are automatically added as the first member"],
              },
              {
                title: "Joining a Vault",
                steps: ["Browse /vaults or filter by type/status", "Select a vault with status = Filling", "Click Lock In — a confirmation modal shows your buy-in amount and post-lock balance", "Confirm — your funds are locked and a member_joined event fires", "When the vault reaches max members, it activates automatically"],
              },
              {
                title: "Rage Quitting",
                steps: ["Navigate to the vault you are in", "Click Rage Quit — a confirmation shows your penalty and refund amounts", "Confirm — the slash rule fires immediately", "Your penalty is redistributed to remaining survivors proportionally"],
              },
            ].map(({ title, steps }) => (
              <div key={title} style={{ borderRadius: 12, padding: "18px 20px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 14 }}>
                <div style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000000", marginBottom: 12 }}>{title}</div>
                {steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontFamily: font, fontSize: 9, fontWeight: 700, color: "#FFFFFF" }}>{i + 1}</span>
                    </div>
                    <p style={{ fontFamily: font, fontSize: 12, color: "#444444", margin: 0, lineHeight: 1.65 }}>{s}</p>
                  </div>
                ))}
              </div>
            ))}
          </section>

          {/* API Reference */}
          <section id="api" style={{ marginBottom: 48 }}>
            <SectionHeader n="06" title="API Reference" />
            <Prose>
              The Lockbox backend exposes a RESTful HTTP API. Base URL: <code style={{ fontFamily: font, background: "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>https://ragevault-api-production.up.railway.app</code>
            </Prose>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", marginTop: 16 }}>
              {API_ENDPOINTS.map((e, i) => (
                <div key={e.path} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: i % 2 === 0 ? "#FFFFFF" : "#F7F8FA", borderBottom: i < API_ENDPOINTS.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                  <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color: METHOD_COLOR[e.method] ?? "#000", width: 36, flexShrink: 0 }}>{e.method}</span>
                  <code style={{ fontFamily: font, fontSize: 12, color: "#000000", flex: "0 0 auto" }}>{e.path}</code>
                  <span style={{ fontFamily: font, fontSize: 12, color: "#6B6B6B", marginLeft: "auto", textAlign: "right" }}>{e.desc}</span>
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
