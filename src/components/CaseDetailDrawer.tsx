import React, { useState } from "react";
import type { IntakeCase } from "../services/supabase";
import { X, Play, Pause, FileText, Send, CheckCircle2, ShieldCheck, Award, MessageSquare, ExternalLink } from "lucide-react";
import { ActionBadge, ViabilityRing } from "./ListViews";

interface CaseDetailDrawerProps {
  caseItem: IntakeCase | null;
  onClose: () => void;
  onUpdateCase: (updatedCase: IntakeCase) => void;
}

export const CaseDetailDrawer: React.FC<CaseDetailDrawerProps> = ({
  caseItem,
  onClose,
  onUpdateCase
}) => {
  if (!caseItem) return null;

  const [activeTab, setActiveTab] = useState<"memo" | "transcript" | "integrations">("memo");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());
  
  // Local editable actions
  const [recommendation, setRecommendation] = useState(caseItem.recommended_action || "");
  const [score, setScore] = useState(caseItem.viability_score || "50");
  const [isSyncingClio, setIsSyncingClio] = useState(false);
  const [isSendingRetainer, setIsSendingRetainer] = useState(false);

  // Play audio helper
  const togglePlayRecording = () => {
    if (!caseItem.recording_url) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = caseItem.recording_url;
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const handleStatusChange = (newRec: string) => {
    setRecommendation(newRec);
    onUpdateCase({
      ...caseItem,
      recommended_action: newRec
    });
  };

  const handleScoreChange = (newScore: string) => {
    setScore(newScore);
    onUpdateCase({
      ...caseItem,
      viability_score: newScore
    });
  };

  const triggerClioSync = () => {
    setIsSyncingClio(true);
    setTimeout(() => {
      setIsSyncingClio(false);
      onUpdateCase({
        ...caseItem,
        clio_contact_id: "clio-c-" + Math.floor(Math.random() * 100000),
        clio_matter_id: "clio-m-" + Math.floor(Math.random() * 100000),
        clio_matter_status: "Open",
        slack_status: "Sent",
        slack_message: `🚨 CLIO SYNCED: ${caseItem.client_name || "Client"}. Clio Contact and Matter generated automatically.`,
        slack_sent_at: new Date().toISOString()
      });
    }, 1500);
  };

  const triggerSendRetainer = () => {
    setIsSendingRetainer(true);
    setTimeout(() => {
      setIsSendingRetainer(false);
      onUpdateCase({
        ...caseItem,
        docuseal_submission_id: "sub-" + Math.floor(Math.random() * 100000),
        docuseal_status: "Sent",
        docuseal_document_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        retainer_sent_at: new Date().toISOString(),
        sms_status: "Sent",
        sms_message: `Hi ${caseItem.client_name || "Client"}, your legal representation retainer is ready for signature. Check your email.`,
        sms_sent_at: new Date().toISOString()
      });
    }, 1500);
  };

  // Parsing dialogue transcripts if any
  const parseTranscript = (text: string | null) => {
    if (!text) return [{ speaker: "System", text: "No transcript available." }];
    
    // Parse formats like "AI: Hello \n User: Hello"
    const lines = text.split("\n");
    const dialogue: { speaker: string; text: string }[] = [];
    
    lines.forEach(line => {
      if (line.startsWith("AI:") || line.startsWith("assistant:")) {
        dialogue.push({ speaker: "Alex (AI)", text: line.replace(/^(AI:|assistant:)/, "").trim() });
      } else if (line.startsWith("User:") || line.startsWith("user:")) {
        dialogue.push({ speaker: "Caller", text: line.replace(/^(User:|user:)/, "").trim() });
      } else if (line.trim().length > 0) {
        // Append to last if it doesn't match a prefix or make it a general line
        if (dialogue.length > 0) {
          dialogue[dialogue.length - 1].text += " " + line.trim();
        } else {
          dialogue.push({ speaker: "Info", text: line.trim() });
        }
      }
    });

    return dialogue;
  };

  const dialogue = parseTranscript(caseItem.transcript);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "min(680px, 100vw)",
      height: "100vh",
      background: "var(--drawer-bg)",
      borderLeft: "1px solid var(--border-color)",
      boxShadow: "var(--drawer-shadow)",
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      animation: "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards"
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Case Details</span>
          <h2 style={{ fontSize: "1.4rem", color: "var(--text-primary)", marginTop: "4px" }}>{caseItem.client_name || "New Intake Case"}</h2>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Quick Status Bar */}
      <div style={{ padding: "16px 24px", background: "rgba(255,255,255,0.01)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ViabilityRing score={caseItem.viability_score} />
          <div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>AI Viability Score</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Based on liability and medical documentation</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <ActionBadge action={caseItem.recommended_action} />
        </div>
      </div>

      {/* Body Content (Scrollable) */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        
        {/* Playback Box if recording exists */}
        {caseItem.recording_url && (
          <div className="glass-card" style={{ padding: "16px", marginBottom: "20px", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", background: "rgba(0, 242, 254, 0.03)", borderColor: "rgba(0, 242, 254, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "rgba(0, 242, 254, 0.1)", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={16} style={{ color: "var(--accent-teal)" }} />
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>Vapi Audio Call Recording</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{caseItem.call_duration_seconds ? `${caseItem.call_duration_seconds} seconds call` : "Play recording"}</div>
              </div>
            </div>
            <button className="btn-primary" onClick={togglePlayRecording}>
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? "Pause" : "Listen"}
            </button>
          </div>
        )}

        {/* Tab Controls */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", marginBottom: "20px" }}>
          <button 
            style={{ 
              padding: "10px 16px", 
              background: "none", 
              border: "none", 
              color: activeTab === "memo" ? "var(--accent-teal)" : "var(--text-secondary)", 
              borderBottom: activeTab === "memo" ? "2px solid var(--accent-teal)" : "none", 
              cursor: "pointer", 
              fontSize: "0.9rem",
              fontWeight: 600
            }}
            onClick={() => setActiveTab("memo")}
          >
            AI Evaluation Memo
          </button>
          <button 
            style={{ 
              padding: "10px 16px", 
              background: "none", 
              border: "none", 
              color: activeTab === "transcript" ? "var(--accent-teal)" : "var(--text-secondary)", 
              borderBottom: activeTab === "transcript" ? "2px solid var(--accent-teal)" : "none", 
              cursor: "pointer", 
              fontSize: "0.9rem",
              fontWeight: 600
            }}
            onClick={() => setActiveTab("transcript")}
          >
            Interactive Transcript
          </button>
          <button 
            style={{ 
              padding: "10px 16px", 
              background: "none", 
              border: "none", 
              color: activeTab === "integrations" ? "var(--accent-teal)" : "var(--text-secondary)", 
              borderBottom: activeTab === "integrations" ? "2px solid var(--accent-teal)" : "none", 
              cursor: "pointer", 
              fontSize: "0.9rem",
              fontWeight: 600
            }}
            onClick={() => setActiveTab("integrations")}
          >
            Workflow Timeline
          </button>
        </div>

        {/* Tab View: Memo */}
        {activeTab === "memo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Incident Summary Card */}
            <div className="glass-card" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={16} style={{ color: "var(--accent-blue)" }} />
                Incident Overview
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "0.85rem", marginBottom: "12px" }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Accident Date:</span>
                  <p style={{ color: "var(--text-primary)", fontWeight: 500, marginTop: "2px" }}>{caseItem.accident_date || "Not Provided"}</p>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Liability Assessment:</span>
                  <p style={{ color: "var(--text-primary)", fontWeight: 500, marginTop: "2px" }}>{caseItem.liability_assessment || "Under Review"}</p>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Police Report Filed:</span>
                  <p style={{ color: "var(--text-primary)", fontWeight: 500, marginTop: "2px" }}>{caseItem.police_report || "None"}</p>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Medical Treatment:</span>
                  <p style={{ color: "var(--text-primary)", fontWeight: 500, marginTop: "2px" }}>{caseItem.medical_documentation || "None"}</p>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Other Driver Insurance:</span>
                  <p style={{ color: "var(--text-primary)", fontWeight: 500, marginTop: "2px" }}>{caseItem.insurance_status || "Unknown"}</p>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Client At Fault:</span>
                  <p style={{ color: "var(--text-primary)", fontWeight: 500, marginTop: "2px" }}>{caseItem.at_fault || "Unsure"}</p>
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Incident Details:</span>
                <p style={{ color: "var(--text-primary)", marginTop: "4px", lineHeight: "1.4" }}>
                  {caseItem.incident_summary || "No description provided."}
                </p>
              </div>
            </div>

            {/* AI Evaluation Detail Memo */}
            <div className="glass-card" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "12px" }}>AI Generated Case Assessment</h3>
              <div 
                style={{ 
                  background: "rgba(0,0,0,0.15)", 
                  padding: "16px", 
                  borderRadius: "10px", 
                  fontSize: "0.85rem", 
                  color: "var(--text-secondary)", 
                  lineHeight: "1.5", 
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace" 
                }}
              >
                {caseItem.case_evaluation_memo || "No memo available for this case. Lead may be incomplete."}
              </div>
            </div>
            
          </div>
        )}

        {/* Tab View: Transcript */}
        {activeTab === "transcript" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(0,0,0,0.1)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
              <MessageSquare size={14} />
              <span>Recorded AI Phone Conversation Transcript</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "450px", overflowY: "auto", paddingRight: "6px" }}>
              {dialogue.map((line, idx) => {
                const isAI = line.speaker.includes("AI") || line.speaker.includes("Alex");
                const isInfo = line.speaker === "Info";
                
                if (isInfo) {
                  return (
                    <div key={idx} style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", margin: "8px 0" }}>
                      {line.text}
                    </div>
                  );
                }

                return (
                  <div 
                    key={idx} 
                    style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: isAI ? "flex-start" : "flex-end",
                      gap: "4px"
                    }}
                  >
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{line.speaker}</span>
                    <div 
                      style={{ 
                        background: isAI ? "rgba(255,255,255,0.04)" : "var(--status-info-bg)", 
                        border: `1px solid ${isAI ? "var(--border-color)" : "rgba(59, 130, 246, 0.2)"}`,
                        color: "var(--text-primary)", 
                        padding: "10px 14px", 
                        borderRadius: isAI ? "0px 14px 14px 14px" : "14px 0px 14px 14px", 
                        fontSize: "0.85rem",
                        maxWidth: "85%",
                        lineHeight: "1.4"
                      }}
                    >
                      {line.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab View: Workflow Timeline */}
        {activeTab === "integrations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative", paddingLeft: "24px" }}>
            
            {/* Timeline Line */}
            <div style={{
              position: "absolute",
              left: "6px",
              top: "10px",
              bottom: "10px",
              width: "2px",
              background: "rgba(255,255,255,0.05)"
            }} />

            {/* Step 1: Call Log */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-23px", top: "2px", width: "12px", height: "12px", borderRadius: "50%", background: "var(--accent-teal)", boxShadow: "0 0 10px var(--accent-teal)" }} />
              <div>
                <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>Vapi AI Phone Intake Call</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Logged from caller phone: {caseItem.customer_number || "—"}</p>
                <div style={{ background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "6px", marginTop: "8px", fontSize: "0.75rem", border: "1px solid var(--border-color)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Call Status: </span> <span style={{ color: "var(--status-success)" }}>Completed</span>
                  {caseItem.call_duration_seconds && (
                    <span style={{ marginLeft: "16px", color: "var(--text-muted)" }}>Duration: <strong style={{ color: "var(--text-primary)" }}>{caseItem.call_duration_seconds}s</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: AI Evaluation */}
            <div style={{ position: "relative" }}>
              <div style={{ 
                position: "absolute", 
                left: "-23px", 
                top: "2px", 
                width: "12px", 
                height: "12px", 
                borderRadius: "50%", 
                background: caseItem.viability_score ? "var(--accent-blue)" : "rgba(255,255,255,0.1)",
                boxShadow: caseItem.viability_score ? "0 0 10px var(--accent-blue)" : "none" 
              }} />
              <div>
                <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>Structured Case Evaluation</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Extraction of liability, damages, and recommendation</p>
                {caseItem.viability_score ? (
                  <div style={{ background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "6px", marginTop: "8px", fontSize: "0.75rem", border: "1px solid var(--border-color)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Score: </span> <strong style={{ color: "var(--accent-teal)" }}>{caseItem.viability_score}/100</strong>
                    <span style={{ marginLeft: "16px", color: "var(--text-muted)" }}>Status: <strong style={{ color: "var(--status-success)" }}>Extracted</strong></span>
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>Awaiting details...</div>
                )}
              </div>
            </div>

            {/* Step 3: Clio CRM Sync */}
            <div style={{ position: "relative" }}>
              <div style={{ 
                position: "absolute", 
                left: "-23px", 
                top: "2px", 
                width: "12px", 
                height: "12px", 
                borderRadius: "50%", 
                background: caseItem.clio_matter_id ? "var(--status-success)" : caseItem.clio_contact_id ? "var(--status-warning)" : "rgba(255,255,255,0.1)",
                boxShadow: caseItem.clio_matter_id ? "0 0 10px var(--status-success)" : "none" 
              }} />
              <div>
                <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>Clio Practice Management Sync</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Creation of contact card and litigation matter file</p>
                {caseItem.clio_contact_id || caseItem.clio_matter_id ? (
                  <div style={{ background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "6px", marginTop: "8px", fontSize: "0.75rem", border: "1px solid var(--border-color)" }}>
                    {caseItem.clio_contact_id && <div><span style={{ color: "var(--text-muted)" }}>Contact ID:</span> <span style={{ color: "var(--accent-teal)", fontFamily: "monospace" }}>{caseItem.clio_contact_id}</span></div>}
                    {caseItem.clio_matter_id && <div style={{ marginTop: "4px" }}><span style={{ color: "var(--text-muted)" }}>Matter ID:</span> <span style={{ color: "var(--accent-blue)", fontFamily: "monospace" }}>{caseItem.clio_matter_id}</span></div>}
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>Not synced to Clio CRM yet.</div>
                )}
              </div>
            </div>

            {/* Step 4: Retainer Send/Sign */}
            <div style={{ position: "relative" }}>
              <div style={{ 
                position: "absolute", 
                left: "-23px", 
                top: "2px", 
                width: "12px", 
                height: "12px", 
                borderRadius: "50%", 
                background: (caseItem.retainer_signed_at || caseItem.docuseal_status === "Completed") ? "var(--status-success)" : caseItem.retainer_sent_at ? "var(--status-warning)" : "rgba(255,255,255,0.1)",
                boxShadow: (caseItem.retainer_signed_at || caseItem.docuseal_status === "Completed") ? "0 0 10px var(--status-success)" : "none" 
              }} />
              <div>
                <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>Docuseal Legal Retainer Agreement</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>e-Signing of attorney representation contract</p>
                
                {caseItem.docuseal_status ? (
                  <div style={{ background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "6px", marginTop: "8px", fontSize: "0.75rem", border: "1px solid var(--border-color)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Status: </span>
                    <strong style={{ color: caseItem.docuseal_status === "Completed" ? "var(--status-success)" : "var(--status-warning)" }}>
                      {caseItem.docuseal_status.toUpperCase()}
                    </strong>
                    {caseItem.retainer_sent_at && <div style={{ marginTop: "4px", color: "var(--text-muted)" }}>Sent: {new Date(caseItem.retainer_sent_at).toLocaleString()}</div>}
                    {caseItem.retainer_signed_at && <div style={{ marginTop: "2px", color: "var(--text-muted)" }}>Signed: {new Date(caseItem.retainer_signed_at).toLocaleString()}</div>}
                    {caseItem.docuseal_document_url && (
                      <a href={caseItem.docuseal_document_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--accent-teal)", marginTop: "8px", textDecoration: "underline" }}>
                        View Retainer Document PDF <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>Retainer contract not generated.</div>
                )}
              </div>
            </div>

            {/* Step 5: Notifications & Webhooks */}
            <div style={{ position: "relative" }}>
              <div style={{ 
                position: "absolute", 
                left: "-23px", 
                top: "2px", 
                width: "12px", 
                height: "12px", 
                borderRadius: "50%", 
                background: caseItem.slack_status === "Sent" ? "var(--accent-violet)" : "rgba(255,255,255,0.1)",
                boxShadow: caseItem.slack_status === "Sent" ? "0 0 10px var(--accent-violet)" : "none" 
              }} />
              <div>
                <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>Team Alerts & Notifications</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Slack notification log and outbound SMS status</p>
                {caseItem.slack_status === "Sent" || caseItem.sms_status === "Sent" ? (
                  <div style={{ background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "6px", marginTop: "8px", fontSize: "0.75rem", border: "1px solid var(--border-color)" }}>
                    {caseItem.slack_status === "Sent" && (
                      <div style={{ display: "flex", gap: "6px", flexDirection: "column" }}>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Slack Broadcast Sent:</span>
                        <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>"{caseItem.slack_message}"</p>
                      </div>
                    )}
                    {caseItem.sms_status === "Sent" && (
                      <div style={{ display: "flex", gap: "6px", flexDirection: "column", marginTop: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Client SMS Sent:</span>
                        <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>"{caseItem.sms_message}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>Awaiting events...</div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Footer Actions Panel */}
      <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border-color)", background: "rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Sliders and dropdown filters */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
              Case Action
            </label>
            <select 
              className="search-input" 
              style={{ width: "100%", paddingLeft: "12px", background: "rgba(16,20,30,0.9)" }}
              value={recommendation}
              onChange={e => handleStatusChange(e.target.value)}
            >
              <option value="Accept Case - Send Retainer">Accept Case - Send Retainer</option>
              <option value="Investigate Further">Investigate Further</option>
              <option value="Decline Case">Decline Case</option>
              <option value="">Evaluating</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
              Viability Score ({score}%)
            </label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={score} 
              onChange={e => handleScoreChange(e.target.value)}
              style={{ width: "100%", height: "36px", accentColor: "var(--accent-teal)", cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Integration Trigger Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          {!caseItem.clio_matter_id ? (
            <button 
              className="btn-primary" 
              style={{ flex: 1, justifyContent: "center" }}
              disabled={isSyncingClio}
              onClick={triggerClioSync}
            >
              <CheckCircle2 size={16} />
              {isSyncingClio ? "Creating in Clio..." : "Sync to Clio CRM"}
            </button>
          ) : (
            <button 
              className="btn-secondary" 
              style={{ flex: 1, justifyContent: "center", cursor: "default" }}
              disabled
            >
              <ShieldCheck size={16} style={{ color: "var(--status-success)" }} />
              Synced to Clio
            </button>
          )}

          {caseItem.docuseal_status !== "Completed" && caseItem.docuseal_status !== "Sent" ? (
            <button 
              className="btn-primary" 
              style={{ flex: 1, justifyContent: "center", background: "var(--gradient-indigo-violet)", color: "white", boxShadow: "0 4px 15px rgba(99, 102, 241, 0.2)" }}
              disabled={isSendingRetainer}
              onClick={triggerSendRetainer}
            >
              <Send size={16} />
              {isSendingRetainer ? "Sending contract..." : "Send Retainer Agreement"}
            </button>
          ) : (
            <button 
              className="btn-secondary" 
              style={{ flex: 1, justifyContent: "center", cursor: "default" }}
              disabled
            >
              <Award size={16} style={{ color: "var(--status-success)" }} />
              {caseItem.docuseal_status === "Completed" ? "Retainer Signed" : "Retainer Sent"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default CaseDetailDrawer;
