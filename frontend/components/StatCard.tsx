"use client";
import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export function StatCard({ label, value, unit, icon: Icon, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        borderRadius: 16, padding: "28px 24px", textAlign: "center",
        background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 48, height: 48, borderRadius: 12, marginBottom: 14,
        background: `${color}12`, border: `1px solid ${color}25`,
      }}>
        <Icon style={{ width: 22, height: 22, color }} />
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, color: "#000000", marginBottom: 4, fontFamily: '"Space Mono", "Courier New", monospace', letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color, marginBottom: 4 }}>
        {unit}
      </div>
      <div style={{ fontSize: 12, color: "#6B6B6B", fontFamily: '"Space Mono", "Courier New", monospace' }}>
        {label}
      </div>
    </motion.div>
  );
}
