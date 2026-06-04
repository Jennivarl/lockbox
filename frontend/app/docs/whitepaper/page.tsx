"use client";
import Link from "next/link";
import Nav from "@/components/Nav";
import { ArrowLeft, Download } from "lucide-react";

const font = '"Space Mono", "Courier New", monospace';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: font, fontSize: 18, fontWeight: 900, color: "#000000", letterSpacing: "-0.02em", margin: "0 0 16px", paddingTop: 4 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: font, fontSize: 13, color: "#333333", margin: "0 0 14px", lineHeight: 1.8 }}>{children}</p>;
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: "#000000", margin: "0 0 10px" }}>{title}</h3>
      {children}
    </div>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 10, padding: "14px 18px", background: "#000000", margin: "14px 0", fontFamily: font, fontSize: 12, color: "#A8E6CF", letterSpacing: "0.02em" }}>
      {children}
    </div>
  );
}

export default function WhitepaperPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#C2C8D4" }}>
      <Nav />
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 32px" }}>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <Link href="/docs" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none" }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Docs
          </Link>
          <Link href="/" style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", textDecoration: "none" }}>Home</Link>
        </div>

        {/* Title block */}
        <div style={{ borderRadius: 16, padding: "40px 44px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)", marginBottom: 36 }}>
          <div style={{ fontFamily: font, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 14 }}>
            Technical Whitepaper · v1.0.0 · June 2026
          </div>
          <h1 style={{ fontFamily: font, fontSize: 30, fontWeight: 900, color: "#000000", letterSpacing: "-0.03em", margin: "0 0 16px", lineHeight: 1.15 }}>
            Lockbox: A Reactive Commitment Protocol for On-Chain Accountability
          </h1>
          <p style={{ fontFamily: font, fontSize: 13, color: "#6B6B6B", margin: "0 0 20px", lineHeight: 1.75 }}>
            <strong>Jennivarl</strong> · <strong>Mustapha Abdulaziz Dambatta</strong>
          </p>
          <div style={{ height: 1, background: "rgba(0,0,0,0.07)", margin: "20px 0" }} />
          <p style={{ fontFamily: font, fontSize: 13, color: "#444444", margin: 0, lineHeight: 1.85, fontStyle: "italic" }}>
            <strong>Abstract.</strong> We present Lockbox, a decentralised commitment protocol built on the Rialo reactive execution layer. Lockbox allows groups of participants to lock funds as a public commitment to a shared goal. Defection before the deadline triggers an automatic slash-and-redistribute rule with no intermediary. Persistence to the deadline triggers an automatic full payout. The protocol uses a reactive rule engine — every event fires deterministic on-chain logic — eliminating the need for custodians, manual settlement, or trusted third parties. We describe the protocol architecture, the economic model, the rules engine, and the security properties of the system.
          </p>
        </div>

        {/* Paper body */}
        <div style={{ borderRadius: 16, padding: "40px 44px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)" }}>

          <Section title="1. Introduction">
            <P>
              Coordination failures are among the most persistent problems in both traditional and decentralised settings. Groups regularly fail to achieve shared goals — gym pacts collapse, group savings dissolve, contributor lock-ups are abandoned — not due to lack of intent but lack of credible commitment mechanisms.
            </P>
            <P>
              Existing solutions rely on social trust, legal contracts, or centralised custodians. Social trust is unreliable at scale. Legal contracts are expensive and slow. Custodians introduce counterparty risk and moral hazard.
            </P>
            <P>
              Lockbox addresses this with a simple primitive: a vault where participants lock funds for a fixed period. Leaving early costs you a pre-agreed percentage, redistributed instantly to those who stayed. Staying until the deadline returns your full balance. The enforcement is entirely on-chain, reactive, and instantaneous.
            </P>
            <P>
              Lockbox is deployed on the Rialo protocol layer, which provides a reactive execution environment where rules fire automatically in response to on-chain events without external triggering or off-chain coordination.
            </P>
          </Section>

          <Section title="2. Protocol Architecture">
            <SubSection title="2.1 Vault State Machine">
              <P>Each vault transitions through four states:</P>
              <div style={{ borderRadius: 10, padding: "16px 20px", background: "#F7F8FA", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 14, fontFamily: font, fontSize: 12, color: "#333" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {["FILLING", "→", "ACTIVE", "→", "COMPLETED", "| DEAD"].map((s, i) => (
                    <span key={i} style={{ color: s === "→" || s === "| DEAD" ? "#9B9B9B" : "#000000", fontWeight: s !== "→" && s !== "| DEAD" ? 700 : 400 }}>{s}</span>
                  ))}
                </div>
              </div>
              <P>
                <strong>FILLING:</strong> Members may join. Once max_members is reached, the vault transitions to ACTIVE automatically via the member_joined rule. If all members quit before the vault fills, it transitions to DEAD.
              </P>
              <P>
                <strong>ACTIVE:</strong> The countdown is running. Members may rage quit (incurring a penalty) but may not join. At the deadline, the vault transitions to COMPLETED.
              </P>
              <P>
                <strong>COMPLETED:</strong> All surviving members have been paid out. The vault is closed. If all members quit before the deadline, the vault transitions to DEAD instead.
              </P>
            </SubSection>

            <SubSection title="2.2 Vault Parameters">
              <P>A vault is parameterised by the following fields at creation:</P>
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", marginBottom: 14 }}>
                {[
                  ["buy_in",       "uint256", "Amount each member must deposit to enter"],
                  ["max_members",  "uint8",   "Maximum number of participants (2–20)"],
                  ["penalty_pct",  "uint8",   "Percentage of buy-in forfeited on quit (1–100)"],
                  ["min_lock_hours","uint32",  "Minimum hours before deadline triggers"],
                  ["deadline",     "timestamp","Unix timestamp of vault expiry"],
                  ["vault_type",   "enum",    "savings | accountability | dao | vesting"],
                ].map(([field, type, desc], i) => (
                  <div key={field} style={{ display: "grid", gridTemplateColumns: "160px 100px 1fr", gap: 16, padding: "10px 16px", background: i % 2 === 0 ? "#FFFFFF" : "#F7F8FA", borderBottom: i < 5 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                    <code style={{ fontFamily: font, fontSize: 11, color: "#000000" }}>{field}</code>
                    <span style={{ fontFamily: font, fontSize: 11, color: "#7C3AED" }}>{type}</span>
                    <span style={{ fontFamily: font, fontSize: 11, color: "#6B6B6B" }}>{desc}</span>
                  </div>
                ))}
              </div>
            </SubSection>
          </Section>

          <Section title="3. Reactive Rules Engine">
            <P>
              Lockbox uses Rialo's reactive execution model. Rules are registered at vault creation and fire deterministically in response to on-chain events. No external keeper, cron job, or trusted relayer is required.
            </P>
            <SubSection title="3.1 Rule Definitions">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { trigger: "ON member_joined WHERE member_count = max_members", action: "ACTIVATE vault", color: "#2563EB" },
                  { trigger: "ON rage_quit", action: "SLASH penalty_pct FROM quitter\nREDISTRIBUTE pro-rata TO survivors", color: "#DC2626" },
                  { trigger: "ON deadline_reached", action: "RELEASE full_balance TO each survivor\nMARK vault COMPLETED", color: "#059669" },
                ].map(({ trigger, action, color }) => (
                  <div key={trigger} style={{ borderRadius: 10, padding: "14px 18px", background: "#000000", borderLeft: `3px solid ${color}` }}>
                    <div style={{ fontFamily: font, fontSize: 11, color, marginBottom: 6 }}>{trigger}</div>
                    <div style={{ fontFamily: font, fontSize: 11, color: "#FFFFFF", whiteSpace: "pre-line" }}>→ {action}</div>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="3.2 Event Emission">
              <P>
                Every rule execution emits a <code style={{ fontFamily: font, background: "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>ReactiveEvent</code> record containing: rule_name, event_type, summary, payload, and fired_at timestamp. Events are immutable and indexed for querying.
              </P>
            </SubSection>
          </Section>

          <Section title="4. Economic Model">
            <SubSection title="4.1 Pot Mechanics">
              <P>
                The total pot at vault activation is the sum of all member buy-ins:
              </P>
              <Formula>pot = buy_in × member_count</Formula>
              <P>
                When a member quits, their penalty is calculated as:
              </P>
              <Formula>penalty = buy_in × (penalty_pct / 100)</Formula>
              <P>The penalty is distributed to the n remaining active members:</P>
              <Formula>per_survivor_bonus = penalty / n_survivors</Formula>
            </SubSection>

            <SubSection title="4.2 Expected Payout">
              <P>
                A survivor's expected payout at the deadline — assuming k members quit over the vault lifetime:
              </P>
              <Formula>
                payout_i = buy_in + Σ(penalty_j / n_survivors_at_time_j) for each quit j
              </Formula>
              <P>
                The redistribution is sequential: each quit snapshot distributes to the survivors alive at that moment. Early quitters' penalties go to a larger pool of survivors; later quitters' penalties are shared among fewer.
              </P>
            </SubSection>

            <SubSection title="4.3 Incentive Alignment">
              <P>
                The penalty creates a credible commitment mechanism. The higher the penalty percentage, the stronger the disincentive to quit. Vault creators choose the penalty to match the commitment level required: a social savings goal might use 10–20%, while a founder vesting agreement might use 30–50%.
              </P>
              <P>
                Notably, surviving members are financially incentivised to stay: every quit increases their expected payout. This creates a positive feedback loop that reinforces group commitment.
              </P>
            </SubSection>
          </Section>

          <Section title="5. Security Model">
            <SubSection title="5.1 Custodial Risk">
              <P>
                Lockbox is non-custodial. Funds are held in the protocol layer, not by any external party. No admin key, multisig, or trusted operator can unilaterally move funds. Rule execution is deterministic and publicly verifiable.
              </P>
            </SubSection>
            <SubSection title="5.2 Griefing Resistance">
              <P>
                A malicious actor could attempt to grief a vault by joining and immediately quitting, hoping to disrupt other members. This is mitigated by: (a) the penalty mechanism, which makes quitting financially costly for the attacker; (b) the creator-controlled invite system for non-public vaults, which lets vault creators whitelist participants before the vault fills.
              </P>
            </SubSection>
            <SubSection title="5.3 Front-Running">
              <P>
                Because all rule execution is reactive and event-driven, there is no mempool-visible transaction to front-run in the conventional sense. The deadline rule fires on-chain at the deadline timestamp, not on user submission.
              </P>
            </SubSection>
          </Section>

          <Section title="6. Implementation">
            <P>
              The current implementation simulates the reactive protocol layer while the Rialo mainnet smart contracts are in development. The backend (FastAPI + asyncpg + PostgreSQL) faithfully implements the protocol logic with deterministic rule firing, event emission, and pro-rata redistribution. All calculations mirror the smart contract logic that will replace it in Phase 2.
            </P>
            <P>
              The frontend (Next.js 16, TypeScript, Privy auth) is production-deployed at lockbox-vault.vercel.app. Authentication supports wallet connect, email, and Google OAuth.
            </P>
          </Section>

          <Section title="7. Future Work">
            <P>
              See the <Link href="/docs/roadmap" style={{ color: "#000000", fontWeight: 700 }}>full roadmap</Link> for planned milestones. Key areas include: on-chain smart contract deployment to Rialo mainnet, token-gated vault membership, cross-chain vault support, reputation scoring, and DAO governance for deadline extensions.
            </P>
          </Section>

          <Section title="8. Conclusion">
            <P>
              Lockbox demonstrates that reactive on-chain rules are a viable primitive for group commitment protocols. The slash-and-redistribute mechanism creates genuine financial incentive alignment with minimal complexity. By building on Rialo's reactive execution layer, we eliminate the need for trusted intermediaries entirely.
            </P>
            <P>
              The protocol is live and open for use at lockbox-vault.vercel.app. Smart contract integration is the immediate next step, which will provide full non-custodial guarantees on Rialo mainnet.
            </P>
          </Section>

          <div style={{ height: 1, background: "rgba(0,0,0,0.07)", margin: "8px 0 24px" }} />
          <div style={{ fontFamily: font, fontSize: 11, color: "#9B9B9B", lineHeight: 1.7 }}>
            © 2026 Lockbox Protocol · Released under MIT License · Built on Rialo
          </div>
        </div>
      </div>
    </div>
  );
}
