import React, { useMemo, useState } from "react";
import type { IntakeCase } from "../services/supabase";

interface ChartsProps {
  cases: IntakeCase[];
}

export const AnalyticsCharts: React.FC<ChartsProps> = ({ cases }) => {
  const [hoveredPractice, setHoveredPractice] = useState<string | null>(null);

  const colors = [
    "var(--accent-teal)",
    "var(--accent-blue)",
    "var(--accent-indigo)",
    "var(--accent-violet)",
    "var(--status-warning)",
    "var(--status-info)"
  ];

  // --- Funnel Data ---
  const funnelStages = useMemo(() => {
    const totalCalls = cases.length;

    const evaluated = cases.filter(
      c => c.extraction_status === "Completed" || c.viability_score
    ).length;

    const retainerSent = cases.filter(
      c =>
        c.retainer_sent_at ||
        c.docuseal_status === "Sent" ||
        c.docuseal_status === "Completed"
    ).length;

    const signedOrSynced = cases.filter(
      c =>
        c.retainer_signed_at ||
        c.docuseal_status === "Completed" ||
        c.clio_matter_id
    ).length;

    return [
      {
        label: "Total Leads",
        count: totalCalls,
        percent: 100,
        color: "var(--accent-teal)"
      },
      {
        label: "AI Evaluated",
        count: evaluated,
        percent: totalCalls ? Math.round((evaluated / totalCalls) * 100) : 0,
        color: "var(--accent-blue)"
      },
      {
        label: "Retainer Sent",
        count: retainerSent,
        percent: totalCalls ? Math.round((retainerSent / totalCalls) * 100) : 0,
        color: "var(--accent-indigo)"
      },
      {
        label: "Cases Signed",
        count: signedOrSynced,
        percent: totalCalls
          ? Math.round((signedOrSynced / totalCalls) * 100)
          : 0,
        color: "var(--status-success)"
      }
    ];
  }, [cases]);

  // --- Practice Area Data ---
  const practiceData = useMemo(() => {
    const practiceCounts: Record<string, number> = {};

    cases.forEach(c => {
      let category = "Motor Vehicle Accident";

      const summary = (c.incident_summary || "").toLowerCase();
      const memo = (c.case_evaluation_memo || "").toLowerCase();

      if (
        summary.includes("slip") ||
        summary.includes("fall") ||
        summary.includes("floor") ||
        summary.includes("puddle") ||
        memo.includes("premises")
      ) {
        category = "Premises Liability (Slip & Fall)";
      } else if (
        summary.includes("salon") ||
        summary.includes("burn") ||
        summary.includes("bleach") ||
        summary.includes("professional") ||
        memo.includes("negligence")
      ) {
        category = "Professional Liability";
      } else if (
        summary.includes("bicycle") ||
        summary.includes("bike") ||
        summary.includes("cyclist")
      ) {
        category = "Bicycle Accident";
      } else if (
        summary.includes("dog") ||
        summary.includes("bite") ||
        summary.includes("animal")
      ) {
        category = "Animal Attack / Dog Bite";
      } else if (
        summary.includes("work") ||
        summary.includes("employer") ||
        summary.includes("construction")
      ) {
        category = "Workplace Injury";
      }

      practiceCounts[category] = (practiceCounts[category] || 0) + 1;
    });

    return Object.entries(practiceCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: cases.length ? Math.round((count / cases.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [cases]);

  // --- Trend Data ---
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));

      return {
        dateLabel: d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "numeric",
          day: "numeric"
        }),
        shortLabel: d.toLocaleDateString("en-US", {
          weekday: "short"
        }),
        dateString: d.toISOString().split("T")[0],
        count: 0
      };
    });

    cases.forEach(c => {
      if (!c.created_at) return;

      const caseDate = c.created_at.split("T")[0];
      const match = last7Days.find(d => d.dateString === caseDate);

      if (match) {
        match.count += 1;
      }
    });

    return last7Days;
  }, [cases]);

  // --- SVG Area Trend Computations ---
  const chartHeight = 170;
  const chartWidth = 560;
  const maxCount = Math.max(...trendData.map(d => d.count), 4);

  const points = trendData.map((d, index) => {
    const x = (index / 6) * (chartWidth - 56) + 36;
    const y = chartHeight - ((d.count / maxCount) * (chartHeight - 52) + 28);

    return { x, y, ...d };
  });

  const linePath = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${
          chartHeight - 18
        } L ${points[0].x} ${chartHeight - 18} Z`
      : "";

  // Donut chart math
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <>
      <div className="analytics-charts-grid">
        {/* 1. Area Trend Chart */}
        <section className="glass-card analytics-card">
          <h3 className="analytics-card-title">7-Day Intake Trend</h3>

          <div className="analytics-chart-scroll">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="trend-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--accent-teal)"
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--accent-teal)"
                    stopOpacity="0"
                  />
                </linearGradient>

                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--accent-blue)" />
                  <stop offset="100%" stopColor="var(--accent-teal)" />
                </linearGradient>
              </defs>

              {Array.from({ length: 5 }).map((_, i) => {
                const y = 24 + (i * (chartHeight - 56)) / 4;
                const gridVal = Math.round(maxCount - (i * maxCount) / 4);

                return (
                  <g key={i}>
                    <line
                      x1="36"
                      y1={y}
                      x2={chartWidth - 20}
                      y2={y}
                      stroke="var(--chart-gridline)"
                      strokeDasharray="3"
                    />
                    <text
                      x="8"
                      y={y + 4}
                      fill="var(--text-muted)"
                      fontSize="10"
                      textAnchor="start"
                    >
                      {gridVal}
                    </text>
                  </g>
                );
              })}

              {points.length > 0 && <path d={areaPath} fill="url(#areaGrad)" />}

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

              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="var(--bg-dark)"
                    stroke="var(--accent-teal)"
                    strokeWidth="2"
                  />

                  <circle cx={p.x} cy={p.y} r="12" fill="transparent">
                    <title>{`${p.dateLabel}: ${p.count} intakes`}</title>
                  </circle>

                  <text
                    x={p.x}
                    y={chartHeight - 4}
                    fill="var(--text-muted)"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {p.shortLabel}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>

        {/* 2. Donut Chart */}
        <section className="glass-card analytics-card">
          <h3 className="analytics-card-title">Case Mix by Practice Area</h3>

          <div className="donut-wrap">
            <div className="donut-chart-box">
              <svg
                viewBox="0 0 100 100"
                className="donut-svg"
                aria-label="Case mix by practice area"
              >
                {practiceData.length === 0 ? (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="var(--chart-empty-ring)"
                    strokeWidth="18"
                  />
                ) : (
                  practiceData.map((p, idx) => {
                    const strokeWidth = hoveredPractice === p.name ? 20 : 16;
                    const strokeDash = (p.percentage / 100) * circumference;
                    const strokeOffset =
                      circumference -
                      (cumulativePercent / 100) * circumference;

                    cumulativePercent += p.percentage;

                    return (
                      <circle
                        key={p.name}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={colors[idx % colors.length]}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap={p.percentage === 100 ? "butt" : "round"}
                        className="donut-segment"
                        onMouseEnter={() => setHoveredPractice(p.name)}
                        onMouseLeave={() => setHoveredPractice(null)}
                      />
                    );
                  })
                )}
              </svg>

              <div className="donut-center">
                <span className="donut-total">{cases.length}</span>
                <span className="donut-label">Cases</span>
              </div>
            </div>

            <div className="practice-legend">
              {practiceData.length === 0 ? (
                <div className="empty-state">No practice area data yet</div>
              ) : (
                practiceData.slice(0, 4).map((p, idx) => (
                  <div
                    key={p.name}
                    className={`practice-row ${
                      hoveredPractice === p.name ? "is-active" : ""
                    }`}
                    onMouseEnter={() => setHoveredPractice(p.name)}
                    onMouseLeave={() => setHoveredPractice(null)}
                  >
                    <div className="practice-name-wrap">
                      <span
                        className="practice-dot"
                        style={{ background: colors[idx % colors.length] }}
                      />
                      <span className="practice-name" title={p.name}>
                        {p.name}
                      </span>
                    </div>

                    <span className="practice-count">
                      {p.count} ({p.percentage}%)
                    </span>
                  </div>
                ))
              )}

              {practiceData.length > 4 && (
                <div className="more-categories">
                  + {practiceData.length - 4} more categories
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Conversion Funnel */}
        <section className="glass-card analytics-card analytics-card-full">
          <h3 className="analytics-card-title">
            Intake Pipeline Conversion Funnel
          </h3>

          <div className="funnel-grid">
            {funnelStages.map(stage => (
              <div key={stage.label} className="funnel-stage">
                <div
                  className="funnel-stage-card"
                  style={{ borderLeftColor: stage.color }}
                >
                  <span className="funnel-label">{stage.label}</span>

                  <div className="funnel-count">{stage.count}</div>

                  <div className="funnel-percent">
                    {stage.percent}% conversion rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .analytics-charts-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(16px, 2vw, 24px);
          width: 100%;
          min-width: 0;
        }

        .analytics-card {
          min-width: 0;
          overflow: hidden;
        }

        .analytics-card-full {
          grid-column: 1 / -1;
        }

        .analytics-card-title {
          font-size: clamp(1rem, 1.5vw, 1.1rem);
          line-height: 1.25;
          margin: 0 0 16px;
          color: var(--text-primary);
        }

        .analytics-chart-scroll {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .trend-svg {
          display: block;
          width: 100%;
          min-width: 420px;
          height: auto;
        }

        .donut-wrap {
          display: flex;
          align-items: center;
          gap: clamp(18px, 3vw, 28px);
          width: 100%;
          min-width: 0;
        }

        .donut-chart-box {
          position: relative;
          width: clamp(118px, 28vw, 150px);
          height: clamp(118px, 28vw, 150px);
          flex: 0 0 auto;
        }

        .donut-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
          overflow: visible;
        }

        .donut-segment {
          transition: stroke-width 0.25s ease, opacity 0.25s ease;
          cursor: pointer;
        }

        .donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          pointer-events: none;
        }

        .donut-total {
          display: block;
          font-size: clamp(1.35rem, 3vw, 1.65rem);
          line-height: 1;
          font-weight: 800;
          color: var(--text-primary);
        }

        .donut-label {
          display: block;
          margin-top: 6px;
          font-size: 0.68rem;
          letter-spacing: 0.04em;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .practice-legend {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .practice-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          min-width: 0;
          padding: 6px 8px;
          border-radius: 8px;
          background: transparent;
          transition: background 0.2s ease;
        }

        .practice-row.is-active {
          background: var(--chart-hover-bg);
        }

        .practice-name-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }

        .practice-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          flex: 0 0 auto;
        }

        .practice-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .practice-count {
          flex: 0 0 auto;
          white-space: nowrap;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .more-categories,
        .empty-state {
          font-size: 0.76rem;
          color: var(--text-muted);
          padding-left: 18px;
        }

        .funnel-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          width: 100%;
        }

        .funnel-stage {
          min-width: 0;
        }

        .funnel-stage-card {
          height: 100%;
          padding: clamp(14px, 2vw, 18px);
          text-align: center;
          background: var(--funnel-card-bg);
          border-left: 4px solid;
          border-radius: 12px;
        }

        .funnel-label {
          display: block;
          font-size: 0.72rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .funnel-count {
          font-size: clamp(1.55rem, 3vw, 1.9rem);
          font-weight: 800;
          margin: 8px 0;
          color: var(--text-primary);
          line-height: 1;
        }

        .funnel-percent {
          font-size: 0.76rem;
          color: var(--text-muted);
        }

        @media (max-width: 980px) {
          .analytics-charts-grid {
            grid-template-columns: 1fr;
          }

          .analytics-card-full {
            grid-column: auto;
          }

          .funnel-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .analytics-charts-grid {
            gap: 14px;
          }

          .donut-wrap {
            align-items: stretch;
            flex-direction: column;
          }

          .donut-chart-box {
            align-self: center;
            width: 150px;
            height: 150px;
          }

          .practice-row {
            padding-inline: 4px;
          }

          .practice-name {
            font-size: 0.8rem;
          }

          .practice-count {
            font-size: 0.78rem;
          }

          .funnel-grid {
            grid-template-columns: 1fr;
          }

          .trend-svg {
            min-width: 360px;
          }
        }

        @media (max-width: 420px) {
          .donut-chart-box {
            width: 132px;
            height: 132px;
          }

          .practice-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          .practice-count {
            padding-left: 18px;
          }

          .trend-svg {
            min-width: 330px;
          }
        }
      `}</style>
    </>
  );
};

export default AnalyticsCharts;
