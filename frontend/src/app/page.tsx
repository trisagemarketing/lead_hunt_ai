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
      (lead.business_name && String(lead.business_name).toLowerCase().includes(q)) ||
      (lead.category && String(lead.category).toLowerCase().includes(q)) ||
      (lead.city && String(lead.city).toLowerCase().includes(q))
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
    <div className="flex h-screen bg-[#F5F6F8] font-sans text-[#1E293B]">
      {/* SIDEBAR (Light Theme Green) */}
      <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-[80px]' : 'w-[260px]'} bg-[#489473] flex-col shrink-0 text-white shadow-xl z-20 transition-all duration-300`}>
        <div className={`p-6 flex items-center gap-3 mb-6 ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md shrink-0">
            <Zap className="w-5 h-5 text-[#489473]" fill="currentColor" />
          </div>
          {!sidebarCollapsed && <h1 className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden">LeadHunter</h1>}
        </div>
        
        <nav className="flex-1 flex flex-col gap-2 px-3">
          <button 
            onClick={() => setActiveTab('pipeline')} 
            title="Dashboard"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'pipeline' ? 'bg-[#3C7F62] font-semibold border-l-[4px] border-white' : 'hover:bg-[#3C7F62]/50 border-l-[4px] border-transparent font-medium opacity-90'} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" /> {!sidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">Dashboard</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('history')} 
            title="History"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-[#3C7F62] font-semibold border-l-[4px] border-white' : 'hover:bg-[#3C7F62]/50 border-l-[4px] border-transparent font-medium opacity-90'} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <History className="w-5 h-5 shrink-0" /> {!sidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">History</span>}
          </button>
        </nav>
        
        <div className="p-4 flex flex-col gap-2">
          <button title="Settings" className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-[#3C7F62]/50 font-medium opacity-90 w-full ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
            <Settings className="w-5 h-5 shrink-0" /> {!sidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">Settings</span>}
          </button>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title="Toggle Sidebar"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-[#3C7F62]/50 font-medium opacity-90 w-full ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <ChevronLeft className={`w-5 h-5 shrink-0 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} /> {!sidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* FULL SCREEN LOADING OVERLAY */}
        {startingEngine && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center w-full max-w-xl bg-white p-10 rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden">
              <div className="w-16 h-16 bg-[#F5F6F8] rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 border-4 border-[#489473] border-t-transparent rounded-full animate-spin"></div>
                <Activity className="w-7 h-7 text-[#489473]" />
              </div>
              
              <h3 className="text-2xl font-bold text-[#1E293B] mb-2 tracking-tight">Executing Protocol...</h3>
              <p className="text-sm text-slate-500 mb-8">
                Autonomously scraping Google Maps for <span className="font-bold text-[#489473]">{category}</span> in <span className="font-bold text-[#489473]">{city}</span>.
              </p>
              
              <div className="w-full bg-[#F5F6F8] rounded-full h-3 mb-6 overflow-hidden">
                <div className="bg-[#489473] h-full rounded-full transition-all duration-1000 ease-in-out" style={{ width: engineLogs.includes("Phase 6") ? "95%" : engineLogs.includes("Phase 5") ? "80%" : engineLogs.includes("Phase 4") ? "60%" : engineLogs.includes("Phase 3") ? "40%" : engineLogs.includes("Phase 2") ? "25%" : "10%" }}></div>
              </div>
              
              <div className="text-xs text-slate-600 font-mono text-left w-full h-40 overflow-y-auto bg-[#F5F6F8] p-4 rounded-xl border border-slate-200 leading-relaxed">
                {engineLogs ? engineLogs.split('\n').filter(line => line.trim() !== "").slice(-12).map((line, i) => (
                  <div key={i} className="truncate">{line}</div>
                )) : <span className="animate-pulse text-slate-400">Connecting to cloud instances...</span>}
              </div>
            </div>
          </div>
        )}

        {/* TOP HEADER */}
        <header className="h-[80px] bg-white flex items-center justify-between px-8 shrink-0 z-10">
          {/* SEARCH BAR */}
          <div className="flex-1 max-w-2xl flex items-center bg-[#F5F6F8] rounded-full px-4 py-2 gap-4">
            <Search className="w-5 h-5 text-slate-400" />
            <div className="flex items-center gap-2 flex-1 border-r border-slate-300 pr-4">
              <span className="text-sm font-medium text-slate-400">City:</span>
              <input 
                type="text" 
                value={city} 
                onChange={e => setCity(e.target.value)}
                className="bg-transparent border-none text-[#1E293B] focus:outline-none w-full font-bold placeholder-slate-400"
                placeholder="Vadodara"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 pl-2">
              <span className="text-sm font-medium text-slate-400">Niche:</span>
              <input 
                type="text" 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="bg-transparent border-none text-[#1E293B] focus:outline-none w-full font-bold placeholder-slate-400"
                placeholder="Restaurants"
              />
            </div>
          </div>

          {/* USER PROFILE & RUN BUTTON */}
          <div className="flex items-center gap-6 ml-6">
            <button 
              onClick={startEngine}
              disabled={startingEngine}
              className="bg-[#489473] hover:bg-[#3C7F62] text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-[0_4px_15px_-3px_rgba(72,148,115,0.4)] transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {startingEngine ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" fill="currentColor" />}
              Start AI Hunt
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">Administrator</div>
                <div className="text-sm font-bold text-[#1E293B]">Admin User</div>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN */}
        <main className="flex-1 overflow-y-auto p-8">
          
          <div className="flex lg:hidden bg-white rounded-full p-1 gap-1 mb-8 shadow-sm w-fit border border-slate-100">
            <button onClick={() => setActiveTab('pipeline')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'pipeline' ? 'bg-[#489473] text-white shadow-md' : 'text-slate-500'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-[#489473] text-white shadow-md' : 'text-slate-500'}`}>History</button>
          </div>

          {activeTab === 'pipeline' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[22px] font-bold tracking-tight text-[#1E293B]">Overview</h2>
                <div className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors" onClick={fetchLeads}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Pipeline
                </div>
              </div>

              {/* METRIC CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#489473] rounded-2xl p-6 shadow-[0_8px_20px_-6px_rgba(72,148,115,0.4)] text-white relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-sm">Discovered Leads</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-3xl font-bold">{metrics.discovered}</div>
                  </div>
                  <div className="text-xs text-white/80 mt-3 font-medium">Across all campaigns</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                      <Flame className="w-4 h-4 text-rose-500" />
                    </div>
                    <span className="font-semibold text-sm text-slate-600">Hot Prospects</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-3xl font-bold text-[#1E293B]">{metrics.hot}</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-3 font-medium">Score &gt; 70 pts</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="font-semibold text-sm text-slate-600">Warm Prospects</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-3xl font-bold text-[#1E293B]">{metrics.warm}</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-3 font-medium">Requires nurturing</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="font-semibold text-sm text-slate-600">Pending Approval</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-3xl font-bold text-[#1E293B]">{metrics.pending}</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-3 font-medium">Awaiting human review</div>
                </div>
              </div>

              {/* 2-COLUMN LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_4px_25px_-10px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[#1E293B]">Lead Analytics</h3>
                    <div className="bg-[#F5F6F8] px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500">
                      {filteredLeads.length} Total Found
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto flex-1 p-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Business Target</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Score</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Website</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredLeads.length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-medium">No leads discovered yet.</td></tr>
                        ) : (
                          filteredLeads.map((lead) => (
                            <tr key={String(lead.lead_id)} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-6 py-4 align-middle">
                                <div className="font-bold text-[#1E293B] text-[14px] mb-1">{lead.business_name}</div>
                                <div className="text-slate-500 text-[12px] flex items-center gap-1.5 font-medium">
                                  {lead.category} <span className="mx-0.5">•</span> {lead.city}
                                </div>
                              </td>
                              <td className="px-6 py-4 align-middle">
                                <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold ${lead.lead_tier === 'HOT' ? 'bg-rose-100 text-rose-600' : lead.lead_tier === 'WARM' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                  {lead.lead_score} PTS
                                </span>
                              </td>
                              <td className="px-6 py-4 align-middle">
                                {lead.website_url ? (
                                  <a href={String(lead.website_url)} target="_blank" rel="noreferrer" className="text-blue-500 font-medium text-sm hover:underline">
                                    Yes (Link)
                                  </a>
                                ) : (
                                  <span className="text-slate-400 text-sm font-medium">None</span>
                                )}
                              </td>
                              <td className="px-6 py-4 align-middle text-right">
                                <button
                                  onClick={() => approveLead(String(lead.lead_id))}
                                  disabled={approving === lead.lead_id || !lead.email_message}
                                  className={`px-4 py-2 font-bold text-[12px] rounded-lg transition-all shadow-sm ${
                                    !lead.email_message 
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                      : approving === lead.lead_id
                                      ? "bg-[#489473]/70 text-white cursor-not-allowed"
                                      : "bg-[#489473] text-white hover:bg-[#3C7F62] shadow-[0_4px_10px_-2px_rgba(72,148,115,0.3)]"
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

                <div className="bg-white rounded-3xl shadow-[0_4px_25px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-6 flex flex-col h-[500px]">
                  <h3 className="text-lg font-bold text-[#1E293B] mb-6">Top Hot Prospects</h3>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {filteredLeads.filter((l: any) => l.lead_tier === 'HOT').length === 0 ? (
                      <div className="text-sm text-slate-400 text-center py-10 font-medium">No hot prospects found.</div>
                    ) : (
                      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                      filteredLeads.filter((l: any) => l.lead_tier === 'HOT').slice(0, 5).map((lead: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer shadow-sm">
                          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center shrink-0">
                            <Flame className="w-5 h-5 text-rose-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#1E293B] text-[14px] truncate">{lead.business_name}</h4>
                            <p className="text-[12px] text-slate-500 font-medium mt-0.5 truncate">{lead.phone || 'No Phone'} • {lead.lead_score} pts</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl shadow-[0_4px_25px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-[#1E293B] mb-6">Campaign History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Location</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Niche</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Found</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {Object.values(leads.reduce((acc: any, lead: any) => {
                      const city = lead.city || 'Unknown';
                      const cat = lead.category || 'Unknown';
                      const key = `${city}-${cat}`.toLowerCase();
                      if (!acc[key]) {
                        acc[key] = { city, category: cat, count: 0, lastRun: lead.created_at || '' };
                      }
                      acc[key].count += 1;
                      return acc;
                    }, {})).map((campaign: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-[#1E293B] text-[14px]">{campaign.city}</td>
                        <td className="px-4 py-4 text-slate-500 font-medium text-[13px] capitalize">{campaign.category}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="bg-[#F5F6F8] text-[#1E293B] px-3 py-1 rounded-lg font-bold text-xs">
                            {campaign.count}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button 
                            onClick={() => {
                              setActiveCampaign({ city: campaign.city, category: campaign.category });
                              setActiveTab("pipeline");
                            }}
                            className="text-[#489473] font-bold text-xs bg-[#489473]/10 hover:bg-[#489473] hover:text-white px-4 py-2 rounded-lg transition-all"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}


