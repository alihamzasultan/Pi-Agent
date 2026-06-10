import React from "react";
import type { IntakeCase } from "../services/supabase";
import { Scale, MapPin, Phone, Mail, FileSignature, User, Calendar, Shield, AlertTriangle } from "lucide-react";

const FIRM_INFO = {
  name: "Personal Injury",
  address: "ABC Street California",
  phone: "93939393939",
  email: "personalinjury@gmail.com",
};

type TriState = "Yes" | "No" | "Unknown" | "Unsure";

function parseTriState(value: string | null | undefined, kind: "police" | "insurance" | "fault"): TriState {
  if (value === null || value === undefined || String(value).trim() === "") {
    return kind === "fault" ? "Unsure" : "Unknown";
  }

  const v = String(value).toLowerCase().trim();

  // Boolean strings from n8n / automation pipelines
  if (v === "true") return "Yes";
  if (v === "false") return kind === "fault" ? "No" : kind === "police" ? "No" : "No";

  if (kind === "fault") {
    if (v === "no" || v.startsWith("no ") || v.includes("not at fault") || v.includes("no fault")) return "No";
    if (v === "yes" || v.startsWith("yes ") || v.includes("at fault") || v.includes("partial")) return "Yes";
    if (v === "unsure" || v === "unknown") return "Unsure";
    return "Unsure";
  }

  if (kind === "police") {
    if (v === "filed" || v.includes("filed") || v.includes("report filed") || v.startsWith("yes")) return "Yes";
    if (v === "no" || v.includes("not filed") || v.includes("no report") || v.includes("none")) return "No";
    if (v === "unknown" || v.includes("unknown")) return "Unknown";
    return "Unknown";
  }

  // insurance
  if (
    v.includes("provided") || v.includes("insured") || v.includes("policy") ||
    v.includes("obtained") || v.includes("have") || v.startsWith("yes")
  ) return "Yes";
  if (v.includes("none") || v.includes("don't") || v.includes("do not") || v.includes("not available")) return "No";
  if (v === "unknown" || v.includes("unknown") || v.includes("unsure")) return "Unknown";
  if (v.includes("insurance") && !v.includes("no insurance")) return "Yes";
  return "Unknown";
}

const TriStateBadge: React.FC<{ value: TriState }> = ({ value }) => {
  const styles: Record<TriState, string> = {
    Yes: "badge-success",
    No: "badge-danger",
    Unknown: "badge-info",
    Unsure: "badge-warning",
  };
  return <span className={`badge ${styles[value]}`}>{value}</span>;
};

function isIntakeComplete(c: IntakeCase): boolean {
  return !!(
    c.client_name &&
    (c.phone || c.customer_number) &&
    c.incident_summary &&
    c.accident_date &&
    c.police_report &&
    c.insurance_status &&
    c.at_fault
  );
}

interface Props {
  cases: IntakeCase[];
  onSelectCase: (c: IntakeCase) => void;
}

