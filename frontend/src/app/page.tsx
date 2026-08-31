"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  X, Trash2, ExternalLink, CheckCircle, Mail, Send, Activity, 
  MessageSquare, LayoutDashboard, Search, Globe, Phone, 
  Building2, ChevronLeft, Loader2, RefreshCw, 
  Flame, History, Zap, Play, Download, Copy, Check, Star, 
  MapPin, AlertCircle, Filter, ArrowUpRight, CheckSquare, 
  FileJson, FileSpreadsheet, Eye, Terminal, Sparkles, Clock, Menu
} from "lucide-react";

interface Lead {
  lead_id: string;
  business_name: string;
  category?: string;
  city: string;
  phone?: string;
  address?: string;
  website_url?: string;
  website_status?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  lead_score?: number;
  lead_tier?: string;
  qualification_reason?: string;
  demo_url?: string;
  demo_status?: string;
  email_message?: string;
  whatsapp_message?: string;
  approval_status?: string;
  email_status?: string;
  whatsapp_status?: string;
  source_url?: string;
  raw_data?: string;
  rating?: number;
  review_count?: number;
  google_maps_url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  error_log?: string;
  [key: string]: any;
}

export default function Dashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://leadhuntai-production.up.railway.app";

  // Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Selection & Local Deletion
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [deletedLeads, setDeletedLeads] = useState<Set<string>>(new Set());

  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState<"pipeline" | "history" | "logs">("pipeline");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<"ALL" | "HOT" | "WARM" | "NO_WEBSITE" | "DEMO_READY" | "PENDING">("ALL");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("ALL");
  const [activeCampaign, setActiveCampaign] = useState<{ city: string; category: string } | null>(null);

  // Engine Run State
  const [city, setCity] = useState("Lucknow");
  const [category, setCategory] = useState("Coaching Institutes");
  const [targetCount, setTargetCount] = useState(50);
  const [startingEngine, setStartingEngine] = useState(false);
  const [engineLogs, setEngineLogs] = useState("");
  const [engineProgress, setEngineProgress] = useState(0);
  const [enginePhase, setEnginePhase] = useState("Initializing");

  // Modal State
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [modalTab, setModalTab] = useState<"overview" | "score" | "pitch" | "payload">("overview");

  // Load deleted IDs from localStorage safely
  useEffect(() => {
    try {
      const saved = localStorage.getItem("deletedLeads");
      if (saved) {
        setDeletedLeads(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error("Failed to parse deletedLeads from localStorage:", e);
      setDeletedLeads(new Set());
      localStorage.removeItem("deletedLeads");
    }
  }, []);

  // Initial Fetch
  useEffect(() => {
    fetchLeads();
  }, []);

  // Poll Engine Logs during Hunt
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startingEngine) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/engine/logs`);
          if (res.ok) {
            const text = await res.text();
            setEngineLogs(text);

            if (text.includes("Phase 6")) {
              setEnginePhase("Generating Demo Websites");
              setEngineProgress(95);
            } else if (text.includes("Phase 5")) {
              setEnginePhase("Generating AI Outreach (Groq)");
              setEngineProgress(80);
            } else if (text.includes("Phase 4")) {
              setEnginePhase("Scoring Lead Opportunities");
              setEngineProgress(65);
            } else if (text.includes("Phase 3")) {
              setEnginePhase("Auditing Websites & Socials");
              setEngineProgress(45);
            } else if (text.includes("Phase 2")) {
              setEnginePhase("Deduplicating & Cleaning");
              setEngineProgress(30);
            } else if (text.includes("Phase 1")) {
              setEnginePhase("Scraping Google Maps via SerpAPI");
              setEngineProgress(15);
            }

            if (text.includes("PIPELINE FINISHED SUCCESSFULLY") || text.includes("ENGINE FINISHED WITH CODE")) {
              setStartingEngine(false);
              setEngineProgress(100);
              setEnginePhase("Hunt Completed!");
              
              setSelectedCityFilter(city);
              setActiveCampaign({ city, category });
              fetchLeads();
              setActiveTab("pipeline");
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [startingEngine, city, category, API_URL]);

  async function fetchLeads() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/leads`);
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const json = await res.json();
      setLeads(json.data || []);
    } catch (err: any) {
      console.error("Fetch leads error:", err);
      setError(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  }

  async function startEngine() {
    if (!city.trim() || !category.trim()) {
      alert("Please specify both a Target City and Business Niche.");
      return;
    }
    setStartingEngine(true);
    setEngineLogs("");
    setEngineProgress(5);
    setEnginePhase("Waking up AI Engine");

    try {
      const res = await fetch(`${API_URL}/api/engine/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          city: city.trim(), 
          business_type: category.trim(),
          max_results: targetCount
        }),
      });
      const data = await res.json();
      if (!data.success && data.message?.includes("already running")) {
        alert("An AI Hunt is already running in the background. Monitoring live logs...");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reach API server. Please check your backend status.");
      setStartingEngine(false);
    }
  }

  async function approveLead(leadId: string) {
    setApproving(leadId);
    try {
      const res = await fetch(`${API_URL}/api/leads/${leadId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n8n_webhook_url: "" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert(json.message || "Lead approved and dispatched successfully!");
        fetchLeads();
      } else {
        alert(json.detail || "Server error when approving lead.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error connecting to approval endpoint.");
    } finally {
      setApproving(null);
    }
  }

  const handleDeleteSelected = () => {
    if (selectedLeads.size === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedLeads.size} selected lead(s) from your view?`)) return;
    const newDeleted = new Set(deletedLeads);
    selectedLeads.forEach(id => newDeleted.add(id));
    setDeletedLeads(newDeleted);
    try {
      localStorage.setItem("deletedLeads", JSON.stringify(Array.from(newDeleted)));
    } catch (e) {
      console.error(e);
    }
    setSelectedLeads(new Set());
  };

  const handleCopyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const exportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ["Business Name", "City", "Category", "Phone", "Website", "Website Status", "Score", "Tier", "Rating", "Reviews", "Demo URL", "Email Pitch", "WhatsApp Pitch"];
    const rows = filteredLeads.map(l => [
      `"${(l.business_name || "").replace(/"/g, '""')}"`,
      `"${(l.city || "").replace(/"/g, '""')}"`,
      `"${(l.category || "").replace(/"/g, '""')}"`,
      `"${(l.phone || "").replace(/"/g, '""')}"`,
      `"${(l.website_url || "").replace(/"/g, '""')}"`,
      `"${(l.website_status || "").replace(/"/g, '""')}"`,
      l.lead_score || 0,
      `"${l.lead_tier || ""}"`,
      l.rating || 0,
      l.review_count || 0,
      `"${(l.demo_url || "").replace(/"/g, '""')}"`,
      `"${(l.email_message || "").replace(/"/g, '""')}"`,
      `"${(l.whatsapp_message || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LeadHunter_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (filteredLeads.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLeads, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LeadHunter_Export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter visible leads (excluding user-deleted ones)
  const visibleLeads = useMemo(() => {
    return leads.filter(l => !deletedLeads.has(String(l.lead_id)));
  }, [leads, deletedLeads]);

  // Unique Cities in Database with Counts
  const citiesList = useMemo(() => {
    const map: Record<string, number> = {};
    visibleLeads.forEach(l => {
      const c = (l.city || "Unknown").trim();
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [visibleLeads]);

  // Derived filtered leads based on tabs, search, city filter, and active campaign
  const filteredLeads = useMemo(() => {
    return visibleLeads.filter(lead => {
      // 1. City Filter Badge
      if (selectedCityFilter !== "ALL") {
        if ((lead.city || "").toLowerCase() !== selectedCityFilter.toLowerCase()) {
          return false;
        }
      }

      // 2. Active Campaign Filter
      if (activeCampaign) {
        if ((lead.city || "").toLowerCase() !== activeCampaign.city.toLowerCase()) {
          return false;
        }
        if (activeCampaign.category && !(lead.category || "").toLowerCase().includes(activeCampaign.category.toLowerCase())) {
          return false;
        }
      }

      // 3. Tier / Status Pill Filter
      if (selectedTierFilter === "HOT" && lead.lead_tier !== "HOT") return false;
      if (selectedTierFilter === "WARM" && lead.lead_tier !== "WARM") return false;
      if (selectedTierFilter === "NO_WEBSITE" && !["NO_WEBSITE", "BROKEN_WEBSITE", "SOCIAL_ONLY"].includes(lead.website_status || "")) return false;
      if (selectedTierFilter === "DEMO_READY" && !lead.demo_url) return false;
      if (selectedTierFilter === "PENDING" && !(lead.email_message && lead.lead_tier === "HOT")) return false;

      // 4. Global Search Query Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (lead.business_name && String(lead.business_name).toLowerCase().includes(q)) ||
        (lead.category && String(lead.category).toLowerCase().includes(q)) ||
        (lead.city && String(lead.city).toLowerCase().includes(q)) ||
        (lead.phone && String(lead.phone).toLowerCase().includes(q)) ||
        (lead.website_url && String(lead.website_url).toLowerCase().includes(q)) ||
        (lead.qualification_reason && String(lead.qualification_reason).toLowerCase().includes(q))
      );
    });
  }, [visibleLeads, selectedCityFilter, activeCampaign, selectedTierFilter, searchQuery]);

  // Aggregate Metrics for currently viewed segment or all leads
  const metrics = useMemo(() => {
    const base = selectedCityFilter === "ALL" ? visibleLeads : visibleLeads.filter(l => (l.city || "").toLowerCase() === selectedCityFilter.toLowerCase());
    return {
      total: base.length,
      hot: base.filter(l => l.lead_tier === "HOT").length,
      warm: base.filter(l => l.lead_tier === "WARM").length,
      no_website: base.filter(l => ["NO_WEBSITE", "BROKEN_WEBSITE", "SOCIAL_ONLY"].includes(l.website_status || "")).length,
      demo_ready: base.filter(l => Boolean(l.demo_url)).length,
      pending: base.filter(l => Boolean(l.email_message) && l.lead_tier === "HOT").length,
    };
  }, [visibleLeads, selectedCityFilter]);

  // Unique Campaign Groups for History Tab
  const campaignsList = useMemo(() => {
    const map: Record<string, { city: string; category: string; count: number; hot: number; warm: number }> = {};
    visibleLeads.forEach(l => {
      const cityVal = (l.city || "Unknown").trim();
      const catVal = (l.category || "General").trim();
      const key = `${cityVal}|${catVal}`.toLowerCase();
      if (!map[key]) {
        map[key] = { city: cityVal, category: catVal, count: 0, hot: 0, warm: 0 };
      }
      map[key].count += 1;
      if (l.lead_tier === "HOT") map[key].hot += 1;
      if (l.lead_tier === "WARM") map[key].warm += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [visibleLeads]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-[#1E293B] antialiased overflow-hidden">
      
      {/* MOBILE BACKDROP DRAWER */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* PROFESSIONAL SIDEBAR (DESKTOP & MOBILE DRAWER) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-[#193F2E] flex flex-col text-white shadow-2xl transition-all duration-300 select-none border-r border-[#193F2E]/20
        ${mobileMenuOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-[76px]' : 'lg:w-[250px]'}
      `}>
        {/* Brand Header */}
        <div className={`h-[72px] sm:h-[80px] flex items-center justify-between px-6 border-b border-white/10 ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#489473] to-[#71C99B] rounded-xl flex items-center justify-center shadow-lg shadow-[#489473]/30 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white leading-tight">LeadHunter</span>
                <span className="text-[11px] font-medium text-[#71C99B] uppercase tracking-wider">AI Autonomous B2B</span>
              </div>
            )}
          </div>
          {mobileMenuOpen && (
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1.5 p-4">
          <button 
            onClick={() => { setActiveTab('pipeline'); setMobileMenuOpen(false); }} 
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'pipeline' 
                ? 'bg-[#489473] text-white shadow-md shadow-[#489473]/20' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            } ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Dashboard & Leads</span>}
          </button>
          
          <button 
            onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }} 
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'history' 
                ? 'bg-[#489473] text-white shadow-md shadow-[#489473]/20' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            } ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <History className="w-5 h-5 shrink-0" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Campaign History</span>}
          </button>

          <button 
            onClick={() => { setActiveTab('logs'); setMobileMenuOpen(false); }} 
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'logs' 
                ? 'bg-[#489473] text-white shadow-md shadow-[#489473]/20' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            } ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <Terminal className="w-5 h-5 shrink-0" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Live Engine Logs</span>}
          </button>
        </nav>
        
        {/* Collapse Toggle (Desktop only) */}
        <div className="p-4 border-t border-white/10 hidden lg:block">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white text-xs font-medium w-full transition-colors justify-center"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            {!sidebarCollapsed && <span>Collapse Menu</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[250px]'}`}>

        {/* FULL-SCREEN LIVE AI HUNT PROGRESS OVERLAY */}
        {startingEngine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="flex flex-col items-center text-center w-full max-w-xl bg-white p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-100 relative overflow-hidden">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#489473]/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 relative">
                <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#489473] animate-spin" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-black text-[#1E293B] mb-2 tracking-tight">AI Autonomous Pipeline Active</h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Hunting <span className="font-bold text-[#489473]">{targetCount} {category}</span> leads in <span className="font-bold text-[#489473]">{city}</span>.
              </p>

              {/* Progress Stage Tracker */}
              <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-[#489473] to-[#36a877] h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
                  style={{ width: `${Math.max(engineProgress, 10)}%` }}
                />
              </div>
              
              <div className="flex justify-between w-full text-xs font-bold text-slate-500 mb-4 sm:mb-6">
                <span className="text-[#489473] flex items-center gap-1.5 truncate">
                  <Activity className="w-3.5 h-3.5 animate-pulse shrink-0" /> {enginePhase}
                </span>
                <span>{engineProgress}%</span>
              </div>
              
              {/* Terminal Logs Window */}
              <div className="text-[10px] sm:text-[11px] font-mono text-left w-full h-36 sm:h-44 overflow-y-auto bg-slate-950 text-emerald-400 p-3 sm:p-4 rounded-xl border border-slate-800 leading-relaxed shadow-inner">
                {engineLogs ? (
                  engineLogs.split('\n').filter(l => l.trim()).slice(-15).map((line, i) => (
                    <div key={i} className="truncate">{line}</div>
                  ))
                ) : (
                  <span className="animate-pulse text-slate-500">Initializing orchestrator subprocess...</span>
                )}
              </div>

              <button 
                onClick={() => setStartingEngine(false)}
                className="mt-5 text-xs text-slate-400 hover:text-slate-600 font-semibold underline"
              >
                Hide progress and let run in background
              </button>
            </div>
          </div>
        )}

        {/* TOP SEARCH & ACTION BAR */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sm:py-0 sm:h-[80px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 z-20">
          
          {/* Mobile Top Bar Header (Logo + Hamburger) */}
          <div className="flex items-center justify-between sm:hidden w-full">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="w-9 h-9 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center border border-slate-200"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-base font-extrabold text-[#193F2E]">LeadHunter AI</span>
            </div>

            <button 
              onClick={fetchLeads}
              disabled={loading}
              className="w-9 h-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#489473]' : ''}`} />
            </button>
          </div>

          {/* SEARCH & CAMPAIGN INPUTS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#F1F5F9] rounded-2xl p-1.5 flex-1 max-w-2xl border border-slate-200 shadow-inner gap-1 sm:gap-0">
            <div className="flex items-center gap-2 flex-1 px-3 py-1 sm:py-0 sm:border-r border-slate-300/80">
              <MapPin className="w-4 h-4 text-[#489473] shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">City</span>
              <input 
                type="text" 
                value={city} 
                onChange={e => setCity(e.target.value)}
                className="bg-transparent border-none text-[#1E293B] focus:outline-none w-full text-xs sm:text-sm font-bold placeholder-slate-400"
                placeholder="e.g. Lucknow"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-1 px-3 py-1 sm:py-0 sm:border-r border-slate-300/80">
              <Building2 className="w-4 h-4 text-[#489473] shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Niche</span>
              <input 
                type="text" 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="bg-transparent border-none text-[#1E293B] focus:outline-none w-full text-xs sm:text-sm font-bold placeholder-slate-400"
                placeholder="e.g. Coaching Institutes"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-1.5 px-3 py-1 sm:py-0">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Goal</span>
              <select 
                value={targetCount}
                onChange={e => setTargetCount(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-[#1E293B] focus:outline-none cursor-pointer"
              >
                <option value={20}>20 Leads</option>
                <option value={50}>50 Leads</option>
                <option value={100}>100 Leads</option>
              </select>
            </div>
          </div>

          {/* START AI HUNT & DESKTOP REFRESH */}
          <div className="flex items-center gap-3">
            <button 
              onClick={startEngine}
              disabled={startingEngine}
              className="w-full sm:w-auto bg-gradient-to-r from-[#489473] to-[#36a877] hover:from-[#3C7F62] hover:to-[#2d8f65] text-white px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-[#489473]/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {startingEngine ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" fill="currentColor" />}
              <span>Start AI Hunt</span>
            </button>

            <button 
              onClick={fetchLeads}
              disabled={loading}
              title="Refresh leads list"
              className="hidden sm:flex w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl items-center justify-center transition-colors border border-slate-200 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#489473]' : ''}`} />
            </button>
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD VIEW */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          {/* TAB 1: PIPELINE & LEADS */}
          {activeTab === 'pipeline' && (
            <>
              {/* LOCATION CLUSTER SELECTOR PILLS */}
              <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
                  <MapPin className="w-3.5 h-3.5 text-[#489473]" /> Filter Location:
                </span>
                
                <button
                  onClick={() => { setSelectedCityFilter("ALL"); setActiveCampaign(null); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedCityFilter === "ALL"
                      ? "bg-[#193F2E] text-white shadow-md shadow-[#193F2E]/20"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  All Locations ({visibleLeads.length})
                </button>

                {citiesList.map(c => (
                  <button
                    key={c.name}
                    onClick={() => { setSelectedCityFilter(c.name); setActiveCampaign(null); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      selectedCityFilter.toLowerCase() === c.name.toLowerCase()
                        ? "bg-[#489473] text-white shadow-md shadow-[#489473]/30"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      selectedCityFilter.toLowerCase() === c.name.toLowerCase()
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* HIGH-CONTRAST RESPONSIVE METRIC CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
                
                {/* Total Discovered */}
                <div 
                  onClick={() => setSelectedTierFilter("ALL")}
                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all ${
                    selectedTierFilter === "ALL" 
                      ? "bg-white text-slate-900 border-2 border-[#193F2E] shadow-lg shadow-[#193F2E]/10 ring-2 ring-[#193F2E]/20" 
                      : "bg-white text-slate-800 border-slate-200/80 hover:border-[#193F2E]/40 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-600">All Leads</span>
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{metrics.total}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 truncate">
                    {selectedCityFilter === "ALL" ? "All cities" : selectedCityFilter}
                  </div>
                </div>

                {/* Hot Prospects */}
                <div 
                  onClick={() => setSelectedTierFilter("HOT")}
                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all ${
                    selectedTierFilter === "HOT" 
                      ? "bg-white text-slate-900 border-2 border-rose-500 shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/20" 
                      : "bg-white text-slate-800 border-slate-200/80 hover:border-rose-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-rose-600">Hot Leads</span>
                    <Flame className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-600">{metrics.hot}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1">Score &ge; 70 pts</div>
                </div>

                {/* Warm Prospects */}
                <div 
                  onClick={() => setSelectedTierFilter("WARM")}
                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all ${
                    selectedTierFilter === "WARM" 
                      ? "bg-white text-slate-900 border-2 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20" 
                      : "bg-white text-slate-800 border-slate-200/80 hover:border-amber-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-600">Warm Leads</span>
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-600">{metrics.warm}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1">Score 45-69 pts</div>
                </div>

                {/* No Website Opps */}
                <div 
                  onClick={() => setSelectedTierFilter("NO_WEBSITE")}
                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all ${
                    selectedTierFilter === "NO_WEBSITE" 
                      ? "bg-white text-slate-900 border-2 border-indigo-600 shadow-lg shadow-indigo-600/10 ring-2 ring-indigo-600/20" 
                      : "bg-white text-slate-800 border-slate-200/80 hover:border-indigo-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-indigo-600">No Website</span>
                    <Globe className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-600">{metrics.no_website}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1">Prime redesign targets</div>
                </div>

                {/* Demo Ready */}
                <div 
                  onClick={() => setSelectedTierFilter("DEMO_READY")}
                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all ${
                    selectedTierFilter === "DEMO_READY" 
                      ? "bg-white text-slate-900 border-2 border-emerald-600 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-600/20" 
                      : "bg-white text-slate-800 border-slate-200/80 hover:border-emerald-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-600">Demos Ready</span>
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">{metrics.demo_ready}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1">Pitch URL generated</div>
                </div>

                {/* Pending Approval (100% CLEAR HIGH CONTRAST) */}
                <div 
                  onClick={() => setSelectedTierFilter("PENDING")}
                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all ${
                    selectedTierFilter === "PENDING" 
                      ? "bg-white text-slate-900 border-2 border-blue-600 shadow-lg shadow-blue-600/10 ring-2 ring-blue-600/20" 
                      : "bg-white text-slate-800 border-slate-200/80 hover:border-blue-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-blue-600">Ready To Send</span>
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-600">{metrics.pending}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1">1-click n8n dispatch</div>
                </div>

              </div>

              {/* TABLE CONTAINER & FILTER CONTROLS */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
                
                {/* TOOLBAR */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
                  
                  {/* Left: Search query within results & active campaign indicator */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 flex-wrap">
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by name, phone, category, address..."
                        className="w-full pl-10 pr-4 py-2 bg-white rounded-xl text-xs font-medium text-[#1E293B] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#489473]/20 focus:border-[#489473]"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Active Campaign Filter Badge */}
                    {activeCampaign && (
                      <div className="flex items-center gap-1.5 bg-[#489473]/10 text-[#489473] px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#489473]/20">
                        <span>{activeCampaign.city} ({activeCampaign.category})</span>
                        <button onClick={() => setActiveCampaign(null)} className="hover:text-rose-600 ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {selectedCityFilter !== "ALL" && (
                      <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200">
                        <span>City: {selectedCityFilter}</span>
                        <button onClick={() => setSelectedCityFilter("ALL")} className="hover:text-rose-600 ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Results Count, Batch Delete, Export Buttons */}
                  <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                    <span className="text-xs font-bold text-slate-500 mr-1">
                      Showing {filteredLeads.length} of {visibleLeads.length} leads
                    </span>

                    {selectedLeads.size > 0 && (
                      <button 
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedLeads.size})
                      </button>
                    )}

                    <button 
                      onClick={exportCSV}
                      disabled={filteredLeads.length === 0}
                      className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> CSV
                    </button>

                    <button 
                      onClick={exportJSON}
                      disabled={filteredLeads.length === 0}
                      className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm disabled:opacity-50"
                    >
                      <FileJson className="w-3.5 h-3.5 text-blue-600" /> JSON
                    </button>
                  </div>
                </div>

                {/* DESKTOP TABLE VIEW (HIDDEN ON MOBILE) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/60 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3.5 w-10">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-[#489473] focus:ring-[#489473] cursor-pointer"
                            checked={filteredLeads.length > 0 && selectedLeads.size === filteredLeads.length}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedLeads(new Set(filteredLeads.map(l => String(l.lead_id))));
                              } else {
                                setSelectedLeads(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-5 py-3.5">Business & Location</th>
                        <th className="px-5 py-3.5">Online Presence</th>
                        <th className="px-5 py-3.5">Lead Score & Tier</th>
                        <th className="px-5 py-3.5">AI Outreach & Demo</th>
                        <th className="px-5 py-3.5 text-right">Dispatch Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#489473]" />
                            <p className="font-semibold text-sm">Loading discovered leads...</p>
                          </td>
                        </tr>
                      ) : filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                              <Search className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-[#1E293B] mb-1">No Leads Found</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                              {selectedCityFilter !== "ALL"
                                ? `No leads found for "${selectedCityFilter}". Click 'Start AI Hunt' above to scrape leads in ${selectedCityFilter}!`
                                : searchQuery 
                                ? `No leads matched "${searchQuery}".` 
                                : "Start your first AI Hunt by clicking 'Start AI Hunt' above!"}
                            </p>
                            <div className="flex justify-center gap-2">
                              {selectedCityFilter !== "ALL" && (
                                <button 
                                  onClick={() => setSelectedCityFilter("ALL")} 
                                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                                >
                                  View All Locations ({visibleLeads.length})
                                </button>
                              )}
                              {searchQuery && (
                                <button 
                                  onClick={() => setSearchQuery("")} 
                                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                                >
                                  Clear Search Query
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((lead, idx) => (
                          <tr 
                            key={String(lead.lead_id || idx)} 
                            className={`hover:bg-slate-50/90 transition-colors group ${
                              selectedLeads.has(String(lead.lead_id)) ? "bg-emerald-50/40" : ""
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="px-5 py-4 align-middle">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-slate-300 text-[#489473] focus:ring-[#489473] cursor-pointer"
                                checked={selectedLeads.has(String(lead.lead_id))}
                                onChange={e => {
                                  const next = new Set(selectedLeads);
                                  if (e.target.checked) next.add(String(lead.lead_id));
                                  else next.delete(String(lead.lead_id));
                                  setSelectedLeads(next);
                                }}
                              />
                            </td>

                            {/* Business Info */}
                            <td className="px-5 py-4 align-middle max-w-xs">
                              <div 
                                onClick={() => { setViewLead(lead); setModalTab("overview"); }}
                                className="font-extrabold text-[#1E293B] hover:text-[#489473] cursor-pointer transition-colors flex items-center gap-1.5 group-hover:underline"
                              >
                                <span>{lead.business_name}</span>
                                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#489473]" />
                              </div>
                              
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 font-medium">
                                <span>{lead.category || "Business"}</span>
                                <span>•</span>
                                <span className="font-bold text-slate-700">{lead.city}</span>
                              </div>

                              {lead.rating && lead.rating > 0 ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-bold mt-1">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>{lead.rating}</span>
                                  <span className="text-slate-400 font-normal">({lead.review_count || 0} reviews)</span>
                                </div>
                              ) : null}
                            </td>

                            {/* Online Presence */}
                            <td className="px-5 py-4 align-middle whitespace-nowrap">
                              {lead.website_status === "NO_WEBSITE" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                  <AlertCircle className="w-3 h-3" /> No Website
                                </span>
                              ) : lead.website_status === "BROKEN_WEBSITE" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                  <AlertCircle className="w-3 h-3" /> Broken Website
                                </span>
                              ) : lead.website_status === "SOCIAL_ONLY" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-600 border border-purple-200">
                                  <Globe className="w-3 h-3" /> Socials Only
                                </span>
                              ) : lead.website_url ? (
                                <a 
                                  href={String(lead.website_url)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                                >
                                  <span>Visit Website</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">None</span>
                              )}

                              {lead.phone && (
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{lead.phone}</span>
                                </div>
                              )}
                            </td>

                            {/* Lead Score & Tier */}
                            <td className="px-5 py-4 align-middle">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${
                                  lead.lead_tier === 'HOT' 
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                    : lead.lead_tier === 'WARM' 
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {lead.lead_score || 0} PTS
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  {lead.lead_tier || "LOW"}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px] mt-1" title={lead.qualification_reason}>
                                {lead.qualification_reason || "Standard discovery"}
                              </div>
                            </td>

                            {/* Outreach & Demo Status */}
                            <td className="px-5 py-4 align-middle whitespace-nowrap">
                              {lead.demo_url ? (
                                <a
                                  href={String(lead.demo_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition-colors"
                                >
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>Live Demo ↗</span>
                                </a>
                              ) : lead.email_message ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                                  <Mail className="w-3 h-3" /> Pitch Ready
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Unprocessed</span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="px-5 py-4 align-middle text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setViewLead(lead); setModalTab("pitch"); }}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                                >
                                  View Pitch
                                </button>
                                
                                <button
                                  onClick={() => approveLead(String(lead.lead_id))}
                                  disabled={approving === lead.lead_id || !lead.email_message}
                                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                                    !lead.email_message
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                      : approving === lead.lead_id
                                      ? "bg-[#489473]/80 text-white cursor-wait"
                                      : "bg-[#489473] hover:bg-[#3C7F62] text-white shadow-[#489473]/30"
                                  }`}
                                >
                                  {approving === lead.lead_id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3 h-3" />
                                  )}
                                  <span>{approving === lead.lead_id ? "SENDING..." : "APPROVE"}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARD LIST VIEW (SPECIALLY OPTIMIZED FOR PHONES) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {loading ? (
                    <div className="p-12 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#489473]" />
                      <p className="font-semibold text-xs">Loading discovered leads...</p>
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="p-8 text-center">
                      <h4 className="font-bold text-sm text-[#1E293B] mb-1">No Leads Found</h4>
                      <p className="text-xs text-slate-500 mb-3">Try clearing search or starting a hunt.</p>
                      {selectedCityFilter !== "ALL" && (
                        <button 
                          onClick={() => setSelectedCityFilter("ALL")} 
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          View All Locations
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredLeads.map((lead, idx) => (
                      <div key={String(lead.lead_id || idx)} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 
                              onClick={() => { setViewLead(lead); setModalTab("overview"); }}
                              className="font-extrabold text-sm text-[#1E293B] active:text-[#489473]"
                            >
                              {lead.business_name}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {lead.category || "Business"} • <strong className="text-slate-700">{lead.city}</strong>
                            </p>
                          </div>
                          
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black ${
                            lead.lead_tier === 'HOT' 
                              ? 'bg-rose-100 text-rose-700' 
                              : lead.lead_tier === 'WARM' 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {lead.lead_score || 0} PTS
                          </span>
                        </div>

                        {/* Status Tags */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {lead.website_status === "NO_WEBSITE" ? (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
                              No Website
                            </span>
                          ) : lead.website_status === "BROKEN_WEBSITE" ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold">
                              Broken Site
                            </span>
                          ) : lead.website_url ? (
                            <a href={lead.website_url} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold text-[11px] flex items-center gap-0.5">
                              Website <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : null}

                          {lead.phone && (
                            <span className="text-slate-500 text-[11px] font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {lead.phone}
                            </span>
                          )}

                          {lead.demo_url && (
                            <a href={lead.demo_url} target="_blank" rel="noreferrer" className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200">
                              Demo ↗
                            </a>
                          )}
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => { setViewLead(lead); setModalTab("pitch"); }}
                            className="flex-1 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold text-center"
                          >
                            View Pitch
                          </button>

                          {lead.phone && lead.whatsapp_message && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(lead.whatsapp_message)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                          )}

                          <button
                            onClick={() => approveLead(String(lead.lead_id))}
                            disabled={approving === lead.lead_id || !lead.email_message}
                            className="px-4 py-1.5 bg-[#489473] text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
                          >
                            {approving === lead.lead_id ? "..." : "Approve"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </>
          )}

          {/* TAB 2: CAMPAIGN HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-5 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#1E293B]">Campaign History</h3>
                  <p className="text-xs text-slate-500 mt-1">All unique location and business target clusters discovered.</p>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                  {campaignsList.length} Campaigns
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/60 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 sm:px-5 py-3.5">Location</th>
                      <th className="px-4 sm:px-5 py-3.5">Business Niche</th>
                      <th className="px-4 sm:px-5 py-3.5 text-center">Total Leads</th>
                      <th className="px-4 sm:px-5 py-3.5 text-center">Hot Prospects</th>
                      <th className="px-4 sm:px-5 py-3.5 text-center">Warm Prospects</th>
                      <th className="px-4 sm:px-5 py-3.5 text-right">Filter Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {campaignsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No campaigns recorded yet. Start a hunt to see records.
                        </td>
                      </tr>
                    ) : (
                      campaignsList.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 sm:px-5 py-4 font-bold text-[#1E293B] flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#489473] shrink-0" />
                            <span>{c.city}</span>
                          </td>
                          <td className="px-4 sm:px-5 py-4 text-slate-600 font-semibold">{c.category}</td>
                          <td className="px-4 sm:px-5 py-4 text-center">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold text-xs">
                              {c.count}
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-4 text-center">
                            <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md font-bold text-xs">
                              {c.hot} HOT
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-4 text-center">
                            <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md font-bold text-xs">
                              {c.warm} WARM
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedCityFilter(c.city);
                                setActiveCampaign({ city: c.city, category: c.category });
                                setActiveTab("pipeline");
                              }}
                              className="px-3 sm:px-4 py-1.5 bg-[#489473]/10 hover:bg-[#489473] hover:text-white text-[#489473] rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                            >
                              View Leads
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE ENGINE LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-5 sm:p-8 flex flex-col h-[calc(100vh-140px)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#1E293B]">Live Engine Console</h3>
                  <p className="text-xs text-slate-500 mt-1">Real-time output stream from the Python orchestrator pipeline.</p>
                </div>
                <button
                  onClick={async () => {
                    const res = await fetch(`${API_URL}/api/engine/logs`);
                    if (res.ok) setEngineLogs(await res.text());
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
                </button>
              </div>

              <div className="flex-1 bg-slate-950 text-emerald-400 p-4 sm:p-6 rounded-2xl font-mono text-xs overflow-y-auto leading-relaxed shadow-inner border border-slate-800">
                {engineLogs ? (
                  engineLogs.split('\n').map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap">{line}</div>
                  ))
                ) : (
                  <span className="text-slate-500">No logs generated yet. Click 'Start AI Hunt' to execute the pipeline.</span>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* LEAD DETAILS & OUTREACH MODAL */}
      {viewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-[#489473] to-[#71C99B] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#489473]/30 shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#1E293B]">{viewLead.business_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {viewLead.category} • {viewLead.city} • Tier: <strong className={viewLead.lead_tier === "HOT" ? "text-rose-600" : "text-amber-600"}>{viewLead.lead_tier} ({viewLead.lead_score} pts)</strong>
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setViewLead(null)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-4 sm:px-6 gap-4 sm:gap-6 bg-white shrink-0 overflow-x-auto scrollbar-none">
              <button 
                onClick={() => setModalTab("overview")}
                className={`py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${modalTab === "overview" ? "border-[#489473] text-[#489473]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Business Profile
              </button>
              <button 
                onClick={() => setModalTab("score")}
                className={`py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${modalTab === "score" ? "border-[#489473] text-[#489473]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Score Breakdown
              </button>
              <button 
                onClick={() => setModalTab("pitch")}
                className={`py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${modalTab === "pitch" ? "border-[#489473] text-[#489473]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                AI Outreach & Demo
              </button>
              <button 
                onClick={() => setModalTab("payload")}
                className={`py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${modalTab === "payload" ? "border-[#489473] text-[#489473]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Raw API Payload
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {modalTab === "overview" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                    <p className="text-sm font-bold text-[#1E293B] mt-1 font-mono">{viewLead.phone || "Not available"}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Website URL</span>
                    <p className="text-sm font-bold text-blue-600 mt-1 truncate">
                      {viewLead.website_url ? (
                        <a href={viewLead.website_url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                          <span>{viewLead.website_url}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400 font-normal">None (Target Opportunity)</span>
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Address</span>
                    <p className="text-sm font-semibold text-[#1E293B] mt-1">{viewLead.address || "Address not provided"}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Google Rating</span>
                    <p className="text-sm font-bold text-amber-600 mt-1 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{viewLead.rating || 0} / 5.0 ({viewLead.review_count || 0} total reviews)</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Discovered Timestamp</span>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      {viewLead.created_at 
                        ? new Date(viewLead.created_at + (viewLead.created_at.endsWith("Z") ? "" : "Z")).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) 
                        : "N/A"} (IST)
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: SCORE BREAKDOWN */}
              {modalTab === "score" && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#193F2E] to-[#2B6A4E] text-white p-5 sm:p-6 rounded-3xl shadow-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#71C99B] uppercase tracking-wider">Total Qualification Score</span>
                      <h2 className="text-3xl sm:text-4xl font-black mt-1">{viewLead.lead_score || 0} <span className="text-xl font-normal text-white/70">/ 100 PTS</span></h2>
                      <span className="inline-block mt-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold">
                        Tier Status: {viewLead.lead_tier || "LOW"}
                      </span>
                    </div>
                    <div className="text-right">
                      <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-[#71C99B] opacity-80" />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Scoring Factors & Logic</h4>
                    <p className="text-xs sm:text-sm font-semibold text-[#1E293B] leading-relaxed">
                      {viewLead.qualification_reason || "Standard scoring criteria applied."}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: AI OUTREACH & DEMO */}
              {modalTab === "pitch" && (
                <div className="space-y-4 sm:space-y-5">
                  {/* Demo URL Bar */}
                  {viewLead.demo_url && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-bold text-emerald-900">Personalized Demo Landing Page</div>
                          <a href={viewLead.demo_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-700 hover:underline truncate block">
                            {viewLead.demo_url} ↗
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyToClipboard(viewLead.demo_url!, "demo")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shrink-0"
                      >
                        {copiedField === "demo" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === "demo" ? "Copied" : "Copy Link"}</span>
                      </button>
                    </div>
                  )}

                  {/* Email Pitch */}
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-[#489473]" /> Cold Email Pitch
                      </span>
                      <button
                        onClick={() => handleCopyToClipboard(viewLead.email_message || "", "email")}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1"
                      >
                        {copiedField === "email" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === "email" ? "Copied" : "Copy Email"}</span>
                      </button>
                    </div>
                    <pre className="text-xs font-sans text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 sm:p-4 rounded-xl border border-slate-100">
                      {viewLead.email_message || "Email message has not been generated for this lead."}
                    </pre>
                  </div>

                  {/* WhatsApp Pitch */}
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Message
                      </span>
                      <div className="flex items-center gap-2">
                        {viewLead.phone && (
                          <a
                            href={`https://wa.me/${viewLead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(viewLead.whatsapp_message || '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Direct Chat
                          </a>
                        )}
                        <button
                          onClick={() => handleCopyToClipboard(viewLead.whatsapp_message || "", "wa")}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1"
                        >
                          {copiedField === "wa" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === "wa" ? "Copied" : "Copy Message"}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 bg-white p-3 sm:p-4 rounded-xl border border-slate-100 leading-relaxed font-medium">
                      {viewLead.whatsapp_message || "WhatsApp message has not been generated for this lead."}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: RAW PAYLOAD */}
              {modalTab === "payload" && (
                <div className="relative">
                  <button
                    onClick={() => handleCopyToClipboard(JSON.stringify(viewLead, null, 2), "raw")}
                    className="absolute right-4 top-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    {copiedField === "raw" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === "raw" ? "Copied JSON" : "Copy Payload"}</span>
                  </button>
                  <pre className="bg-slate-950 text-emerald-400 p-4 sm:p-5 rounded-2xl text-[11px] sm:text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                    {JSON.stringify(viewLead, null, 2)}
                  </pre>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <span className="text-[11px] sm:text-xs text-slate-400 font-mono truncate max-w-[150px]">ID: {viewLead.lead_id}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewLead(null)}
                  className="px-4 sm:px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { approveLead(String(viewLead.lead_id)); setViewLead(null); }}
                  disabled={!viewLead.email_message}
                  className="px-4 sm:px-5 py-2 bg-[#489473] hover:bg-[#3C7F62] text-white font-bold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  Approve & Dispatch
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
