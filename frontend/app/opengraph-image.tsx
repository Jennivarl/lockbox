import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Lockbox — Lock in. Hold the line. Get paid.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          background: "#C2C8D4",
          display: "flex", flexDirection: "column",
          alignItems: "flex-start", justifyContent: "flex-end",
          padding: "72px 80px",
          fontFamily: '"Space Mono", monospace',
          position: "relative",
        }}
      >
        {/* Top-left logo mark */}
        <div style={{
          position: "absolute", top: 64, left: 80,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "#000000",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: "0.14em", color: "#000000" }}>
            LOCKBOX
          </span>
        </div>

        {/* Stat chips */}
        <div style={{
          position: "absolute", top: 64, right: 80,
          display: "flex", gap: 12,
        }}>
          {[
            { label: "RIAO locked", value: "118,650", color: "#059669" },
            { label: "active vaults", value: "8", color: "#2563EB" },
            { label: "rage quits", value: "18", color: "#DC2626" },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "14px 20px", borderRadius: 12,
              background: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(0,0,0,0.08)",
            }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: s.color, letterSpacing: "-0.02em" }}>
                {s.value}
              </span>
              <span style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4, letterSpacing: "0.06em" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 style={{
            fontSize: 80, fontWeight: 900, color: "#000000",
            letterSpacing: "-0.03em", lineHeight: 1.0, margin: 0,
          }}>
            Lock in.<br />Hold the line.
          </h1>
          <p style={{
            fontSize: 26, color: "#444444", margin: 0,
            letterSpacing: "-0.01em", fontWeight: 400,
          }}>
            Commit funds with your group. Rage quit early<br />
            and lose your penalty to those who stayed.
          </p>
        </div>

        {/* Bottom URL */}
        <div style={{
          position: "absolute", bottom: 48, right: 80,
          fontSize: 16, color: "#9B9B9B", letterSpacing: "0.04em",
        }}>
          lockbox-vault.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
