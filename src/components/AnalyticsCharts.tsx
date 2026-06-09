import React, { useState } from "react";
import type { IntakeCase } from "../services/supabase";

interface ChartsProps {
  cases: IntakeCase[];
}

export const AnalyticsCharts: React.FC<ChartsProps> = ({ cases }) => {
  const [hoveredPractice, setHoveredPractice] = useState<string | null>(null);

  // --- Calculate Funnel Data ---
  const totalCalls = cases.length;
  const evaluated = cases.filter(c => c.extraction_status === "Completed" || c.viability_score).length;
  const retainerSent = cases.filter(c => c.retainer_sent_at || c.docuseal_status === "Sent" || c.docuseal_status === "Completed").length;
  const signedOrSynced = cases.filter(c => c.retainer_signed_at || c.docuseal_status === "Completed" || c.clio_matter_id).length;

  const funnelStages = [
    { label: "Total Leads", count: totalCalls, percent: 100, color: "var(--accent-teal)" },
    { label: "AI Evaluated", count: evaluated, percent: totalCalls ? Math.round((evaluated / totalCalls) * 100) : 0, color: "var(--accent-blue)" },
    { label: "Retainer Sent", count: retainerSent, percent: totalCalls ? Math.round((retainerSent / totalCalls) * 100) : 0, color: "var(--accent-indigo)" },
    { label: "Cases Signed", count: signedOrSynced, percent: totalCalls ? Math.round((signedOrSynced / totalCalls) * 100) : 0, color: "var(--status-success)" }
  ];

  // --- Calculate Practice Area Data ---
  const practiceCounts: Record<string, number> = {};
  cases.forEach(c => {
    // Determine category
    let category = "Motor Vehicle Accident"; // Default or inferred
    const summary = (c.incident_summary || "").toLowerCase();
    const memo = (c.case_evaluation_memo || "").toLowerCase();
    
    if (summary.includes("slip") || summary.includes("fall") || summary.includes("floor") || summary.includes("puddle") || memo.includes("premises")) {
      category = "Premises Liability (Slip & Fall)";
    } else if (summary.includes("salon") || summary.includes("burn") || summary.includes("bleach") || summary.includes("professional") || memo.includes("negligence")) {
      category = "Professional Liability";
    } else if (summary.includes("bicycle") || summary.includes("bike") || summary.includes("cyclist")) {
      category = "Bicycle Accident";
    } else if (summary.includes("dog") || summary.includes("bite") || summary.includes("animal")) {
      category = "Animal Attack / Dog Bite";
    } else if (summary.includes("work") || summary.includes("employer") || summary.includes("construction")) {
      category = "Workplace Injury";
    }
    
    practiceCounts[category] = (practiceCounts[category] || 0) + 1;
  });

  const practiceData = Object.entries(practiceCounts).map(([name, count]) => ({
    name,
    count,
    percentage: cases.length ? Math.round((count / cases.length) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  const colors = [
    "var(--accent-teal)",
    "var(--accent-blue)",
    "var(--accent-indigo)",
    "var(--accent-violet)",
    "var(--status-warning)",
    "var(--status-info)"
  ];

  // --- Calculate Trend Data (Last 7 Days) ---
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateLabel: d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
      dateString: d.toISOString().split("T")[0],
      count: 0
    };
  });

  cases.forEach(c => {
    if (c.created_at) {
      const caseDate = c.created_at.split("T")[0];
      const match = last7Days.find(d => d.dateString === caseDate);
      if (match) match.count += 1;
    } else {
      // For fallback/demo
      const idx = Math.floor(Math.random() * 7);
      last7Days[idx].count += 1;
    }
  });

  // SVG Area Trend Computations
  const chartHeight = 160;
  const chartWidth = 500;
  const maxCount = Math.max(...last7Days.map(d => d.count), 4); // Min ceiling of 4 for better display
  const points = last7Days.map((d, index) => {
    const x = (index / 6) * (chartWidth - 40) + 20;
    const y = chartHeight - ((d.count / maxCount) * (chartHeight - 40) + 20);
    return { x, y, ...d };
  });

  // Construct SVG Path
  const linePath = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - 10} L ${points[0].x} ${chartHeight - 10} Z`
    : "";

  // Donut chart stroke math
  let cumulativePercent = 0;

  return (
    <div className="charts-grid">
      
      {/* 1. Area Trend Chart */}
      <div className="glass-card">
        <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--text-primary)" }}>7-Day Intake Trend</h3>
        <div style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: "100%", height: "auto" }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--accent-teal)" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--accent-blue)" />
                <stop offset="100%" stopColor="var(--accent-teal)" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = 20 + (i * (chartHeight - 40) / 4);
              const gridVal = Math.round(maxCount - (i * maxCount / 4));
              return (
                <g key={i}>
                  <line x1="20" y1={y} x2={chartWidth - 20} y2={y} stroke="var(--chart-gridline)" strokeDasharray="3" />
                  <text x="5" y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="start">{gridVal}</text>
                </g>
              );
            })}

            {/* Area Path */}
            {points.length > 0 && (
              <path d={areaPath} fill="url(#areaGrad)" />
            )}

            {/* Line Path */}
            {points.length > 0 && (
              <path 
                d={linePath} 
                fill="none" 
                stroke="url(#lineGrad)" 
                strokeWidth="3" 
                strokeLinecap="round"
                className="chart-path-glowing"
              />
            )}

            {/* Data Dots & Tooltips */}
            {points.map((p, i) => (
              <g key={i}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="5" 
                  fill="var(--bg-dark)" 
                  stroke="var(--accent-teal)" 
                  strokeWidth="2" 
                  style={{ transition: "all 0.2s" }}
                />
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="10" 
                  fill="transparent" 
                  style={{ cursor: "pointer" }}
                >
                  <title>{`${p.dateLabel}: ${p.count} intakes`}</title>
                </circle>
                <text x={p.x} y={chartHeight - 2} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
                  {p.dateLabel}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 2. Donut Chart (Practice Area Distribution) */}
      <div className="glass-card">
        <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--text-primary)" }}>Case Mix by Practice Area</h3>
        <div className="donut-wrap">
          
          <div style={{ position: "relative", width: "140px", height: "140px", flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              {practiceData.length === 0 ? (
                <circle cx="50" cy="50" r="35" fill="none" stroke="var(--chart-empty-ring)" strokeWidth="18" />
              ) : (
                practiceData.map((p, idx) => {
                  const strokeWidth = hoveredPractice === p.name ? 20 : 16;
                  const radius = 35;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDash = (p.percentage / 100) * circumference;
                  const strokeOffset = circumference - (cumulativePercent / 100) * circumference;
                  cumulativePercent += p.percentage;

                  return (
                    <circle 
                      key={idx}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={colors[idx % colors.length]}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${strokeDash} ${circumference}`}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap={p.percentage === 100 ? "butt" : "round"}
                      style={{ transition: "all 0.3s ease", cursor: "pointer" }}
                      onMouseEnter={() => setHoveredPractice(p.name)}
                      onMouseLeave={() => setHoveredPractice(null)}
                    />
                  );
                })
              )}
            </svg>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center"
            }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>{cases.length}</span>
              <br />
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Cases</span>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            {practiceData.slice(0, 4).map((p, idx) => (
              <div 
                key={idx}
                onMouseEnter={() => setHoveredPractice(p.name)}
                onMouseLeave={() => setHoveredPractice(null)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: hoveredPractice === p.name ? "var(--chart-hover-bg)" : "transparent",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors[idx % colors.length], flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name}
                  </span>
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", paddingLeft: "8px" }}>
                  {p.count} ({p.percentage}%)
                </span>
              </div>
            ))}
            {practiceData.length > 4 && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", paddingLeft: "18px" }}>
                + {practiceData.length - 4} more categories
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Conversion Funnel Chart */}
      <div className="glass-card" style={{ gridColumn: "1 / -1" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--text-primary)" }}>Intake Pipeline Conversion Funnel</h3>
        
        <div className="funnel-grid">
          {funnelStages.map((stage, index) => {
            const isLast = index === funnelStages.length - 1;
            return (
              <div key={index} style={{ position: "relative" }}>
                <div 
                  className="glass-card" 
                  style={{ 
                    padding: "16px", 
                    textAlign: "center", 
                    background: "var(--funnel-card-bg)",
                    borderLeft: `4px solid ${stage.color}`
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    {stage.label}
                  </span>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, margin: "8px 0", color: "var(--text-primary)" }}>
                    {stage.count}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {stage.percent}% conversion rate
                  </div>
                </div>

                {!isLast && (
                  <div className="funnel-arrow" style={{
                    position: "absolute",
                    right: "-20px",
                    top: "50%",
                    transform: "translateY(-50%) rotate(-90deg)",
                    zIndex: 2,
                    color: "var(--text-muted)",
                    display: "none" // Managed dynamically by grid layouts or CSS media query
                  }}>
                    ▼
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
export default AnalyticsCharts;
