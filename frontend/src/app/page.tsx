"use client";

import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle, Mail, Send, Activity, MessageSquare, LayoutDashboard, Search, Users, Settings, Globe, Phone, Hash as Instagram, ThumbsUp as Facebook, Link as LinkIcon, Building2, Bell, ChevronDown, ChevronLeft, Menu, ChevronRight, Loader2, RefreshCw, Flame, History } from "lucide-react";

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState("pipeline");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Engine State
  const [city, setCity] = useState("Vadodara");
  const [category, setCategory] = useState("restaurants");
  const [startingEngine, setStartingEngine] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://leadhuntai-production.up.railway.app/api/leads");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const json = await res.json();
      setLeads(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEngine = async () => {
    if (!city.trim() || !category.trim()) {
      alert("Please enter both City and Category.");
      return;
    }
    setStartingEngine(true);
    try {
      const res = await fetch("https://leadhuntai-production.up.railway.app/api/engine/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city, business_type: category }),
      });
      const data = await res.json();
      alert(`Cloud Pipeline Started!\n\nThe AI is currently scraping Google Maps, verifying websites, and personalizing emails in the background. This usually takes 45-60 seconds.\n\nWe will now switch you to the Pipeline view. Please wait a minute and then click the 'Refresh' button to see your new leads!`);
      setActiveTab("pipeline");
    } catch (err) {
      console.error(err);
      alert("Failed to start engine. Check if backend is running.");
    } finally {
      setStartingEngine(false);
    }
  };

  const approveLead = async (leadId: string) => {
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

  // Filter leads based on the global search query
  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (lead.business_name && lead.business_name.toLowerCase().includes(q)) ||
      (lead.category && lead.category.toLowerCase().includes(q)) ||
      (lead.city && lead.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex h-screen bg-[#F4F7FC] text-slate-800 overflow-hidden">
      
      {/* --- LEFT SIDEBAR (Purple) --- */}
      <aside className={`bg-[#654CA5] flex flex-col shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.05)] z-20 text-white transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'} hidden md:flex`}>
        
        {/* Sidebar Header Logo */}
        <div className="h-16 flex items-center px-6 bg-[#563D96] relative">
          <div className="w-6 h-8 border-2 border-white rounded-sm flex items-center justify-center mr-3 shrink-0 relative">
             <div className="w-1 h-3 bg-white absolute top-1"></div>
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold tracking-tight leading-tight whitespace-nowrap overflow-hidden transition-all duration-300">
              LeadHunter <br/><span className="text-sm font-normal text-indigo-200">Intelligence</span>
            </span>
          )}
        </div>
        
        {/* Sidebar Nav */}
        <nav className="flex-1 py-6 space-y-2">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4 group ${activeTab === 'dashboard' ? 'bg-[#755BB5] border-white' : 'border-transparent text-indigo-100 hover:bg-[#755BB5]/50 hover:text-white'}`}
            title="Overview Statistics"
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" /> 
            {!sidebarCollapsed && <span className="ml-4 whitespace-nowrap">Overview</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab("search")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4 group ${activeTab === 'search' ? 'bg-[#755BB5] border-white' : 'border-transparent text-indigo-100 hover:bg-[#755BB5]/50 hover:text-white'}`}
            title="Discover Leads"
          >
            <Search className="w-5 h-5 shrink-0" /> 
            {!sidebarCollapsed && <span className="ml-4 whitespace-nowrap">Discover Leads</span>}
          </button>

          <button 
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4 group ${activeTab === 'history' ? 'bg-[#755BB5] border-white' : 'border-transparent text-indigo-100 hover:bg-[#755BB5]/50 hover:text-white'}`}
            title="Search History"
          >
            <History className="w-5 h-5 shrink-0" /> 
            {!sidebarCollapsed && <span className="ml-4 whitespace-nowrap">Search History</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab("pipeline")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4 group ${activeTab === 'pipeline' ? 'bg-[#755BB5] border-white' : 'border-transparent text-indigo-100 hover:bg-[#755BB5]/50 hover:text-white'}`}
            title="Leads Pipeline"
          >
            <Users className="w-5 h-5 shrink-0" /> 
            {!sidebarCollapsed && <span className="ml-4 whitespace-nowrap">Leads Pipeline</span>}
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="pb-4 mt-auto">
          
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4 border-transparent text-indigo-100 hover:bg-[#755BB5]/50 hover:text-white`} 
            title="Toggle Sidebar"
          >
             <Menu className="w-5 h-5 shrink-0" /> 
             {!sidebarCollapsed && <span className="ml-4 whitespace-nowrap">Collapse Menu</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* TOP HEADER (Dark Purple) */}
        <header className="h-16 bg-[#563D96] flex items-center justify-between px-6 shrink-0 z-10 text-white shadow-md">
          <div className="flex-1 flex items-center gap-6">
            
            {/* Functional Search Bar */}
            <div className="bg-white/10 border border-white/20 rounded px-3 py-2 w-72 flex items-center focus-within:bg-white focus-within:border-white transition-colors group">
               <Search className="w-4 h-4 text-indigo-200 group-focus-within:text-slate-400 mr-2" />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search businesses or cities..." 
                 className="bg-transparent border-none outline-none text-sm text-white group-focus-within:text-slate-800 w-full placeholder-indigo-300 group-focus-within:placeholder-slate-400 transition-colors" 
               />
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="text-indigo-200 hover:text-white relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#563D96]"></span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-[#654CA5] p-1.5 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center overflow-hidden shrink-0">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=AdminUser&backgroundColor=e2e8f0" alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block text-left">
                 <div className="text-sm font-semibold leading-none mb-1 text-white">Alex Admin</div>
                 <div className="text-[10px] leading-none text-indigo-200">System Administrator</div>
              </div>
              <ChevronDown className="w-4 h-4 text-indigo-200 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          
          <div className="max-w-7xl mx-auto pt-2">

            {/* In-page Tabs */}
            <div className="flex mb-6 overflow-x-auto pb-1 no-scrollbar">
               <button onClick={() => setActiveTab("pipeline")} className={`px-6 py-2.5 text-sm font-medium rounded-t-lg bg-white whitespace-nowrap transition-all ${activeTab === 'pipeline' ? 'text-[#654CA5] shadow-[0_-3px_0_0_#654CA5_inset]' : 'text-slate-500 shadow-sm border-b border-slate-200 hover:bg-slate-50'}`}>
                 Leads Pipeline
               </button>
               <button onClick={() => setActiveTab("search")} className={`px-6 py-2.5 text-sm font-medium rounded-t-lg bg-white ml-2 whitespace-nowrap transition-all ${activeTab === 'search' ? 'text-[#654CA5] shadow-[0_-3px_0_0_#654CA5_inset]' : 'text-slate-500 shadow-sm border-b border-slate-200 hover:bg-slate-50'}`}>
                 Scrape New Engine
               </button>
               <button onClick={() => setActiveTab("history")} className={`px-6 py-2.5 text-sm font-medium rounded-t-lg bg-white ml-2 whitespace-nowrap transition-all ${activeTab === 'history' ? 'text-[#654CA5] shadow-[0_-3px_0_0_#654CA5_inset]' : 'text-slate-500 shadow-sm border-b border-slate-200 hover:bg-slate-50'}`}>
                 Search History
               </button>
               <button onClick={() => setActiveTab("dashboard")} className={`px-6 py-2.5 text-sm font-medium rounded-t-lg bg-white ml-2 whitespace-nowrap transition-all ${activeTab === 'dashboard' ? 'text-[#654CA5] shadow-[0_-3px_0_0_#654CA5_inset]' : 'text-slate-500 shadow-sm border-b border-slate-200 hover:bg-slate-50'}`}>
                 Statistics
               </button>
            </div>

            {/* WHITE CARD CONTENT AREA */}
            <div className="bg-white rounded-lg shadow-sm w-full p-6 border border-slate-200 min-h-[500px]">

              {/* TAB: FIND LEADS */}
              {activeTab === "search" && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                    <Search className="w-5 h-5 mr-2 text-[#654CA5]" /> Execute AI Scraper
                  </h2>
                  <p className="text-sm text-slate-500 mb-8 max-w-xl">Enter a target city and business vertical below. The cloud orchestration engine will trigger the Google Maps scraper and begin scoring leads asynchronously.</p>
                  
                  <div className="space-y-5 max-w-md bg-slate-50 p-6 rounded-lg border border-slate-100">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Location</label>
                      <input 
                        type="text" 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Austin, TX"
                        className="w-full bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#654CA5]/20 focus:border-[#654CA5] transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Vertical</label>
                      <input 
                        type="text" 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Roofers, Real Estate"
                        className="w-full bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#654CA5]/20 focus:border-[#654CA5] transition-all shadow-sm"
                      />
                    </div>
                    
                    <div className="pt-2">
                      <button 
                        onClick={startEngine}
                        disabled={startingEngine}
                        className={`w-full px-6 py-3 font-semibold rounded-md shadow-sm flex items-center justify-center text-sm transition-all ${
                          startingEngine 
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed" 
                            : "bg-[#654CA5] text-white hover:bg-[#563D96] hover:shadow-md active:scale-[0.98]"
                        }`}
                      >
                        {startingEngine ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
                        {startingEngine ? "Executing Cloud Pipeline..." : "Start Lead Generation"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: HISTORY */}
              {activeTab === "history" && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="max-w-4xl">
                    <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                      <History className="w-5 h-5 mr-2 text-[#654CA5]" /> Scraper Campaign History
                    </h2>
                    <p className="text-sm text-slate-500 mb-8 max-w-xl">
                      Review all past lead generation campaigns. Campaigns are grouped automatically by target city and business vertical.
                    </p>

                    {leads.length === 0 ? (
                      <div className="text-sm text-slate-500 bg-white p-6 rounded-lg border border-slate-200 text-center">
                        No history available. Go to the Scraper to run your first campaign!
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                              <th className="px-6 py-4 font-semibold">Target City</th>
                              <th className="px-6 py-4 font-semibold">Business Vertical</th>
                              <th className="px-6 py-4 font-semibold text-center">Total Leads</th>
                              <th className="px-6 py-4 font-semibold text-center">Websites Found</th>
                              <th className="px-6 py-4 font-semibold text-center">Socials Found</th>
                              <th className="px-6 py-4 font-semibold text-right">Most Recent Run</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {Object.values(leads.reduce((acc: any, lead: any) => {
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
                            }, {})).sort((a: any, b: any) => b.lastRun.localeCompare(a.lastRun)).map((campaign: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{campaign.city}</td>
                                <td className="px-6 py-4 text-slate-600 capitalize">{campaign.category}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold text-xs border border-indigo-100">
                                    {campaign.count}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-slate-600 font-medium text-sm">
                                    {campaign.websites}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-slate-600 font-medium text-sm">
                                    {campaign.socials}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-slate-500 text-xs">
                                  {campaign.lastRun ? new Date(campaign.lastRun).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  }) : 'Unknown'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: DASHBOARD */}
              {activeTab === "dashboard" && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Database Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-slate-200 p-6 rounded-lg bg-white shadow-sm hover:border-[#654CA5]/30 transition-colors">
                      <div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wide">Total Discovered</div>
                      <div className="text-4xl font-bold text-slate-800">{loading ? <Loader2 className="w-8 h-8 animate-spin text-slate-300"/> : leads.length}</div>
                    </div>
                    <div className="border border-red-100 p-6 rounded-lg bg-red-50/50 shadow-sm relative overflow-hidden">
                      <div className="text-red-500 text-sm font-medium mb-2 uppercase tracking-wide">HOT Leads Identified</div>
                      <div className="text-4xl font-bold text-red-600">{loading ? <Loader2 className="w-8 h-8 animate-spin text-red-300"/> : leads.filter(l => l.lead_tier === 'HOT').length}</div>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                         <Flame className="w-16 h-16 text-red-600" />
                      </div>
                    </div>
                    <div className="border border-green-100 p-6 rounded-lg bg-green-50/50 shadow-sm relative overflow-hidden">
                      <div className="text-green-600 text-sm font-medium mb-2 uppercase tracking-wide">Pitches Drafted</div>
                      <div className="text-4xl font-bold text-green-700">{loading ? <Loader2 className="w-8 h-8 animate-spin text-green-300"/> : leads.filter(l => l.email_message).length}</div>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                         <Mail className="w-16 h-16 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PIPELINE */}
              {activeTab === "pipeline" && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  
                  {/* Table Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                       <h2 className="text-xl font-bold text-slate-800 mr-2">Pipeline {loading ? "" : `(${filteredLeads.length})`}</h2>
                       
                       {/* This triggers the "Scrape New" tab to simulate "Add new" from image */}
                       <button onClick={() => setActiveTab("search")} className="bg-[#654CA5] hover:bg-[#563D96] text-white px-4 py-2 rounded text-sm shadow-sm transition-colors font-medium hover:shadow-md active:scale-95">
                          Add new
                       </button>
                       
                       <button onClick={fetchLeads} disabled={loading} className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-sm shadow-sm transition-colors font-medium flex items-center active:scale-95 disabled:opacity-50">
                          {loading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />} 
                          Refresh
                       </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       {searchQuery && <span>Filtered by: "{searchQuery}"</span>}
                    </div>
                  </div>

                  {/* THE TABLE */}
                  <div className="overflow-x-auto border rounded-lg border-slate-200">
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap md:whitespace-normal">
                      <thead>
                        <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                          <th className="px-6 py-4 font-semibold w-1/4">Business Profile</th>
                          <th className="px-6 py-4 font-semibold">Contact Intel</th>
                          <th className="px-6 py-4 font-semibold">AI Status</th>
                          <th className="px-6 py-4 font-semibold text-center">Score Grade</th>
                          <th className="px-6 py-4 font-semibold text-right">Approve Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading && leads.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                              <div className="flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#654CA5] mb-2" />
                                <span className="font-medium">Loading leads data...</span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredLeads.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                              {searchQuery ? "No leads matched your search." : "No leads found. Go to 'Scrape New Engine' to discover some!"}
                            </td>
                          </tr>
                        ) : (
                          filteredLeads.map((lead) => (
                            <tr key={lead.lead_id} className="hover:bg-indigo-50/30 transition-colors group text-[13px]">
                              
                              {/* COL 1: Business */}
                              <td className="px-6 py-4 align-top">
                                <div className="font-bold text-slate-800 text-[14px] leading-tight mb-1">{lead.business_name}</div>
                                <div className="text-slate-500 text-xs flex items-center gap-1">
                                   <Building2 className="w-3 h-3 text-slate-400" /> {lead.category} <span className="mx-1">•</span> {lead.city}
                                </div>
                              </td>

                              {/* COL 2: Contact */}
                              <td className="px-6 py-4 align-top">
                                <div className="space-y-2">
                                  <div className="text-slate-700 flex items-center text-xs">
                                    <Phone className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" /> 
                                    {lead.phone || <span className="text-slate-400 italic">N/A</span>}
                                  </div>
                                  <div className="text-slate-700 flex items-center text-xs">
                                    <Globe className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" /> 
                                    {lead.website_url ? (
                                      <a href={lead.website_url} target="_blank" rel="noreferrer" className="hover:text-[#654CA5] hover:underline font-medium text-slate-600 truncate max-w-[180px] inline-block align-bottom">
                                        {lead.website_url.replace(/^https?:\/\/(www\.)?/, '')}
                                      </a>
                                    ) : <span className="text-slate-400 italic">N/A</span>}
                                  </div>
                                  <div className="flex gap-4">
                                    <div className="text-slate-700 flex items-center text-xs">
                                      <Instagram className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" /> 
                                      {lead.instagram ? (
                                        <a href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram}`} target="_blank" rel="noreferrer" className="hover:text-[#654CA5] hover:underline font-medium text-slate-600 truncate max-w-[80px] inline-block align-bottom">
                                          Insta
                                        </a>
                                      ) : <span className="text-slate-400 italic">N/A</span>}
                                    </div>
                                    <div className="text-slate-700 flex items-center text-xs">
                                      <Facebook className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" /> 
                                      {lead.facebook ? (
                                        <a href={lead.facebook.startsWith('http') ? lead.facebook : `https://facebook.com/${lead.facebook}`} target="_blank" rel="noreferrer" className="hover:text-[#654CA5] hover:underline font-medium text-slate-600 truncate max-w-[80px] inline-block align-bottom">
                                          FB
                                        </a>
                                      ) : <span className="text-slate-400 italic">N/A</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* COL 3: Status */}
                              <td className="px-6 py-4 align-top">
                                 {lead.email_message ? (
                                   <div className="bg-green-50 border border-green-100 rounded-md p-2">
                                     <div className="flex items-center text-green-700 font-semibold text-xs mb-1">
                                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Ready for Outreach
                                     </div>
                                     {lead.demo_url && (
                                       <a href={lead.demo_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#654CA5] font-medium hover:underline flex items-center mt-2 bg-white px-2 py-1 rounded border border-indigo-100 inline-flex shadow-sm">
                                          <ExternalLink className="w-3 h-3 mr-1" /> Preview Demo Built
                                       </a>
                                     )}
                                   </div>
                                 ) : lead.lead_tier !== 'HOT' ? (
                                   <div className="text-slate-400 italic text-xs flex items-center bg-slate-50 p-2 rounded-md border border-slate-100">
                                      Skipped by AI (Low Score)
                                   </div>
                                 ) : (
                                   <div className="text-slate-400 italic text-xs flex items-center bg-slate-50 p-2 rounded-md border border-slate-100">
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing via AI...
                                   </div>
                                 )}
                              </td>

                              {/* COL 4: Score Badge */}
                              <td className="px-6 py-4 align-middle text-center">
                                 <span className={`inline-flex items-center px-3 py-1 text-[11px] font-bold rounded-full border shadow-sm ${
                                   lead.lead_tier === 'HOT' ? 'bg-red-50 text-red-700 border-red-200' : 
                                   lead.lead_tier === 'WARM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'
                                 }`}>
                                   {lead.lead_score} - {lead.lead_tier}
                                 </span>
                              </td>

                              {/* COL 5: Action */}
                              <td className="px-6 py-4 align-middle text-right">
                                <button
                                  onClick={() => approveLead(lead.lead_id)}
                                  disabled={approving === lead.lead_id || !lead.email_message}
                                  className={`px-5 py-2 font-medium text-xs rounded transition-all shadow-sm ${
                                    !lead.email_message 
                                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                      : approving === lead.lead_id
                                      ? "bg-[#755BB5]/50 text-white cursor-not-allowed"
                                      : "bg-[#654CA5] text-white hover:bg-[#563D96] hover:shadow-md active:scale-95"
                                  }`}
                                >
                                  {approving === lead.lead_id ? "Sending..." : "Approve & Send"}
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
