import React, { useState } from "react";
import type { IntakeCase, CallLog, ClioRecord, DocusealRetainer } from "../services/supabase";
import { Search, Phone, FileText, ExternalLink, Play, Pause } from "lucide-react";

// Helper for rendering viability rings
export const ViabilityRing: React.FC<{ score: string | number | null }> = ({ score }) => {
  const numScore = score ? parseInt(String(score), 10) : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (numScore / 100) * circumference;

  let color = "var(--status-danger)";
  if (numScore >= 75) color = "var(--status-success)";
  else if (numScore >= 50) color = "var(--status-warning)";

  return (
    <div className="viability-ring-container">
      <svg width="46" height="46" viewBox="0 0 46 46">
        <circle cx="23" cy="23" r={radius} fill="none" stroke="var(--viability-ring-track)" strokeWidth="3" />
        <circle
          cx="23" cy="23" r={radius} fill="none"
          stroke={color} strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <span className="viability-score-text" style={{ color }}>{numScore ? `${numScore}%` : "—"}</span>
    </div>
  );
};

// Helper for status badges
export const ActionBadge: React.FC<{ action: string | null }> = ({ action }) => {
  if (!action) return <span className="badge badge-info">Evaluating</span>;
  const act = action.toLowerCase();
  if (act.includes("accept")) return <span className="badge badge-success">Accept Case</span>;
  if (act.includes("decline") || act.includes("reject")) return <span className="badge badge-danger">Decline Case</span>;
  return <span className="badge badge-warning">Investigate</span>;
};

// --- 1. Intake Cases ListView ---
interface IntakeCasesListProps {
  cases: IntakeCase[];
  onSelectCase: (c: IntakeCase) => void;
}

