"use client";

import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle, Mail, Send, Activity, MessageSquare, LayoutDashboard, Search, Users, Settings, Globe, Phone, Hash as Instagram, ThumbsUp as Facebook, Link as LinkIcon, Building2, Bell, ChevronDown, ChevronLeft, Menu, ChevronRight, Loader2, RefreshCw, Flame, History, Zap, Monitor, Hourglass, CheckSquare, List, Terminal, FileCode, Play } from "lucide-react";

export default function Dashboard() {
  const [leads, setLeads] = useState<Record<string, string | number | null | undefined | boolean>[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState("pipeline");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCampaign, setActiveCampaign] = useState<{city: string, category: string} | null>(null);

  // Engine State
  const [city, setCity] = useState("Vadodara");
  const [category, setCategory] = useState("restaurants");
  const [startingEngine, setStartingEngine] = useState(false);
  const [engineLogs, setEngineLogs] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startingEngine) {
      interval = setInterval(async () => {
        try {
          const res = await fetch("https://leadhuntai-production.up.railway.app/api/engine/logs");
          const text = await res.text();
          setEngineLogs(text);
          
          if (text.includes("PIPELINE FINISHED SUCCESSFULLY") || text.includes("ENGINE FINISHED WITH CODE")) {
            setStartingEngine(false);
            // After scraping completes, we fetch the new leads and auto-set active campaign
            setActiveCampaign({ city: city, category: category });
            fetchLeads();
            setActiveTab("pipeline");
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [startingEngine, city, category]);

  async function fetchLeads() {
    try {
      setLoading(true);
      const res = await fetch("https://leadhuntai-production.up.railway.app/api/leads");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const json = await res.json();
      setLeads(json.data);
      // Auto-set the active campaign to the most recent one if none is selected
      if (json.data.length > 0 && !activeCampaign) {
        setActiveCampaign({ city: json.data[0].city, category: json.data[0].category });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  async function startEngine() {
    if (!city.trim() || !category.trim()) {
      alert("Please enter both City and Category.");
      return;
    }
    setStartingEngine(true);
    setEngineLogs("");
    try {
      await fetch("https://leadhuntai-production.up.railway.app/api/engine/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city, business_type: category }),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to start engine. Check if backend is running.");
      setStartingEngine(false);
    }
  };

  async function approveLead(leadId: string) {
    setApproving(leadId);
    try {
      const res = await fetch(`https://leadhuntai-production.up.railway.app/api/leads/${leadId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n8n_webhook_url: "https://your-n8n-url/webhook" }),
      });
      if (res.ok) {
        alert("Lead Approved! AI Email Sent successfully via Webhook.");
        fetchLeads();
      } else {
        alert("Server error when approving lead.");
      }
    } catch (err) {
      console.error(err);
      alert("Network Error approving lead");
    } finally {
      setApproving(null);
    }
  };

  // Filter leads based on the global search query and active campaign
  const filteredLeads = leads.filter(lead => {
    // 1. Filter by active campaign (if selected)
    if (activeCampaign) {
      if (lead.city !== activeCampaign.city || lead.category !== activeCampaign.category) {
        return false;
      }
    }
    
    // 2. Filter by search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (lead.business_name && lead.business_name.toLowerCase().includes(q)) ||
      (lead.category && lead.category.toLowerCase().includes(q)) ||
      (lead.city && lead.city.toLowerCase().includes(q))
    );
  });

  // Compute metrics for the new UI
  const metrics = {
    discovered: leads.length,
    hot: leads.filter(l => l.lead_tier === 'HOT').length,
    warm: leads.filter(l => l.lead_tier === 'WARM').length,
    demos: leads.filter(l => l.demo_url).length,
    pending: leads.filter(l => l.email_message && l.lead_tier === 'HOT').length,
    outreach: 0 // Mocked for now
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 font-sans flex flex-col selection:bg-[#F97316]/30">
      {/* TOP NAVBAR */}
            <header className="h-auto lg:h-[60px] py-4 lg:py-0 bg-[#0B0E14] border-b border-[#1E2330] flex flex-col lg:flex-row items-center justify-between px-4 lg:px-6 shrink-0 z-10 relative gap-4 lg:gap-0">
        <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#F97316]" fill="#F97316" />
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
              LeadHunter.AI 
              <span className="text-[#F97316] text-[9px] uppercase ml-2 border border-[#F97316] px-1 py-0.5 rounded tracking-wider">V1.0 PRO</span>
            </h1>
          </div>
          
          <div className="hidden lg:block h-5 w-px bg-[#1E2330]"></div>
          
          <div className="flex items-center gap-3 lg:gap-5 text-[13px] w-full sm:w-auto justify-center">
            <div className="flex items-center gap-2 bg-[#13161F] border border-[#1E2330] px-3 py-1.5 rounded-md flex-1 sm:flex-none">
              <span className="text-slate-500 whitespace-nowrap">📍 City:</span>
              <input 
                type="text" 
                value={city} 
                onChange={e => setCity(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none w-full sm:w-20 placeholder-slate-600 font-medium p-0"
                placeholder="City"
              />
            </div>
            <div className="flex items-center gap-2 bg-[#13161F] border border-[#1E2330] px-3 py-1.5 rounded-md flex-1 sm:flex-none">
              <span className="text-slate-500 whitespace-nowrap">📁 Category:</span>
              <input 
                type="text" 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none w-full sm:w-24 placeholder-slate-600 font-medium p-0"
                placeholder="Category"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-5 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide font-bold">
            <span className="text-slate-500 hidden sm:inline">Outreach Mode:</span>
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-sm flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              LIVE MODE ACTIVE
            </span>
          </div>
          <button 
            onClick={startEngine}
            disabled={startingEngine}
            className="w-full sm:w-auto justify-center bg-[#F97316] hover:bg-[#EA580C] text-white px-5 py-2 lg:py-1.5 rounded text-sm font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {startingEngine ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" fill="currentColor" />}
            Run Full Pipeline
          </button>
        </div>
      </header>

      {/* FULL SCREEN LOADING OVERLAY */}
      {startingEngine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E14]/90 backdrop-blur-sm">
          <div className="flex flex-col items-center text-center w-full max-w-2xl bg-[#13161F] p-10 rounded-2xl border border-[#1E2330] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F97316] to-transparent opacity-50"></div>
            
            <div className="w-16 h-16 bg-[#0B0E14] rounded-full flex items-center justify-center mb-6 border border-[#1E2330] shadow-[0_0_20px_rgba(249,115,22,0.15)] relative">
              <div className="absolute inset-0 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin"></div>
              <Activity className="w-7 h-7 text-[#F97316]" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">AI Agent Executing Protocol...</h3>
            <p className="text-sm text-slate-400 mb-8">
              Autonomously scraping Google Maps for <span className="text-white font-medium">{category}</span> in <span className="text-white font-medium">{city}</span>, auditing technical stacks, and drafting AI outreach.
            </p>
            
            <div className="w-full bg-[#0B0E14] rounded-full h-2 mb-2 overflow-hidden border border-[#1E2330]">
              <div className="bg-[#F97316] h-full rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(249,115,22,0.5)] relative" style={{ width: engineLogs.includes("Phase 6") ? "95%" : engineLogs.includes("Phase 5") ? "80%" : engineLogs.includes("Phase 4") ? "60%" : engineLogs.includes("Phase 3") ? "40%" : engineLogs.includes("Phase 2") ? "25%" : "10%" }}>
                <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-white/30 to-transparent"></div>
              </div>
            </div>
            
            <div className="text-[10px] text-slate-500 font-bold mb-6 flex justify-between w-full uppercase tracking-widest px-1">
              <span>Initializing</span>
              <span>Complete</span>
            </div>
            
            <div className="text-xs text-emerald-400 font-mono text-left w-full h-56 overflow-y-auto bg-[#090b10] p-4 rounded border border-[#1E2330] shadow-inner leading-relaxed">
              {engineLogs ? engineLogs.split('\n').filter(line => line.trim() !== "").slice(-12).map((line, i) => (
                <div key={i} className="truncate">{line}</div>
              )) : <span className="animate-pulse text-slate-500">Connecting to AI cloud instances...</span>}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
                        <aside className="hidden lg:flex w-[260px] bg-[#0B0E14] border-r border-[#1E2330] flex-col overflow-y-auto shrink-0 py-6">
          <div className="mb-6">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.15em] mb-4 px-6">Navigation</div>
            <nav className="space-y-1">
              <button onClick={() => setActiveTab('pipeline')} className={`w-[calc(100%-12px)] flex items-center gap-3.5 px-6 py-2.5 text-[14px] font-medium transition-colors rounded-r-lg ${activeTab === 'pipeline' ? 'bg-[#1D2333] text-white border-l-[3px] border-[#F97316]' : 'text-[#94A3B8] hover:text-white hover:bg-[#13161F] border-l-[3px] border-transparent'}`}>
                <LayoutDashboard className="w-5 h-5 opacity-80" /> Pipeline Overview
              </button>
              <button onClick={() => setActiveTab('history')} className={`w-[calc(100%-12px)] flex items-center gap-3.5 px-6 py-2.5 text-[14px] font-medium transition-colors rounded-r-lg ${activeTab === 'history' ? 'bg-[#1D2333] text-white border-l-[3px] border-[#F97316]' : 'text-[#94A3B8] hover:text-white hover:bg-[#13161F] border-l-[3px] border-transparent'}`}>
                <History className="w-5 h-5 opacity-80" /> Campaign History
              </button>
            </nav>
          </div>
        </aside>

        {/* MAIN CONTENT */}
                <main className="flex-1 min-w-0 overflow-y-auto bg-[#13161F] flex flex-col">
          {/* MOBILE ONLY TAB BAR */}
          <div className="flex lg:hidden bg-[#0B0E14] border-b border-[#1E2330] p-4 gap-2 overflow-x-auto shrink-0">
            <button onClick={() => setActiveTab('pipeline')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${activeTab === 'pipeline' ? 'bg-[#F97316] text-white' : 'bg-[#1E2330] text-slate-400'}`}>Pipeline Overview</button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${activeTab === 'history' ? 'bg-[#F97316] text-white' : 'bg-[#1E2330] text-slate-400'}`}>Campaign History</button>
          </div>
          
          <div className="p-4 sm:p-8 flex-1">
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Pipeline Overview & Metrics</h2>
              <p className="text-sm text-slate-400">
                Real-time status of your B2B web design prospect pipeline in <span className="text-white font-medium">{activeCampaign ? activeCampaign.city : city}</span>
              </p>
            </div>
            <button onClick={fetchLeads} className="flex items-center gap-2 bg-[#1E2330] hover:bg-[#2A3143] text-slate-300 px-3 py-1.5 rounded text-xs font-medium transition-colors border border-[#2A3143]">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>

          {activeTab === 'pipeline' && (
<>
{/* METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {/* Discovered */}
            <div className="bg-[#0B0E14] border border-[#1E2330] rounded-xl p-5 shadow-sm hover:border-[#2A3143] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[13px] font-medium text-slate-400">Discovered</div>
                <Search className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metrics.discovered}</div>
              <div className="text-[11px] text-slate-500">Google Maps & SerpAPI</div>
            </div>

            {/* HOT Leads */}
            <div className="bg-[#0B0E14] border border-[#F97316]/30 rounded-xl p-5 shadow-[0_0_15px_rgba(249,115,22,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-[#F97316]"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="text-[13px] font-bold text-white">🔥 HOT Leads</div>
                <Flame className="w-4 h-4 text-[#F97316]" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metrics.hot}</div>
              <div className="text-[11px] text-slate-500">Score ≥ 70 (No Site / Broken)</div>
            </div>

            {/* WARM Leads */}
            <div className="bg-[#0B0E14] border border-[#facc15]/30 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-400"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="text-[13px] font-bold text-white">⚡ WARM Leads</div>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metrics.warm}</div>
              <div className="text-[11px] text-slate-500">Score 45–69</div>
            </div>

            {/* Demos Ready */}
            <div className="bg-[#0B0E14] border border-[#1E2330] rounded-xl p-5 hover:border-[#2A3143] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[13px] font-medium text-slate-400">Demos Ready</div>
                <Monitor className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metrics.demos}</div>
              <div className="text-[11px] text-slate-500">Live Landing Page Previews</div>
            </div>

            {/* Pending Approval */}
            <div className="bg-[#0B0E14] border border-[#1E2330] rounded-xl p-5 hover:border-[#2A3143] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[13px] font-medium text-slate-400">Pending Approval</div>
                <Hourglass className="w-4 h-4 text-amber-200" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metrics.pending}</div>
              <div className="text-[11px] text-slate-500">Awaiting Human Review</div>
            </div>
          </div>

          {/* LEADS TABLE PREVIEW (Adapting the dark mode) */}
          <div className="bg-[#0B0E14] border border-[#1E2330] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#1E2330] flex justify-between items-center bg-[#0F131C]">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#F97316]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Hot Prospects Ready for Action</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs font-bold text-[#F97316] bg-[#F97316]/10 px-2 py-1 rounded border border-[#F97316]/20">
                  {metrics.hot * 15} PTS
                </div>
                <button className="text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center hover:text-white transition-colors">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0B0E14] border-b border-[#1E2330]">
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Business Target</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Intel</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Score</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2330]">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">No leads found in this pipeline.</td>
                    </tr>
                  ) : (
                    filteredLeads.slice(0, 10).map((lead) => (
                      <tr key={lead.lead_id} className="hover:bg-[#13161F] transition-colors group">
                        <td className="px-6 py-5 align-top">
                          <div className="font-bold text-white text-[13px] mb-1.5 group-hover:text-[#F97316] transition-colors">{lead.business_name}</div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-600" /> {lead.category} <span className="mx-0.5">•</span> {lead.city}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[11px] space-y-2 align-top">
                          <div className="flex items-center text-slate-400">
                            <Phone className="w-3 h-3 mr-2 text-slate-600" /> {lead.phone || 'N/A'}
                          </div>
                          <div className="flex items-center text-slate-400">
                            <Globe className="w-3 h-3 mr-2 text-slate-600" /> 
                            {lead.website_url ? <a href={lead.website_url} target="_blank" rel="noreferrer" className="text-[#38bdf8] hover:underline truncate max-w-[150px] inline-block align-bottom">{lead.website_url.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="text-slate-600 font-mono text-[10px] bg-[#1E2330] px-1.5 py-0.5 rounded">NO_WEBSITE</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center align-top">
                           <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold border tracking-wide ${lead.lead_tier === 'HOT' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : lead.lead_tier === 'WARM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                             {lead.lead_score} - {lead.lead_tier}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-right align-top">
                          <button
                            onClick={() => approveLead(lead.lead_id)}
                            disabled={approving === lead.lead_id || !lead.email_message}
                            className={`px-4 py-1.5 font-bold text-[11px] rounded transition-all uppercase tracking-widest ${
                              !lead.email_message 
                                ? "bg-[#1E2330] text-slate-500 border border-[#2A3143] cursor-not-allowed"
                                : approving === lead.lead_id
                                ? "bg-[#EA580C]/50 text-white cursor-not-allowed"
                                : "bg-[#F97316] text-white hover:bg-[#EA580C] shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                            }`}
                          >
                            {approving === lead.lead_id ? "SENDING..." : "APPROVE"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
)}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="bg-[#0B0E14] border border-[#1E2330] rounded-xl overflow-hidden mt-8">
              <div className="p-5 border-b border-[#1E2330] flex justify-between items-center bg-[#0F131C]">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#F97316]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scraper Campaign History</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0B0E14] border-b border-[#1E2330]">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">City</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Leads Found</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Websites</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Most Recent Run</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2330]">
                    {Object.values(leads.reduce((acc, lead) => {
                      const city = lead.city || 'Unknown';
                      const cat = lead.category || 'Unknown';
                      const key = `${city}-${cat}`.toLowerCase();
                      if (!acc[key]) {
                        acc[key] = { city, category: cat, count: 0, websites: 0, socials: 0, lastRun: lead.created_at || '' };
                      }
                      acc[key].count += 1;
                      if (lead.website_url) acc[key].websites += 1;
                      if (lead.instagram || lead.facebook) acc[key].socials += 1;
                      
                      if (lead.created_at && lead.created_at > acc[key].lastRun) {
                        acc[key].lastRun = lead.created_at;
                      }
                      return acc;
                    }, {}))/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    .sort((a: any, b: any) => b.lastRun.localeCompare(a.lastRun))/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    .map((campaign: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#13161F] transition-colors group">
                        <td className="px-6 py-5 font-bold text-white text-[13px]">{campaign.city}</td>
                        <td className="px-6 py-5 text-slate-400 text-[13px] capitalize">{campaign.category}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="bg-[#1E2330] text-slate-300 px-3 py-1 rounded font-bold text-xs border border-[#2A3143]">
                            {campaign.count}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center text-slate-400 text-[13px]">{campaign.websites}</td>
                        <td className="px-6 py-5 text-right text-slate-500 text-xs font-mono">
                          {campaign.lastRun ? new Date(campaign.lastRun).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'Unknown'}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => {
                              setActiveCampaign({ city: campaign.city, category: campaign.category });
                              setActiveTab("pipeline");
                            }}
                            className="text-[#F97316] hover:text-white text-[10px] font-bold bg-[#F97316]/10 hover:bg-[#F97316] border border-[#F97316]/20 px-3 py-1.5 rounded transition-all uppercase tracking-widest"
                          >
                            View Leads
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

</div>
        </main>
      </div>
    </div>
  );
}
