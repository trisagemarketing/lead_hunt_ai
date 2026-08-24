"use client";

import { useEffect, useState } from "react";
import { X, Trash2, ExternalLink, CheckCircle, Mail, Send, Activity, MessageSquare, LayoutDashboard, Search, Users, Settings, Globe, Phone, Hash as Instagram, ThumbsUp as Facebook, Link as LinkIcon, Building2, Bell, ChevronDown, ChevronLeft, Menu, ChevronRight, Loader2, RefreshCw, Flame, History, Zap, Monitor, Hourglass, CheckSquare, List, Terminal, FileCode, Play } from "lucide-react";

export default function Dashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://leadhuntai-production.up.railway.app";

  const [leads, setLeads] = useState<Record<string, string | number | null | undefined | boolean>[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [deletedLeads, setDeletedLeads] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('deletedLeads');
    if (saved) {
      try {
        setDeletedLeads(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Failed to parse deletedLeads from localStorage:", e);
        setDeletedLeads(new Set());
        localStorage.removeItem('deletedLeads');
      }
    }
  }, []);

  const handleDeleteSelected = () => {
    const newDeleted = new Set(deletedLeads);
    selectedLeads.forEach(id => newDeleted.add(id));
    setDeletedLeads(newDeleted);
    localStorage.setItem('deletedLeads', JSON.stringify(Array.from(newDeleted)));
    setSelectedLeads(new Set());
  };

  const visibleLeads = leads.filter(lead => !deletedLeads.has(String(lead.lead_id)));


  // UI State
  const [activeTab, setActiveTab] = useState("pipeline");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCampaign, setActiveCampaign] = useState<{city: string, category: string} | null>(null);

  // Engine State
  const [city, setCity] = useState("Vadodara");
  const [category, setCategory] = useState("restaurants");
  const [startingEngine, setStartingEngine] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewLead, setViewLead] = useState<any>(null);

  const [engineLogs, setEngineLogs] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startingEngine) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/engine/logs`);
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
      const res = await fetch(`${API_URL}/api/leads`);
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
      await fetch(`${API_URL}/api/engine/start`, {
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
      const res = await fetch(`${API_URL}/api/leads/${leadId}/approve`, {
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
  const filteredLeads = visibleLeads.filter(lead => {
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
    discovered: visibleLeads.length,
    hot: visibleLeads.filter(l => l.lead_tier === 'HOT').length,
    warm: visibleLeads.filter(l => l.lead_tier === 'WARM').length,
    demos: leads.filter(l => l.demo_url).length,
    pending: visibleLeads.filter(l => l.email_message && l.lead_tier === 'HOT').length,
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

              {/* TABLE LAYOUT */}
              <div className="pb-10">
                <div className="bg-white rounded-3xl shadow-[0_4px_25px_-10px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-bold text-[#1E293B]">Lead Analytics</h3>
                      <div className="bg-[#F5F6F8] px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500">
                        {filteredLeads.length} Total Found
                      </div>
                    </div>
                    {selectedLeads.size > 0 && (
                      <button 
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-rose-200"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Selected ({selectedLeads.size})
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto flex-1 p-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap w-10">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-300 text-[#489473] focus:ring-[#489473]"
                              checked={filteredLeads.length > 0 && selectedLeads.size === filteredLeads.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLeads(new Set(filteredLeads.map(l => String(l.lead_id))));
                                } else {
                                  setSelectedLeads(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Business Target</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Score</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Website</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredLeads.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-medium">No leads discovered yet.</td></tr>
                        ) : (
                          filteredLeads.map((lead) => (
                            <tr key={String(lead.lead_id)} className={`hover:bg-slate-50/80 transition-colors group ${selectedLeads.has(String(lead.lead_id)) ? 'bg-slate-50' : ''}`}>
                              <td className="px-6 py-4 align-middle">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-slate-300 text-[#489473] focus:ring-[#489473]"
                                  checked={selectedLeads.has(String(lead.lead_id))}
                                  onChange={(e) => {
                                    const next = new Set(selectedLeads);
                                    if (e.target.checked) next.add(String(lead.lead_id));
                                    else next.delete(String(lead.lead_id));
                                    setSelectedLeads(next);
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4 align-middle">
                                <div 
                                  className="font-bold text-[#1E293B] text-[14px] mb-1 cursor-pointer hover:text-[#489473] hover:underline transition-all"
                                  onClick={() => setViewLead(lead)}
                                >
                                  {lead.business_name}
                                </div>
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
                    {Object.values(visibleLeads.reduce((acc: any, lead: any) => {
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

      {/* LEAD DETAILS MODAL */}
      {viewLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-8">
          <div className="bg-white w-full max-w-4xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="text-xl font-bold text-[#1E293B] flex items-center gap-3">
                <div className="w-10 h-10 bg-[#489473]/10 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#489473]" />
                </div>
                {viewLead.business_name}
              </h3>
              <button 
                onClick={() => setViewLead(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(viewLead).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-[#489473]/30 transition-colors group">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 group-hover:text-[#489473] transition-colors">{key.replace(/_/g, ' ')}</div>
                    <div className="text-sm font-medium text-[#1E293B] break-words">
                      {value === null || value === undefined || value === '' 
                        ? <span className="text-slate-400 italic">Not available</span> 
                        : typeof value === 'boolean' 
                          ? (value ? <span className="text-[#489473] font-bold">Yes</span> : 'No') 
                          : (key === 'created_at' || key === 'updated_at') && typeof value === 'string'
                            ? new Date(value + (value.endsWith('Z') ? '' : 'Z')).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
                            : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
              <button 
                onClick={() => setViewLead(null)}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}



