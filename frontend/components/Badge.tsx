import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "danger";
  className?: string;
}

const styles: Record<string, React.CSSProperties> = {
  default: { background: "rgba(0,0,0,0.07)", color: "#000000", border: "1px solid rgba(0,0,0,0.15)" },
  success: { background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.3)" },
  warning: { background: "rgba(217,119,6,0.1)", color: "#B45309", border: "1px solid rgba(217,119,6,0.25)" },
  info:    { background: "rgba(37,99,235,0.08)", color: "#1D4ED8", border: "1px solid rgba(37,99,235,0.2)" },
  danger:  { background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" },
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={className} style={{
      ...styles[variant],
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      fontFamily: '"Space Mono", "Courier New", monospace',
      fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}