export const RetainerAgreementDashboard: React.FC<Props> = ({ cases, onSelectCase }) => {
  const completeCount = cases.filter(isIntakeComplete).length;
  const signedCount = cases.filter(c => c.retainer_signed_at || c.docuseal_status === "Completed").length;
  const sentCount = cases.filter(c => c.retainer_sent_at || c.docuseal_status === "Sent" || c.docuseal_status === "Completed").length;
  const pendingSign = sentCount - signedCount;

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Law Firm Header — from Retainer Agreement */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Scale size={20} style={{ color: "var(--accent-teal)" }} />
          <h2 style={{ fontSize: "1.15rem", color: "var(--text-primary)", margin: 0 }}>
            Personal Injury Firm Retainer Agreement
          </h2>
        </div>
        <div className="firm-info-grid">
          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Law Firm / Attorney</span>
            <p style={{ color: "var(--text-primary)", fontWeight: 600, margin: "4px 0 0" }}>{FIRM_INFO.name}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <MapPin size={14} style={{ color: "var(--text-muted)", marginTop: "3px", flexShrink: 0 }} />
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Address</span>
              <p style={{ color: "var(--text-primary)", margin: "4px 0 0" }}>{FIRM_INFO.address}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <Phone size={14} style={{ color: "var(--text-muted)", marginTop: "3px", flexShrink: 0 }} />
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Phone</span>
              <p style={{ color: "var(--text-primary)", margin: "4px 0 0" }}>{FIRM_INFO.phone}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <Mail size={14} style={{ color: "var(--text-muted)", marginTop: "3px", flexShrink: 0 }} />
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Email</span>
              <p style={{ color: "var(--text-primary)", margin: "4px 0 0" }}>{FIRM_INFO.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Retainer Intake Summary */}
      <div className="retainer-summary-grid">
        {[
          { label: "Intake Complete", value: completeCount, total: cases.length, icon: <User size={16} /> },
          { label: "Retainers Sent", value: sentCount, total: cases.length, icon: <FileSignature size={16} /> },
          { label: "Retainers Signed", value: signedCount, total: cases.length, icon: <Shield size={16} /> },
          { label: "Pending Signature", value: pendingSign, total: cases.length, icon: <AlertTriangle size={16} /> },
        ].map(item => (
          <div key={item.label} className="glass-card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "6px" }}>
              {item.icon}
              <span>{item.label}</span>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {item.value}
              <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}> / {item.total}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Purpose of Representation — Incident Intake Table */}
      <div className="glass-card table-responsive clio-table-responsive" style={{ padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.15rem", color: "var(--text-primary)", margin: "0 0 6px" }}>
            Purpose of Representation
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Incident details collected for each potential personal injury claim, as defined in the retainer agreement.
          </p>
        </div>

        <div className="table-container">
          <table className="custom-table clio-table">
            <thead>
              <tr>
                <th>Client Full Name</th>
                <th>Callback Number</th>
                <th>What Happened?</th>
                <th>Accident Date</th>
                <th>Police Report?</th>
                <th>Insurance Info?</th>
                <th>At Fault?</th>
                <th>Retainer</th>
              </tr>
            </thead>
            <tbody>
              {recentCases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No intake cases yet. Use Simulate Lead to generate a case.
                  </td>
                </tr>
              ) : (
                recentCases.map((c, i) => {
                  const isSigned = c.retainer_signed_at || c.docuseal_status === "Completed";
                  const isSent = c.retainer_sent_at || c.docuseal_status === "Sent";
                  const intakeOk = isIntakeComplete(c);

                  return (
                    <tr key={c.call_id || i} onClick={() => onSelectCase(c)} style={{ cursor: "pointer" }}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.client_name || "—"}</div>
                        {!intakeOk && (
                          <span className="badge badge-warning" style={{ marginTop: "4px", fontSize: "0.65rem" }}>Incomplete</span>
                        )}
                      </td>
                      <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        {c.phone || c.customer_number || "—"}
                      </td>
                      <td style={{ fontSize: "0.82rem", maxWidth: "220px" }}>
                        <span style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          color: "var(--text-secondary)",
                          lineHeight: 1.4,
                        }}>
                          {c.incident_summary || "—"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={12} style={{ color: "var(--text-muted)" }} />
                          {c.accident_date || "—"}
                        </span>
                      </td>
                      <td><TriStateBadge value={parseTriState(c.police_report, "police")} /></td>
                      <td><TriStateBadge value={parseTriState(c.insurance_status, "insurance")} /></td>
                      <td><TriStateBadge value={parseTriState(c.at_fault, "fault")} /></td>
                      <td>
                        {isSigned ? (
                          <span className="badge badge-success">Signed</span>
                        ) : isSent ? (
                          <span className="badge badge-warning">Sent</span>
                        ) : (
                          <span className="badge badge-danger" style={{ opacity: 0.5 }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-card-rows">
          {recentCases.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No cases yet.</div>
          ) : (
            recentCases.map((c, i) => (
              <div key={c.call_id || i} className="mobile-row-card" onClick={() => onSelectCase(c)}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                  {c.client_name || "Unknown Client"}
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Callback</span>
                  <span className="mobile-row-value">{c.phone || c.customer_number || "—"}</span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">What Happened</span>
                  <span className="mobile-row-value" style={{ fontSize: "0.82rem" }}>{c.incident_summary || "—"}</span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Accident Date</span>
                  <span className="mobile-row-value">{c.accident_date || "—"}</span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Police / Insurance / Fault</span>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <TriStateBadge value={parseTriState(c.police_report, "police")} />
                    <TriStateBadge value={parseTriState(c.insurance_status, "insurance")} />
                    <TriStateBadge value={parseTriState(c.at_fault, "fault")} />
                  </div>
                </div>
                <div className="mobile-row-field" style={{ borderBottom: "none" }}>
                  <span className="mobile-row-label">Retainer</span>
                  <span className="mobile-row-value">
                    {(c.retainer_signed_at || c.docuseal_status === "Completed") ? (
                      <span className="badge badge-success">Signed</span>
                    ) : (c.retainer_sent_at || c.docuseal_status === "Sent") ? (
                      <span className="badge badge-warning">Sent</span>
                    ) : (
                      <span className="badge badge-danger" style={{ opacity: 0.5 }}>Pending</span>
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RetainerAgreementDashboard;

/* Inject firm-info responsive styles once */
if (typeof document !== 'undefined' && !document.getElementById('rad-styles')) {
  const s = document.createElement('style');
  s.id = 'rad-styles';
  s.textContent = `
    .firm-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      font-size: 0.85rem;
    }
    @media (max-width: 480px) {
      .firm-info-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `;
  document.head.appendChild(s);
}
