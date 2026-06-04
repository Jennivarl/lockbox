"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Vault, Plus, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useBalance } from "@/lib/useBalance";
import { useProfile } from "@/lib/useProfile";

const font = '"Space Mono", "Courier New", monospace';

export default function Nav() {
  const path = usePathname();
  const isActive = (href: string) => href !== "/" ? path.startsWith(href) : path === href;
  const { ready, authenticated, login, logout, peerName } = useAuth();
  const { balance } = useBalance();
  const { profile } = useProfile();
  const displayName = profile.displayName || peerName;

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(194,200,212,0.97)",
      borderBottom: "1px solid rgba(0,0,0,0.1)",
      backdropFilter: "blur(20px)",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Vault style={{ width: 20, height: 20, color: "#FFFFFF" }} strokeWidth={1.8} />
          </div>
          <span style={{ fontFamily: font, fontSize: 19, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "#000000" }}>
            Lockbox
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {[{ href: "/vaults", label: "Vaults" }, { href: "/leaderboard", label: "Leaderboard" }, { href: "/docs", label: "Docs" }].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              fontFamily: font, fontSize: 14, fontWeight: 600, letterSpacing: "0.04em",
              color: isActive(href) ? "#000000" : "#222222",
              borderBottom: isActive(href) ? "2px solid #000000" : "2px solid transparent",
              paddingBottom: 2, transition: "all 0.15s",
            }}>
              {label}
            </Link>
          ))}

          {ready && authenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                <span style={{ fontFamily: font, fontSize: 12, color: "#444444", letterSpacing: "0.02em" }}>
                  {displayName}
                </span>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 20,
                  background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.25)",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669" }} />
                  <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.04em" }}>
                    {balance.toLocaleString()} RIAO
                  </span>
                </div>
              </Link>
              <Link href="/vaults/new" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                fontFamily: font, letterSpacing: "0.06em", textTransform: "uppercase",
                background: "#000000", color: "#FFFFFF", textDecoration: "none",
              }}>
                <Plus style={{ width: 14, height: 14 }} /> New Vault
              </Link>
              <button onClick={logout} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 14px", borderRadius: 8, fontSize: 12,
                fontFamily: font, cursor: "pointer",
                background: "transparent", color: "#6B6B6B",
                border: "1px solid rgba(0,0,0,0.15)",
              }}>
                <LogOut style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={login} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                fontFamily: font, letterSpacing: "0.06em", textTransform: "uppercase",
                background: "transparent", color: "#000000",
                border: "1px solid rgba(0,0,0,0.3)", cursor: "pointer",
              }}>
                <LogIn style={{ width: 14, height: 14 }} /> Sign In
              </button>
              <button onClick={login} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                fontFamily: font, letterSpacing: "0.06em", textTransform: "uppercase",
                background: "#000000", color: "#FFFFFF",
                border: "1px solid #000000", cursor: "pointer",
              }}>
                <Plus style={{ width: 14, height: 14 }} /> New Vault
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