export const IntakeCasesListView: React.FC<IntakeCasesListProps> = ({ cases, onSelectCase }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredCases = cases.filter(c => {
    const matchesSearch =
      (c.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search) ||
      (c.customer_number || "").includes(search) ||
      (c.incident_summary || "").toLowerCase().includes(search.toLowerCase());

    const isSigned = c.retainer_signed_at || c.docuseal_status === "Completed";
    const isSent = c.retainer_sent_at || c.docuseal_status === "Sent";
    const isDeclined = c.recommended_action?.toLowerCase().includes("decline");
    const isClioSynced = !!c.clio_matter_id;

    if (statusFilter === "All") return matchesSearch;
    if (statusFilter === "Signed") return matchesSearch && isSigned;
    if (statusFilter === "Retainer Sent") return matchesSearch && isSent && !isSigned;
    if (statusFilter === "Clio Synced") return matchesSearch && isClioSynced;
    if (statusFilter === "Declined") return matchesSearch && isDeclined;
    if (statusFilter === "Evaluating") return matchesSearch && !isSigned && !isSent && !isDeclined;
    return matchesSearch;
  });

  return (
    <div className="glass-card table-responsive" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>Intake Pipeline Leads</h2>

        <div className="search-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div className="search-container" style={{ width: "240px" }}>
            <Search className="search-icon" size={16} />
            <input
              type="text" placeholder="Search leads..."
              className="search-input" value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="search-input"
            style={{ width: "160px", paddingLeft: "12px" }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Evaluating">AI Evaluating</option>
            <option value="Retainer Sent">Retainer Sent</option>
            <option value="Signed">Retainer Signed</option>
            <option value="Clio Synced">Clio Synced</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Client Lead</th>
              <th>Contact Info</th>
              <th>Date Ingested</th>
              <th>Viability</th>
              <th>Liability Status</th>
              <th>Recommended Action</th>
              <th>Integrations</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No intake cases found matching the criteria.
                </td>
              </tr>
            ) : (
              filteredCases.map((c, i) => {
                const date = c.created_at ? new Date(c.created_at).toLocaleDateString() : "Pending";
                const isSigned = c.retainer_signed_at || c.docuseal_status === "Completed";
                const isSent = c.retainer_sent_at || c.docuseal_status === "Sent";

                return (
                  <tr key={i} onClick={() => onSelectCase(c)} style={{ cursor: "pointer" }}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.client_name || "Unknown Lead"}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Call ID: {c.call_id ? `${c.call_id.slice(0, 8)}...` : "Manual"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}>
                        <Phone size={12} style={{ color: "var(--text-muted)" }} />
                        {c.phone || c.customer_number || "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{date}</td>
                    <td><ViabilityRing score={c.viability_score} /></td>
                    <td style={{ fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "var(--text-primary)" }}>{c.liability_assessment || "Pending AI"}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                          {c.liability_reason || "Extracting details..."}
                        </span>
                      </div>
                    </td>
                    <td><ActionBadge action={c.recommended_action} /></td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {c.clio_matter_id ? (
                          <span className="badge badge-success" title="Clio Synced">Clio</span>
                        ) : c.clio_contact_id ? (
                          <span className="badge badge-warning" title="Clio Contact Created">Clio Contact</span>
                        ) : (
                          <span className="badge badge-danger" style={{ opacity: 0.4 }} title="Not in Clio">Clio</span>
                        )}
                        {isSigned ? (
                          <span className="badge badge-success" title="Retainer Signed">Retained</span>
                        ) : isSent ? (
                          <span className="badge badge-warning" title="Retainer Sent">Sent</span>
                        ) : (
                          <span className="badge badge-danger" style={{ opacity: 0.4 }} title="No Retainer">Retainer</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Rows */}
      <div className="mobile-card-rows">
        {filteredCases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            No intake cases found.
          </div>
        ) : (
          filteredCases.map((c, i) => {
            const date = c.created_at ? new Date(c.created_at).toLocaleDateString() : "Pending";
            const isSigned = c.retainer_signed_at || c.docuseal_status === "Completed";
            const isSent = c.retainer_sent_at || c.docuseal_status === "Sent";

            return (
              <div key={i} className="mobile-row-card" onClick={() => onSelectCase(c)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "1rem" }}>{c.client_name || "Unknown Lead"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {c.phone || c.customer_number || "—"} • {date}
                    </div>
                  </div>
                  <ViabilityRing score={c.viability_score} />
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Liability</span>
                  <span className="mobile-row-value">{c.liability_assessment || "Pending AI"}</span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Action</span>
                  <span className="mobile-row-value"><ActionBadge action={c.recommended_action} /></span>
                </div>
                <div className="mobile-row-field" style={{ borderBottom: "none" }}>
                  <span className="mobile-row-label">Status</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {c.clio_matter_id
                      ? <span className="badge badge-success">Clio</span>
                      : <span className="badge badge-danger" style={{ opacity: 0.4 }}>Clio</span>}
                    {isSigned
                      ? <span className="badge badge-success">Retained</span>
                      : isSent
                        ? <span className="badge badge-warning">Sent</span>
                        : <span className="badge badge-danger" style={{ opacity: 0.4 }}>Retainer</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


// --- 2. Call Logs ListView ---
interface CallLogsListProps {
  logs: CallLog[];
}

export const CallLogsListView: React.FC<CallLogsListProps> = ({ logs }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio] = useState(new Audio());

  const handlePlayRecording = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingId === id) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.src = url;
      audio.play();
      setPlayingId(id);
      audio.onended = () => setPlayingId(null);
    }
  };

  return (
    <div className="glass-card table-responsive" style={{ padding: "24px" }}>
      <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "20px" }}>Voice Call Intake Logs (Vapi AI)</h2>

      {/* Desktop Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Caller Number</th>
              <th>Date & Time</th>
              <th>Duration</th>
              <th>Hangup Reason</th>
              <th>AI Assistant</th>
              <th>Usage Cost</th>
              <th>Tech Stack</th>
              <th>Recording</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No Vapi call logs available in database.
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => {
                const date = log.started_at ? new Date(log.started_at).toLocaleString() : "—";
                const dur = log.duration_seconds ? `${Math.round(parseInt(log.duration_seconds, 10))}s` : "—";

                return (
                  <tr key={idx}>
                    <td><span style={{ fontWeight: 600 }}>{log.customer_number || "Anonymous"}</span></td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{date}</td>
                    <td style={{ fontSize: "0.85rem" }}>{dur} ({log.duration_minutes ? `${log.duration_minutes}m` : "—"})</td>
                    <td>
                      <span className={`badge ${log.ended_reason === "Completed" ? "badge-success" : "badge-warning"}`}>
                        {log.ended_reason || "Ended"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{log.assistant_name || "Intake Agent"}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>ID: {log.assistant_id || "—"}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-teal)" }}>
                      ${log.total_cost || log.cost || "0.00"}
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span>LLM: {log.model_name || "gpt-4o"}</span>
                        <span>TTS: {log.voice_provider || "Cartesia"}</span>
                      </div>
                    </td>
                    <td>
                      {log.recording_url ? (
                        <button
                          className="btn-secondary"
                          style={{ padding: "6px 12px", fontSize: "0.75rem", display: "inline-flex", gap: "4px" }}
                          onClick={(e) => handlePlayRecording(log.call_id, log.recording_url!, e)}
                        >
                          {playingId === log.call_id ? <Pause size={12} /> : <Play size={12} />}
                          {playingId === log.call_id ? "Pause" : "Listen"}
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No Audio</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Rows */}
      <div className="mobile-card-rows">
        {logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No call logs.</div>
        ) : (
          logs.map((log, idx) => {
            const date = log.started_at ? new Date(log.started_at).toLocaleString() : "—";
            const dur = log.duration_seconds ? `${Math.round(parseInt(log.duration_seconds, 10))}s` : "—";

            return (
              <div key={idx} className="mobile-row-card" style={{ cursor: "default" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{log.customer_number || "Anonymous"}</div>
                  <span className={`badge ${log.ended_reason === "Completed" ? "badge-success" : "badge-warning"}`}>
                    {log.ended_reason || "Ended"}
                  </span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Date</span>
                  <span className="mobile-row-value" style={{ fontSize: "0.8rem" }}>{date}</span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Duration</span>
                  <span className="mobile-row-value">{dur}</span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Cost</span>
                  <span className="mobile-row-value" style={{ color: "var(--accent-teal)", fontWeight: 600 }}>${log.total_cost || log.cost || "0.00"}</span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">AI Model</span>
                  <span className="mobile-row-value" style={{ fontSize: "0.8rem" }}>{log.model_name || "gpt-4o"} / {log.voice_provider || "Cartesia"}</span>
                </div>
                {log.recording_url && (
                  <div style={{ marginTop: "8px" }}>
                    <button
                      className="btn-secondary"
                      style={{ width: "100%", justifyContent: "center", padding: "8px", fontSize: "0.8rem" }}
                      onClick={(e) => handlePlayRecording(log.call_id, log.recording_url!, e)}
                    >
                      {playingId === log.call_id ? <Pause size={14} /> : <Play size={14} />}
                      {playingId === log.call_id ? "Pause Recording" : "Play Recording"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


// --- Clio helpers ---
const resolveClioMatterStatus = (record: ClioRecord): { label: string; badgeClass: string } => {
  const raw = record.clio_matter_status?.trim();
  if (raw) {
    const s = raw.toLowerCase();
    if (s === "open") return { label: raw, badgeClass: "badge-success" };
    if (s.includes("pending")) return { label: raw, badgeClass: "badge-warning" };
    if (s === "closed") return { label: raw, badgeClass: "badge-info" };
    if (s === "created") return { label: "Created", badgeClass: "badge-success" };
    return { label: raw, badgeClass: "badge-info" };
  }
  // Matter/contact IDs exist but status column wasn't populated
  if (record.clio_matter_id) return { label: "Created", badgeClass: "badge-success" };
  if (record.clio_contact_id) return { label: "Contact Only", badgeClass: "badge-warning" };
  return { label: "Not Created", badgeClass: "badge-danger" };
};

const formatClioSyncDate = (record: ClioRecord): string => {
  const raw = record.updated_at || record.created_at;
  if (!raw) return "—";
  const cleaned = raw.replace(/\s*\}+\s*$/g, "").trim();
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString();
};

const clioRecordScore = (record: ClioRecord): number => {
  let score = 0;
  if (record.clio_matter_id) score += 4;
  if (record.clio_contact_id) score += 2;
  if (record.clio_matter_status) score += 1;
  if (record.clio_note_subject) score += 1;
  if (record.updated_at || record.created_at) score += 1;
  return score;
};

const dedupeClioRecords = (records: ClioRecord[]): ClioRecord[] => {
  const byKey = new Map<string, ClioRecord>();
  records.forEach((record, idx) => {
    const key = record.call_id || (record as ClioRecord & { row_id?: string }).row_id || record.id || `row-${idx}`;
    const existing = byKey.get(key);
    if (!existing || clioRecordScore(record) > clioRecordScore(existing)) {
      byKey.set(key, record);
    }
  });
  return Array.from(byKey.values());
};

// --- 3. Clio Records ListView ---
interface ClioRecordsListProps {
  clioRecords: ClioRecord[];
}

export const ClioRecordsListView: React.FC<ClioRecordsListProps> = ({ clioRecords }) => {
  const records = dedupeClioRecords(clioRecords);
  const syncedContacts = records.filter(r => r.clio_contact_id).length;
  const syncedMatters = records.filter(r => r.clio_matter_id).length;
  const syncedNotes = records.filter(r => r.clio_note_subject).length;

  return (
    <div className="glass-card table-responsive clio-table-responsive" style={{ padding: "24px" }}>
      <div className="list-view-header">
        <div style={{ minWidth: 0, flex: "1 1 240px" }}>
          <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", margin: "0 0 6px" }}>Clio CRM Legal Cases Status</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Contacts, matters, and intake notes synced from AI intake workflow.
          </p>
        </div>
        <div className="list-view-header-badges">
          <span className="badge badge-info">{syncedContacts} Contacts</span>
          <span className="badge badge-success">{syncedMatters} Matters</span>
          <span className="badge badge-warning">{syncedNotes} Notes</span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="table-container">
        <table className="custom-table clio-table">
          <thead>
            <tr>
              <th className="col-client">Client / Contact</th>
              <th className="col-phone">Phone</th>
              <th className="col-contact-id">Contact ID</th>
              <th className="col-matter-id">Matter ID</th>
              <th className="col-status">Status</th>
          
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No Clio contact or matter sync records found.
                </td>
              </tr>
            ) : (
              records.map((r, idx) => {
          
                const matterStatus = resolveClioMatterStatus(r);
                return (
                  <tr key={(r as ClioRecord & { row_id?: string }).row_id || r.id || r.call_id || idx}>
                    <td className="col-client">
                      <div className="cell-stack">
                        <span className="cell-ellipsis" title={r.client_name || "Unknown"}>{r.client_name || "Unknown"}</span>
                        {r.clio_matter_description && (
                          <span className="cell-sub cell-ellipsis" title={r.clio_matter_description}>
                            {r.clio_matter_description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="col-phone" style={{ fontSize: "0.85rem" }}>
                      <span className="cell-ellipsis" title={r.phone || ""}>{r.phone || "—"}</span>
                    </td>
                    <td className="col-contact-id" style={{ fontSize: "0.85rem" }}>
                      {r.clio_contact_id
                        ? <span className="cell-ellipsis" style={{ color: "var(--accent-teal)", fontFamily: "monospace" }} title={r.clio_contact_id}>{r.clio_contact_id}</span>
                        : <span style={{ color: "var(--status-danger)" }}>Not Synced</span>}
                    </td>
                    <td className="col-matter-id" style={{ fontSize: "0.85rem" }}>
                      {r.clio_matter_id
                        ? <span className="cell-ellipsis" style={{ color: "var(--accent-blue)", fontFamily: "monospace" }} title={r.clio_matter_id}>{r.clio_matter_id}</span>
                        : <span style={{ color: "var(--text-muted)" }}>Not Created</span>}
                    </td>
                    <td className="col-status">
                      <span className={`badge ${matterStatus.badgeClass}`}>{matterStatus.label}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Rows */}
      <div className="mobile-card-rows">
        {records.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No Clio records.</div>
        ) : (
          records.map((r, idx) => {
            const matterStatus = resolveClioMatterStatus(r);
            return (
              <div key={(r as ClioRecord & { row_id?: string }).row_id || r.id || r.call_id || idx} className="mobile-row-card" style={{ cursor: "default" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "1rem", marginBottom: "4px" }}>
                  {r.client_name || "Unknown"}
                </div>
                {r.clio_matter_description && (
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "8px", lineHeight: 1.4 }}>
                    {r.clio_matter_description}
                  </p>
                )}
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Phone</span>
                  <span className="mobile-row-value">{r.phone || "—"}</span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Matter Status</span>
                  <span className="mobile-row-value">
                    <span className={`badge ${matterStatus.badgeClass}`}>{matterStatus.label}</span>
                  </span>
                </div>
      
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Contact ID</span>
                  <span className="mobile-row-value" style={{ fontFamily: "monospace", fontSize: "0.8rem", color: r.clio_contact_id ? "var(--accent-teal)" : "var(--status-danger)" }}>
                    {r.clio_contact_id || "Not Synced"}
                  </span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Matter ID</span>
                  <span className="mobile-row-value" style={{ fontFamily: "monospace", fontSize: "0.8rem", color: r.clio_matter_id ? "var(--accent-blue)" : "var(--text-muted)" }}>
                    {r.clio_matter_id || "Not Created"}
                  </span>
                </div>
           
             
       
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


// --- 4. Docuseal Retainers ListView ---
interface DocusealRetainersListProps {
  retainers: DocusealRetainer[];
}

export const DocusealRetainersListView: React.FC<DocusealRetainersListProps> = ({ retainers }) => {
  return (
    <div className="glass-card table-responsive" style={{ padding: "24px" }}>
      <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "20px" }}>Docuseal Retainer Agreement Tracking</h2>

      {/* Desktop Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Client Email</th>
              <th>Submission ID</th>
              <th>Status</th>
              <th>Sent At</th>
              <th>Signed At</th>
              <th>Signed Retainer</th>
            </tr>
          </thead>
          <tbody>
            {retainers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No Docuseal retainer documents found.
                </td>
              </tr>
            ) : (
              retainers.map((ret, idx) => {
                const sentDate = ret.sent_at ? new Date(ret.sent_at).toLocaleString() : "—";
                const signDate = ret.completed_at ? new Date(ret.completed_at).toLocaleString() : "—";
                const isSigned = ret.status === "completed" || ret.status === "signed";

                return (
                  <tr key={idx}>
                    <td><span style={{ fontWeight: 600 }}>{ret.client_name || "Unknown"}</span></td>
                    <td style={{ fontSize: "0.85rem" }}>{ret.client_email || "—"}</td>
                    <td style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "var(--text-muted)" }}>{ret.submission_id || "—"}</td>
                    <td>
                      <span className={`badge ${isSigned ? "badge-success" : ret.status === "sent" ? "badge-warning" : "badge-danger"}`}>
                        {ret.status || "Pending"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{sentDate}</td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{signDate}</td>
                    <td>
                      {ret.document_url ? (
                        <a href={ret.document_url} target="_blank" rel="noopener noreferrer" className="btn-secondary"
                          style={{ padding: "6px 12px", fontSize: "0.75rem", display: "inline-flex", gap: "6px" }}>
                          <FileText size={12} /><span>View PDF</span><ExternalLink size={10} />
                        </a>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No document</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Rows */}
      <div className="mobile-card-rows">
        {retainers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No retainer documents.</div>
        ) : (
          retainers.map((ret, idx) => {
            const sentDate = ret.sent_at ? new Date(ret.sent_at).toLocaleString() : "—";
            const signDate = ret.completed_at ? new Date(ret.completed_at).toLocaleString() : "—";
            const isSigned = ret.status === "completed" || ret.status === "signed";

            return (
              <div key={idx} className="mobile-row-card" style={{ cursor: "default" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{ret.client_name || "Unknown"}</span>
                  <span className={`badge ${isSigned ? "badge-success" : ret.status === "sent" ? "badge-warning" : "badge-danger"}`}>
                    {ret.status || "Pending"}
                  </span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Email</span>
                  <span className="mobile-row-value" style={{ fontSize: "0.8rem" }}>{ret.client_email || "—"}</span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Sent</span>
                  <span className="mobile-row-value" style={{ fontSize: "0.8rem" }}>{sentDate}</span>
                </div>
                <div className="mobile-row-field">
                  <span className="mobile-row-label">Signed</span>
                  <span className="mobile-row-value" style={{ fontSize: "0.8rem" }}>{signDate}</span>
                </div>
                {ret.document_url && (
                  <div style={{ marginTop: "8px" }}>
                    <a href={ret.document_url} target="_blank" rel="noopener noreferrer" className="btn-secondary"
                      style={{ width: "100%", justifyContent: "center", padding: "8px", fontSize: "0.8rem", textDecoration: "none" }}>
                      <FileText size={14} /> View Retainer PDF <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
