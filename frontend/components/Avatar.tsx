interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "active" | "inactive";
}

const sizes   = { sm: { width: 32, height: 32, fontSize: 11 }, md: { width: 40, height: 40, fontSize: 13 }, lg: { width: 52, height: 52, fontSize: 15 } };
const variants: Record<string, React.CSSProperties> = {
  default:  { background: "rgba(0,0,0,0.07)", color: "#000000", border: "2px solid rgba(0,0,0,0.15)" },
  active:   { background: "rgba(16,185,129,0.12)", color: "#059669", border: "2px solid rgba(16,185,129,0.3)" },
  inactive: { background: "rgba(0,0,0,0.04)", color: "#9B9B9B", border: "2px solid rgba(0,0,0,0.08)" },
};

export function Avatar({ name, size = "md", variant = "default" }: AvatarProps) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{
      ...sizes[size], ...variants[variant],
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: "50%", fontWeight: 700, flexShrink: 0,
      fontFamily: '"Space Mono", "Courier New", monospace',
    }}>
      {initials}
    </div>
  );
}
