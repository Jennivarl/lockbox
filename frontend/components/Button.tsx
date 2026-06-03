"use client";
import { motion } from "motion/react";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}

const sizes = {
  sm: { padding: "8px 16px",  fontSize: 12 },
  md: { padding: "11px 24px", fontSize: 13 },
  lg: { padding: "14px 32px", fontSize: 15 },
};

const variants = {
  primary:   { background: "#000000", color: "#FFFFFF", border: "1px solid #000000" },
  secondary: { background: "transparent", color: "#000000", border: "1px solid rgba(0,0,0,0.3)" },
  ghost:     { background: "transparent", color: "#6B6B6B", border: "1px solid rgba(0,0,0,0.12)" },
  danger:    { background: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.3)" },
};

export function Button({ children, variant = "primary", size = "md", onClick, disabled, className = "", style: styleProp, type = "button" }: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={!disabled ? { scale: variant === "primary" ? 1.03 : 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...sizes[size],
        ...variants[variant],
        fontFamily: '"Space Mono", "Courier New", monospace',
        fontWeight: 700,
        letterSpacing: "0.05em",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
        ...styleProp,
      }}
    >
      {children}
    </motion.button>
  );
}
