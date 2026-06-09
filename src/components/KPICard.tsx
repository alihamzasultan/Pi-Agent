import React from "react";
import * as Icons from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Icons;
  trend?: {
    value: string;
    positive: boolean;
  };
  description?: string;
  glowColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
  glowColor = "rgba(0, 242, 254, 0.15)"
}) => {
  const IconComponent = Icons[icon] as React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;

  return (
    <div 
      className="glass-card" 
      style={{
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative Glow background */}
      <div 
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: glowColor,
          filter: "blur(20px)",
          pointerEvents: "none"
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            {title}
          </span>
          <h2 style={{ fontSize: "2rem", marginTop: "4px", color: "var(--text-primary)", fontWeight: 700 }}>
            {value}
          </h2>
        </div>
        <div 
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-color)",
            borderRadius: "10px",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {IconComponent && <IconComponent size={20} className="text-primary" style={{ color: "var(--accent-teal)" }} />}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
        {trend && (
          <span 
            style={{ 
              color: trend.positive ? "var(--status-success)" : "var(--status-danger)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "2px"
            }}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
        <span style={{ color: "var(--text-muted)" }}>
          {description || "vs previous period"}
        </span>
      </div>
    </div>
  );
};
export default KPICard;
