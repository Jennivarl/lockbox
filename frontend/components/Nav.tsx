"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/vaults",      label: "Vaults" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 40px",
      borderBottom: "1px solid rgba(239,68,68,0.1)",
      background: "rgba(6,4,10,0.95)",
      position: "sticky", top: 0, zIndex: 50,
      backdropFilter: "blur(12px)",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>
          🔒
        </div>
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "#f0eaf8" }}>
          RageVault
        </span>
      </Link>

      <div style={{ display: "flex", gap: 4 }}>
        {LINKS.map(l => {
          const active = path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} style={{
              padding: "7px 16px", borderRadius: 7, fontSize: 13, fontWeight: 500,
              color: active ? "#fca5a5" : "#7a6080",
              background: active ? "rgba(239,68,68,0.1)" : "transparent",
              border: active ? "1px solid rgba(239,68,68,0.2)" : "1px solid transparent",
              transition: "all 150ms",
            }}>
              {l.label}
            </Link>
          );
        })}
      </div>

      <Link href="/vaults/new" style={{
        padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
        background: "linear-gradient(135deg, #ef4444, #dc2626)",
        color: "#fff",
      }}>
        + New Vault
      </Link>
    </nav>
  );
}
