"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Vault, LogOut, LogIn, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useProfile } from "@/lib/useProfile";
import NotificationBell from "@/components/NotificationBell";

const font = '"Space Mono", "Courier New", monospace';
function NavAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(/[\s@._\-]+/).map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "?";
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 9, background: color || "#059669",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ fontFamily: font, fontSize: 12, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
        {initials}
      </span>
    </div>
  );
}

const NAV_LINKS = [
  { href: "/vaults",      label: "Vaults" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/shame",       label: "HOF" },
  { href: "/docs",        label: "Docs" },
];

export default function Nav() {
  const path = usePathname();
  const isActive = (href: string) => href !== "/" ? path.startsWith(href) : path === href;
  const { ready, authenticated, login, logout, peerName, peerId } = useAuth();
  const { profile } = useProfile();
  const displayName = profile.displayName || peerName;

  const [mobile,   setMobile]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [path]);

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(194,200,212,0.97)",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Vault style={{ width: 20, height: 20, color: "#FFFFFF" }} strokeWidth={1.8} />
            </div>
            <span style={{ fontFamily: font, fontSize: 19, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "#000000" }}>
              Lockbox
            </span>
          </Link>

          {/* Desktop nav */}
          {!mobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} style={{
                  fontFamily: font, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
                  color: isActive(href) ? "#000000" : "#444444",
                  textDecoration: "none",
                }}>
                  {label}
                </Link>
              ))}


              {ready && authenticated ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <NotificationBell peerId={peerId} />
                  <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                    <NavAvatar name={displayName} color={profile.avatarColor} />
                  </Link>
                  <button onClick={logout} style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "9px 14px", borderRadius: 8, fontSize: 12,
                    fontFamily: font, cursor: "pointer",
                    background: "transparent", color: "#6B6B6B",
                    border: "1px solid rgba(0,0,0,0.15)",
                  }}>
                    <LogOut style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ) : (
                <button onClick={login} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  fontFamily: font, letterSpacing: "0.06em", textTransform: "uppercase",
                  background: "#000000", color: "#FFFFFF",
                  border: "1px solid #000000", cursor: "pointer",
                }}>
                  <LogIn style={{ width: 14, height: 14 }} /> Sign In
                </button>
              )}
            </div>
          )}

          {/* Mobile: right side */}
          {mobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {ready && !authenticated && (
                <button onClick={login} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  fontFamily: font, background: "#000000", color: "#FFFFFF",
                  border: "none", cursor: "pointer",
                }}>
                  <LogIn style={{ width: 13, height: 13 }} /> Sign In
                </button>
              )}
              <button onClick={() => setMenuOpen(o => !o)} style={{
                width: 40, height: 40, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: menuOpen ? "#000000" : "rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer",
                color: menuOpen ? "#FFFFFF" : "#000000",
              }}>
                {menuOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile dropdown menu */}
        {mobile && menuOpen && (
          <div style={{
            background: "rgba(194,200,212,0.99)", borderTop: "1px solid rgba(0,0,0,0.1)",
            padding: "16px 20px 20px",
          }}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} style={{
                display: "block", padding: "13px 0",
                borderBottom: "1px solid rgba(0,0,0,0.07)",
                fontFamily: font, fontSize: 15, fontWeight: isActive(href) ? 700 : 500,
                color: "#000000", textDecoration: "none",
              }}>
                {label}
              </Link>
            ))}
            {ready && authenticated ? (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/profile" style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10,
                  background: "rgba(0,0,0,0.05)", textDecoration: "none",
                }}>
                  <NavAvatar name={displayName} color={profile.avatarColor} />
                  <span style={{ fontFamily: font, fontSize: 13, color: "#000000", fontWeight: 600 }}>
                    {displayName}
                  </span>
                </Link>
                <button onClick={logout} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "12px", borderRadius: 10,
                  fontFamily: font, fontSize: 13, cursor: "pointer",
                  background: "transparent", color: "#6B6B6B",
                  border: "1px solid rgba(0,0,0,0.15)",
                }}>
                  <LogOut style={{ width: 13, height: 13 }} /> Sign Out
                </button>
              </div>
            ) : null}
          </div>
        )}
      </nav>

    </>
  );
}
