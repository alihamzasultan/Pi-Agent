import React, { useState, useEffect } from "react";
import { supabaseService } from "./services/supabase";
import type { IntakeCase, CallLog, ClioRecord, DocusealRetainer } from "./services/supabase";
import * as mock from "./services/mockData";
import KPICard from "./components/KPICard";
import AnalyticsCharts from "./components/AnalyticsCharts";
import RetainerAgreementDashboard from "./components/RetainerAgreementDashboard";
import { IntakeCasesListView, CallLogsListView, ClioRecordsListView, DocusealRetainersListView } from "./components/ListViews";
import CaseDetailDrawer from "./components/CaseDetailDrawer";
import {
  LayoutDashboard, Users, PhoneCall, Link2, FileSignature,
  Database, ToggleLeft, ToggleRight, PhoneCall as PhoneIcon,
  RefreshCw, AlertCircle, Sparkles, Menu, X as CloseIcon,
  Sun, Moon
} from "lucide-react";

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem("hl-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "cases" | "calls" | "clio" | "docuseal">("dashboard");
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [cases, setCases] = useState<IntakeCase[]>([]);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [clio, setClio] = useState<ClioRecord[]>([]);
  const [retainers, setRetainers] = useState<DocusealRetainer[]>([]);
  const [selectedCase, setSelectedCase] = useState<IntakeCase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hl-theme", theme);
  }, [theme]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isLiveMode) {
        const [casesData, logsData, clioData, retainersData] = await Promise.all([
          supabaseService.fetchIntakeCases(),
          supabaseService.fetchCallLogs(),
          supabaseService.fetchClioRecords(),
          supabaseService.fetchDocusealRetainers()
        ]);
        setCases(casesData);
        setLogs(logsData);
        setClio(clioData);
        setRetainers(retainersData);
      } else {
        setCases(mock.MOCK_INTAKE_CASES);
        setLogs(mock.MOCK_CALL_LOGS);
        setClio(mock.MOCK_CLIO_RECORDS);
        setRetainers(mock.MOCK_DOCUSEAL_RETAINERS);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Failed to fetch database records: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [isLiveMode]);

  const handleUpdateCase = async (updatedCase: IntakeCase) => {
    const nextCases = cases.map(c => c.call_id === updatedCase.call_id ? updatedCase : c);
    setCases(nextCases);
    if (selectedCase && selectedCase.call_id === updatedCase.call_id) setSelectedCase(updatedCase);

    if (updatedCase.clio_matter_id) {
      const existingClio = clio.find(r => r.call_id === updatedCase.call_id);
      if (!existingClio) {
        const newClioRecord: ClioRecord = {
          id: "clio-" + Math.floor(Math.random() * 10000),
          call_id: updatedCase.call_id,
          client_name: updatedCase.client_name,
          phone: updatedCase.phone || updatedCase.customer_number,
          clio_contact_id: updatedCase.clio_contact_id,
          clio_contact_response: '{"status":"ok"}',
          clio_matter_id: updatedCase.clio_matter_id,
          clio_matter_status: updatedCase.clio_matter_status || "Open",
          clio_matter_description: updatedCase.incident_summary,
          practice_area: "Motor Vehicle Accident",
          clio_matter_response: '{"status":"ok"}',
          clio_note_id: "clio-note-auto",
          clio_note_subject: "AI Intake Memo Summary",
          clio_note_detail: updatedCase.case_evaluation_memo,
          clio_note_response: '{"status":"ok"}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setClio([newClioRecord, ...clio]);
      }
    }

    if (updatedCase.docuseal_status) {
      const existingRet = retainers.find(r => r.call_id === updatedCase.call_id);
      if (!existingRet) {
        const newRetainer: DocusealRetainer = {
          id: "ret-" + Math.floor(Math.random() * 10000),
          call_id: updatedCase.call_id,
          clio_matter_id: updatedCase.clio_matter_id,
          client_name: updatedCase.client_name,
          client_email: `${(updatedCase.client_name || "client").toLowerCase().replace(/\s+/g, ".")}@example.com`,
          template_id: "tmpl_pi_retainer_v2",
          submission_id: updatedCase.docuseal_submission_id,
          external_id: `${updatedCase.call_id}-ret`,
          status: updatedCase.docuseal_status.toLowerCase(),
          sent_at: updatedCase.retainer_sent_at,
          completed_at: updatedCase.retainer_signed_at,
          expire_at: null,
          document_url: updatedCase.docuseal_document_url,
          audit_log_url: "https://docuseal.com/audit/" + updatedCase.docuseal_submission_id,
          docuseal_response: '{"status":"ok"}',
          webhook_payload: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setRetainers([newRetainer, ...retainers]);
      } else {
        setRetainers(retainers.map(r =>
          r.call_id === updatedCase.call_id
            ? { ...r, status: updatedCase.docuseal_status!.toLowerCase(), completed_at: updatedCase.retainer_signed_at }
            : r
        ));
      }
    }

    if (isLiveMode && updatedCase.id !== null) {
      try {
        await supabaseService.updateIntakeCase(updatedCase.call_id, {
          recommended_action: updatedCase.recommended_action,
          viability_score: updatedCase.viability_score,
          clio_contact_id: updatedCase.clio_contact_id,
          clio_matter_id: updatedCase.clio_matter_id,
          clio_matter_status: updatedCase.clio_matter_status,
          docuseal_status: updatedCase.docuseal_status,
          docuseal_submission_id: updatedCase.docuseal_submission_id,
          docuseal_document_url: updatedCase.docuseal_document_url,
          retainer_sent_at: updatedCase.retainer_sent_at,
          retainer_signed_at: updatedCase.retainer_signed_at,
          slack_status: updatedCase.slack_status,
          slack_message: updatedCase.slack_message,
          slack_sent_at: updatedCase.slack_sent_at,
          sms_status: updatedCase.sms_status,
          sms_message: updatedCase.sms_message,
          sms_sent_at: updatedCase.sms_sent_at
        });
      } catch (err) {
        console.error("DB write error:", err);
        setError("Unable to save changes to Supabase database. Working locally.");
      }
    }
  };

  const handleSimulateCall = () => {
    setIsSimulating(true);
    setSimStep("Inbound call routing through Vapi...");
    setTimeout(() => setSimStep("AI Intake Assistant collecting case details..."), 1500);
    setTimeout(() => setSimStep("AI extracting facts & assessing liability..."), 3200);
    setTimeout(async () => {
      const names = ["Alexander Hamilton", "Victoria Justice", "Thomas Jefferson", "Gwen Stacy", "Bruce Wayne"];
      const selectedName = names[Math.floor(Math.random() * names.length)];
      const randomPhone = `+1512555${Math.floor(1000 + Math.random() * 9000)}`;
      const callId = "sim-call-" + Math.floor(Math.random() * 1000000);
      const summaries = [
        "Rear-ended by a cement truck on IH-35. Severe back and neck injuries. Police ticketed the truck driver.",
        "Slipped on spilled milk at a supermarket aisle. Severely sprained wrist and bruised shoulder. Report filed.",
        "Struck by an SUV while in a pedestrian crosswalk. Fractured tibia requiring leg cast. Driver cited.",
        "Bitten by an unleashed dog at Zilker Park. Deep lacerations on forearm requiring stitches. Owner identified."
      ];
      const selectedSummary = summaries[Math.floor(Math.random() * summaries.length)];

      const newCase: IntakeCase = {
        id: isLiveMode ? null : "sim-case-" + Math.floor(Math.random() * 10000),
        call_id: callId, call_type: "Inbound", call_status: "Completed",
        call_started_at: new Date().toISOString(),
        call_ended_at: new Date(Date.now() + 320000).toISOString(),
        call_duration_seconds: "320", ended_reason: "Completed",
        client_name: selectedName, phone: randomPhone, customer_number: randomPhone,
        transcript: `AI: Hello. This is Alex with Harrington Law. How can I help you?\nUser: Hi, my name is ${selectedName}. I was in an accident just now. ${selectedSummary}\nAI: Oh no! Are you okay? Did you see a doctor?\nUser: Yes, I am heading to the doctor now. I have some medical notes.\nAI: Great, we will assess your case and help you.`,
        recording_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        stereo_recording_url: null, log_url: null,
        accident_date: new Date().toISOString().split("T")[0],
        incident_summary: selectedSummary, police_report: "Yes - report filed.",
        medical_documentation: "Yes - scheduling treatment.",
        insurance_status: "Yes - commercial liability coverage.",
        at_fault: "No - client hit by negligent third party.",
        case_evaluation_memo: `### CASE EVALUATION MEMO\n\n**Client Name**: ${selectedName}\n**Accident Date**: Today\n**Incident Summary**: ${selectedSummary}\n**Liability**: Clear liability on third party.\n**Coverage**: Commercial insurance policy limits.\n**Recommendation**: Accept case. Send Docuseal retainer immediately.`,
        liability_assessment: "Clear Liability",
        liability_reason: "Negligent third party violation of traffic/safety regulations.",
        viability_score: String(Math.floor(75 + Math.random() * 23)),
        recommended_action: "Accept Case - Send Retainer", extraction_status: "Completed",
        clio_contact_id: null, clio_matter_id: null, clio_matter_status: null, clio_note_id: null,
        sms_message: null, sms_status: null, sms_sent_at: null,
        docuseal_submission_id: null, docuseal_status: null, docuseal_document_url: null,
        docuseal_audit_log_url: null, retainer_sent_at: null, retainer_signed_at: null,
        slack_status: "Sent",
        slack_message: `🚨 AI INTAKE ALERT: New highly viable case for ${selectedName}. Score: 85+. Details extracted.`,
        slack_sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(), raw_payload: null
      };

      const newLog: CallLog = {
        id: "log-" + Math.floor(Math.random() * 10000), call_id: callId,
        assistant_id: "asst-alex-pi", assistant_name: "Alex - PI Intake",
        phone_number_id: "phone-123", inbound_number: "+18005550100",
        customer_number: randomPhone, started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(), duration_seconds: "320", duration_minutes: "5.3",
        ended_reason: "Completed", transcript: newCase.transcript, summary: selectedSummary,
        recording_url: newCase.recording_url, stereo_recording_url: null, pcap_url: null,
        log_url: "https://vapi.ai/logs/" + callId,
        cost: "0.58", stt_cost: "0.05", llm_cost: "0.15", tts_cost: "0.24",
        vapi_cost: "0.14", total_cost: "0.58", model_name: "gpt-4o",
        voice_provider: "Cartesia", voice_id: "sheriff-male",
        transcriber_provider: "Deepgram", transcriber_model: "nova-2",
        raw_payload: null, created_at: new Date().toISOString()
      };

      if (isLiveMode) {
        try {
          const insertedCase = await supabaseService.createIntakeCase(newCase);
          setCases([insertedCase || newCase, ...cases]);
        } catch (err: any) {
          console.error("DB insert error:", err);
          setError("Failed to sync new simulated call to Supabase. Appended locally.");
          setCases([newCase, ...cases]);
        }
      } else {
        setCases([newCase, ...cases]);
      }

      setLogs([newLog, ...logs]);
      setIsSimulating(false);
      setSimStep("");
      setSelectedCase(newCase);
    }, 4500);
  };

  const stats = {
    totalLeads: cases.length,
    signedCases: cases.filter(c => c.retainer_signed_at || c.docuseal_status === "Completed").length,
    evaluating: cases.filter(c => c.extraction_status === "Completed" || c.viability_score).length,
    clioSyncs: cases.filter(c => c.clio_matter_id).length,
    activeCalls: logs.length,
    totalCost: logs.reduce((acc, curr) => acc + parseFloat(curr.total_cost || curr.cost || "0"), 0).toFixed(2)
  };

  const conversionRate = stats.totalLeads ? Math.round((stats.signedCases / stats.totalLeads) * 100) : 0;
  const clioSyncRate = stats.totalLeads ? Math.round((stats.clioSyncs / stats.totalLeads) * 100) : 0;

  const navItems = [
    { id: "dashboard", label: "Dashboard Hub", icon: <LayoutDashboard size={18} /> },
    { id: "cases",     label: "Leads Pipeline", icon: <Users size={18} /> },
    { id: "calls",     label: "AI Voice Call Logs", icon: <PhoneCall size={18} /> },
    { id: "clio",      label: "Clio CRM Records", icon: <Link2 size={18} /> },
    { id: "docuseal",  label: "Docuseal Retainers", icon: <FileSignature size={18} /> },
  ] as const;

  const handleNavClick = (id: typeof activeTab) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">

      {/* Mobile overlay (dims content behind open sidebar) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* 1. Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "var(--gradient-primary)", padding: "8px", borderRadius: "10px", color: "var(--accent-on-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Harrington Law</h1>
            <span style={{ fontSize: "0.65rem", color: "var(--accent-teal)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>PI Intake AI Suite</span>
          </div>
          {/* Close button visible on mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(false)}
            style={{ padding: "6px" }}
            aria-label="Close menu"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`btn-secondary ${activeTab === item.id ? "active" : ""}`}
              style={{
                justifyContent: "flex-start",
                background: activeTab === item.id ? "var(--nav-active-bg)" : "transparent",
                borderColor: activeTab === item.id ? "var(--accent-blue)" : "transparent"
              }}
              onClick={() => handleNavClick(item.id)}
            >
              <span style={{ color: activeTab === item.id ? "var(--accent-teal)" : "inherit", display: "flex" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <Database size={12} style={{ color: isLiveMode ? "var(--status-success)" : "var(--status-warning)" }} />
            <span>Mode: {isLiveMode ? "Supabase Live" : "Demo Sandbox"}</span>
          </div>
        </div>
      </aside>

      {/* 2. Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          {/* Left: hamburger + title */}
          <div className="header-title-wrap">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "capitalize", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {activeTab === "dashboard" ? "Analytics Hub" : activeTab === "clio" ? "Clio CRM Records" : activeTab === "docuseal" ? "Docuseal Retainers" : activeTab === "calls" ? "AI Voice Call Logs" : activeTab === "cases" ? "Leads Pipeline" : `${activeTab} Mgmt`}
            </h2>
          </div>

          {/* Right: controls */}
          <div className="header-actions">
            {/* Day / Night Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
              aria-label={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Live DB Toggle */}
            <div className="header-control-pill">
              <span className="header-demo-label" style={{ fontSize: "0.73rem", color: isLiveMode ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: 500 }}>Demo</span>
              <button onClick={() => setIsLiveMode(!isLiveMode)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center" }}>
                {isLiveMode
                  ? <ToggleRight size={24} style={{ color: "var(--status-success)" }} />
                  : <ToggleLeft size={24} style={{ color: "var(--text-muted)" }} />}
              </button>
              <span className="header-live-label" style={{ fontSize: "0.73rem", color: isLiveMode ? "var(--status-success)" : "var(--text-secondary)", fontWeight: 600 }}>Live DB</span>
            </div>

            {/* Simulate */}
            {/* <button
              className="btn-primary"
              style={{ background: "var(--gradient-indigo-violet)", color: "white", boxShadow: "0 4px 15px rgba(99,102,241,0.2)", whiteSpace: "nowrap" }}
              onClick={handleSimulateCall}
              disabled={isSimulating}
            >
              <PhoneIcon size={15} />
              <span className="header-sim-label">
                {isSimulating ? "Simulating…" : "Simulate Lead"}
              </span>
            </button> */}

            {/* Refresh */}
            <button onClick={loadData} className="btn-secondary" style={{ padding: "9px", borderRadius: "10px", flexShrink: 0 }} title="Refresh">
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} style={isLoading ? { animation: "spin 1.5s linear infinite" } : undefined} />
            </button>
          </div>
        </header>

        {/* Simulation Overlay */}
        {isSimulating && (
          <div className="simulation-overlay">
            <div className="glass-card sim-overlay-card" style={{ padding: "40px", textAlign: "center", width: "400px", boxShadow: "0 0 40px rgba(0,242,254,0.15)", border: "1px solid rgba(0,242,254,0.3)" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(0,242,254,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "pulseGlow 1.5s infinite" }}>
                <PhoneIcon size={36} style={{ color: "var(--accent-teal)", animation: "bounce 1s infinite" }} />
              </div>
              <h3 style={{ color: "var(--text-primary)", fontSize: "1.2rem", marginBottom: "8px" }}>Phone Intake Simulation</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontStyle: "italic", minHeight: "24px" }}>{simStep}</p>
              <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "20px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--gradient-primary)", animation: "loadSim 4.5s linear forwards", borderRadius: "2px" }} />
              </div>
            </div>
            <style>{`
              @keyframes loadSim { 0% { width: 0%; } 100% { width: 100%; } }
              @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        {/* Content Body */}
        <div className="content-body">
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isLoading && !isSimulating && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "100px 0" }}>
              <RefreshCw size={36} style={{ color: "var(--accent-teal)", animation: "spin 1.5s linear infinite" }} />
            </div>
          )}

          {!isLoading && (
            <>
              {activeTab === "dashboard" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* KPI Grid */}
                  <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                    <KPICard title="Total Leads Ingested" value={stats.totalLeads} icon="Users" trend={{ value: "18% this wk", positive: true }} glowColor="rgba(0,242,254,0.12)" />
                    <KPICard title="Signed Cases" value={`${stats.signedCases} (${conversionRate}%)`} icon="FileSignature" trend={{ value: "4.2% change", positive: true }} glowColor="rgba(16,185,129,0.12)" />
                    <KPICard title="Clio CRM Sync Rate" value={`${stats.clioSyncs} (${clioSyncRate}%)`} icon="Link2" trend={{ value: "100% success", positive: true }} glowColor="rgba(79,172,254,0.12)" />
                    <KPICard title="Vapi Billing Total" value={`$${stats.totalCost}`} icon="PhoneCall" trend={{ value: "Avg $0.56/call", positive: true }} glowColor="rgba(139,92,246,0.12)" />
                  </div>

                  <AnalyticsCharts cases={cases} />

                  <RetainerAgreementDashboard cases={cases} onSelectCase={setSelectedCase} />
                </div>
              )}

              {activeTab === "cases" && (
                <IntakeCasesListView cases={cases} onSelectCase={setSelectedCase} />
              )}
              {activeTab === "calls" && (
                <CallLogsListView logs={logs} />
              )}
              {activeTab === "clio" && (
                <ClioRecordsListView clioRecords={clio} />
              )}
              {activeTab === "docuseal" && (
                <DocusealRetainersListView retainers={retainers} />
              )}
            </>
          )}
        </div>
      </main>

      {/* 3. Case Detail Drawer */}
      <CaseDetailDrawer caseItem={selectedCase} onClose={() => setSelectedCase(null)} onUpdateCase={handleUpdateCase} />
    </div>
  );
};
export default App;
