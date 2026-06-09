import React, { useState, useEffect } from "react";
import { supabaseService } from "./services/supabase";
import type { IntakeCase, CallLog, ClioRecord, DocusealRetainer } from "./services/supabase";
import KPICard from "./components/KPICard";
import AnalyticsCharts from "./components/AnalyticsCharts";
import RetainerAgreementDashboard from "./components/RetainerAgreementDashboard";
import { IntakeCasesListView, CallLogsListView, ClioRecordsListView, DocusealRetainersListView } from "./components/ListViews";
import CaseDetailDrawer from "./components/CaseDetailDrawer";
import {
  LayoutDashboard, Users, Link2, FileSignature,
  Database, PhoneCall as PhoneIcon,
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
  const [cases, setCases] = useState<IntakeCase[]>([]);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [clio, setClio] = useState<ClioRecord[]>([]);
  const [retainers, setRetainers] = useState<DocusealRetainer[]>([]);
  const [selectedCase, setSelectedCase] = useState<IntakeCase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating] = useState<boolean>(false);
  const [simStep] = useState<string>("");
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
    } catch (err: any) {
      console.error(err);
      setError(`Failed to fetch database records: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateCase = async (updatedCase: IntakeCase) => {
    const nextCases = cases.map(c => c.call_id === updatedCase.call_id ? updatedCase : c);
    setCases(nextCases);
    if (selectedCase && selectedCase.call_id === updatedCase.call_id) setSelectedCase(updatedCase);

    if (updatedCase.id !== null) {
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

        await loadData();
      } catch (err) {
        console.error("DB write error:", err);
        setError("Unable to save changes to Supabase database.");
      }
    }
  };



  const normalizeStatus = (value?: string | null) =>
    String(value || "").trim().toLowerCase();

  const signedCases = cases.filter(c => {
    const status = normalizeStatus(c.docuseal_status);
    return Boolean(c.retainer_signed_at) || status === "completed" || status === "signed";
  }).length;

  const sentRetainers = cases.filter(c => {
    const status = normalizeStatus(c.docuseal_status);
    return Boolean(c.retainer_sent_at) || status === "sent" || status === "completed" || status === "signed";
  }).length;

  const clioSyncedCases = cases.filter(c => Boolean(c.clio_matter_id)).length;

  const totalCostNumber = logs.reduce((acc, curr) => {
    const rawCost = curr.total_cost || curr.cost || "0";
    const parsedCost = Number.parseFloat(String(rawCost));
    return acc + (Number.isNaN(parsedCost) ? 0 : parsedCost);
  }, 0);

  const avgCallCost = logs.length ? totalCostNumber / logs.length : 0;

  const stats = {
    totalLeads: cases.length,
    signedCases,
    sentRetainers,
    clioSyncs: clioSyncedCases,
    activeCalls: logs.length,
    totalCost: totalCostNumber.toFixed(2),
    avgCallCost: avgCallCost.toFixed(2)
  };

  const conversionRate = stats.totalLeads
    ? Math.round((stats.signedCases / stats.totalLeads) * 100)
    : 0;

  const clioSyncRate = stats.totalLeads
    ? Math.round((stats.clioSyncs / stats.totalLeads) * 100)
    : 0;

  const navItems = [
    { id: "dashboard", label: "Dashboard Hub", icon: <LayoutDashboard size={18} /> },
    { id: "cases",     label: "Leads Pipeline", icon: <Users size={18} /> },
    // { id: "calls",     label: "AI Voice Call Logs", icon: <PhoneCall size={18} /> },
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
            <Database size={12} style={{ color: "var(--status-success)" }} />
            <span>Mode: Supabase Live</span>
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
                    <KPICard
                      title="Total Leads Ingested"
                      value={stats.totalLeads}
                      icon="Users"
                      trend={{ value: "Live Supabase", positive: true }}
                      glowColor="rgba(0,242,254,0.12)"
                    />
                    <KPICard
                      title="Signed Cases"
                      value={`${stats.signedCases} (${conversionRate}%)`}
                      icon="FileSignature"
                      trend={{ value: `${stats.sentRetainers} retainers sent`, positive: true }}
                      glowColor="rgba(16,185,129,0.12)"
                    />
                    <KPICard
                      title="Clio CRM Sync Rate"
                      value={`${stats.clioSyncs} (${clioSyncRate}%)`}
                      icon="Link2"
                      trend={{ value: `${stats.clioSyncs}/${stats.totalLeads} leads synced`, positive: true }}
                      glowColor="rgba(79,172,254,0.12)"
                    />
                
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
