"use client";

import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle, Mail, Send, Activity, MessageSquare, LayoutDashboard, Search, Users, Settings, Globe, Phone, Hash as Instagram, ThumbsUp as Facebook, Link as LinkIcon, Building2, Bell, ChevronDown, ChevronLeft } from "lucide-react";

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  // Engine State
  const [city, setCity] = useState("Vadodara");
  const [category, setCategory] = useState("restaurants");
  const [startingEngine, setStartingEngine] = useState(false);
  const [activeTab, setActiveTab] = useState("pipeline");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
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
    setStartingEngine(true);
    try {
      const res = await fetch("https://leadhuntai-production.up.railway.app/api/engine/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city, business_type: category }),
      });
      const data = await res.json();
      alert(data.message);
      setActiveTab("pipeline");
    } catch (err) {
      console.error(err);
      alert("Failed to start engine.");
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
        alert("Lead Approved! Triggering webhook...");
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
      alert("Error approving lead");
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7FC] text-[#654CA5]">
        <Activity className="animate-spin w-8 h-8 mr-3" />
        <span className="text-lg font-medium text-slate-600">Loading Workspace...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F4F7FC] text-slate-800 overflow-hidden font-sans">
      
      {/* --- LEFT SIDEBAR (Purple) --- */}
      <aside className="w-64 bg-[#654CA5] flex flex-col hidden md:flex shrink-0 shadow-lg z-20 text-white">
        
        {/* Sidebar Header Logo */}
        <div className="h-16 flex items-center px-6 bg-[#563D96]">
          <div className="w-6 h-8 border-2 border-white rounded-sm flex items-center justify-center mr-3 relative">
             <div className="w-1 h-3 bg-white absolute top-1"></div>
          </div>
          <span className="text-lg font-bold tracking-tight leading-tight">
            LeadHunter <br/><span className="text-sm font-normal text-indigo-200">Intelligence</span>
          </span>
        </div>
        
        {/* Sidebar Nav */}
        <nav className="flex-1 py-6 space-y-1">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4 ${activeTab === 'dashboard' ? 'bg-[#755BB5] border-white' : 'border-transparent text-indigo-100 hover:bg-[#755BB5]/50'}`}
          >
            <LayoutDashboard className="w-4 h-4 mr-3" /> Overview
          </button>
          
          <button 
            onClick={() => setActiveTab("search")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4 ${activeTab === 'search' ? 'bg-[#755BB5] border-white' : 'border-transparent text-indigo-100 hover:bg-[#755BB5]/50'}`}
          >
            <Search className="w-4 h-4 mr-3" /> Discover Leads
          </button>
          
          <button 
            onClick={() => setActiveTab("pipeline")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4 ${activeTab === 'pipeline' ? 'bg-[#755BB5] border-white' : 'border-transparent text-indigo-100 hover:bg-[#755BB5]/50'}`}
          >
            <Users className="w-4 h-4 mr-3" /> Outreach Pipeline
          </button>
          
          <button className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4 border-transparent text-indigo-100 hover:bg-[#755BB5]/50`}>
             <Settings className="w-4 h-4 mr-3" /> Settings
          </button>
        </nav>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* TOP HEADER (Dark Purple) */}
        <header className="h-16 bg-[#563D96] flex items-center justify-between px-8 shrink-0 z-10 text-white shadow-md">
          <div className="flex-1 flex items-center">
            {/* Search Bar matching the image */}
            <div className="bg-white rounded px-3 py-1.5 w-64 flex items-center">
               <Search className="w-4 h-4 text-slate-400 mr-2" />
               <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm text-slate-800 w-full placeholder-slate-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="text-indigo-200 hover:text-white relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#563D96]"></span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 font-bold text-xs overflow-hidden">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Admin" alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:block">
                 <div className="text-sm font-semibold leading-tight">Admin User</div>
                 <div className="text-[10px] text-indigo-200">System Administrator</div>
              </div>
              <ChevronDown className="w-4 h-4 text-indigo-200" />
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* Top right stats from image */}
          <div className="absolute top-8 right-8 text-right text-xs text-slate-500">
             <div>Total leads: <span className="font-bold text-slate-700">{leads.length}</span></div>
             <div>HOT leads: <span className="font-bold text-slate-700">{leads.filter(l => l.lead_tier === 'HOT').length}</span></div>
          </div>

          <div className="max-w-7xl mx-auto pt-2">

            {/* In-page Tabs (Like Members / Admins from image) */}
            <div className="flex mb-6">
               <button onClick={() => setActiveTab("pipeline")} className={`px-6 py-2 text-sm font-medium rounded-t-lg bg-white text-slate-800 ${activeTab === 'pipeline' ? 'shadow-[0_-4px_0_0_#654CA5_inset]' : 'text-slate-500 shadow-sm'}`}>Leads Data</button>
               <button onClick={() => setActiveTab("search")} className={`px-6 py-2 text-sm font-medium rounded-t-lg bg-white ml-2 ${activeTab === 'search' ? 'shadow-[0_-4px_0_0_#654CA5_inset] text-slate-800' : 'text-slate-500 shadow-sm'}`}>Scrape New</button>
               <button onClick={() => setActiveTab("dashboard")} className={`px-6 py-2 text-sm font-medium rounded-t-lg bg-white ml-2 ${activeTab === 'dashboard' ? 'shadow-[0_-4px_0_0_#654CA5_inset] text-slate-800' : 'text-slate-500 shadow-sm'}`}>Statistics</button>
            </div>

            {/* WHITE CARD CONTENT AREA */}
            <div className="bg-white rounded-lg shadow-sm w-full p-6 border border-slate-100">

              {/* TAB: FIND LEADS */}
              {activeTab === "search" && (
                <div className="animate-in fade-in">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Search className="w-5 h-5 mr-2 text-[#654CA5]" /> New Discovery Search
                  </h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Target Location</label>
                      <input 
                        type="text" 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#654CA5]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Business Vertical</label>
                      <input 
                        type="text" 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#654CA5]"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button 
                        onClick={startEngine}
                        disabled={startingEngine}
                        className={`px-6 py-2.5 font-medium rounded shadow-sm flex items-center justify-center text-sm transition-all ${
                          startingEngine 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "bg-[#654CA5] text-white hover:bg-[#563D96]"
                        }`}
                      >
                        {startingEngine ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
                        {startingEngine ? "Executing Cloud AI..." : "Run AI Orchestrator"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: DASHBOARD */}
              {activeTab === "dashboard" && (
                <div className="animate-in fade-in">
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Overview Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-slate-200 p-6 rounded-lg bg-slate-50">
                      <div className="text-slate-500 text-sm font-medium mb-1">Total Leads In Database</div>
                      <div className="text-3xl font-bold text-[#654CA5]">{leads.length}</div>
                    </div>
                    <div className="border border-slate-200 p-6 rounded-lg bg-slate-50 relative overflow-hidden">
                      <div className="text-slate-500 text-sm font-medium mb-1">HOT Leads (No Website)</div>
                      <div className="text-3xl font-bold text-red-500">{leads.filter(l => l.lead_tier === 'HOT').length}</div>
                    </div>
                    <div className="border border-slate-200 p-6 rounded-lg bg-slate-50">
                      <div className="text-slate-500 text-sm font-medium mb-1">Emails Drafted</div>
                      <div className="text-3xl font-bold text-green-600">{leads.filter(l => l.email_message).length}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PIPELINE */}
              {activeTab === "pipeline" && (
                <div className="animate-in fade-in">
                  
                  {/* Table Controls Matching Image */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <h2 className="text-2xl font-bold text-slate-800 mr-4">Leads</h2>
                       <button onClick={startEngine} className="bg-[#654CA5] hover:bg-[#563D96] text-white px-4 py-2 rounded text-sm shadow-sm transition-colors font-medium">Add new</button>
                       <button onClick={fetchLeads} className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-sm shadow-sm transition-colors font-medium flex items-center">
                          <Activity className="w-3.5 h-3.5 mr-2" /> Refresh Data
                       </button>
                    </div>
                    <button className="bg-[#654CA5] hover:bg-[#563D96] text-white px-4 py-2 rounded text-sm shadow-sm transition-colors font-medium flex items-center">
                       <ChevronLeft className="w-4 h-4 mr-1" /> Filter
                    </button>
                  </div>

                  {/* THE TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="text-slate-500 text-[13px] border-b-2 border-slate-100">
                          <th className="py-3 font-semibold w-1/4">Business Name</th>
                          <th className="py-3 font-semibold">Contact & Social</th>
                          <th className="py-3 font-semibold">AI Pitch Status</th>
                          <th className="py-3 font-semibold text-center">Score</th>
                          <th className="py-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leads.map((lead) => (
                          <tr key={lead.lead_id} className="hover:bg-slate-50 transition-colors group text-[13px]">
                            
                            {/* COL 1: Business */}
                            <td className="py-4 align-middle pr-4">
                              <div className="font-semibold text-slate-800 text-[14px]">{lead.business_name}</div>
                              <div className="text-slate-500 mt-0.5">{lead.category} • {lead.city}</div>
                            </td>

                            {/* COL 2: Contact */}
                            <td className="py-4 align-middle pr-4">
                              <div className="space-y-1">
                                <div className="text-slate-700 flex items-center">
                                  <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" /> 
                                  {lead.phone || <span className="text-slate-400 italic">N/A</span>}
                                </div>
                                <div className="text-slate-700 flex items-center">
                                  <Globe className="w-3.5 h-3.5 mr-2 text-slate-400" /> 
                                  {lead.website_url ? (
                                    <a href={lead.website_url} target="_blank" rel="noreferrer" className="hover:text-[#654CA5] hover:underline truncate max-w-[150px]">
                                      {lead.website_url.replace(/^https?:\/\/(www\.)?/, '')}
                                    </a>
                                  ) : <span className="text-slate-400 italic">N/A</span>}
                                </div>
                                <div className="text-slate-700 flex items-center">
                                  <Instagram className="w-3.5 h-3.5 mr-2 text-slate-400" /> 
                                  {lead.instagram || <span className="text-slate-400 italic">N/A</span>}
                                </div>
                              </div>
                            </td>

                            {/* COL 3: Status */}
                            <td className="py-4 align-middle">
                               {lead.email_message ? (
                                 <div>
                                   <div className="flex items-center text-green-600 font-medium mb-1">
                                      <CheckCircle className="w-4 h-4 mr-1.5" /> Drafted Ready
                                   </div>
                                   {lead.demo_url && (
                                     <a href={lead.demo_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#654CA5] hover:underline flex items-center">
                                        <ExternalLink className="w-3 h-3 mr-1" /> View Demo Link
                                     </a>
                                   )}
                                 </div>
                               ) : (
                                 <div className="text-slate-400 italic">Processing...</div>
                               )}
                            </td>

                            {/* COL 4: Score Badge (like the image's status pills) */}
                            <td className="py-4 align-middle text-center">
                               <span className={`inline-flex px-3 py-1 text-[11px] font-bold rounded-full ${
                                 lead.lead_tier === 'HOT' ? 'bg-red-100 text-red-600' : 
                                 lead.lead_tier === 'WARM' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-700'
                               }`}>
                                 {lead.lead_score} - {lead.lead_tier}
                               </span>
                            </td>

                            {/* COL 5: Action */}
                            <td className="py-4 align-middle text-right pl-4">
                              <button
                                onClick={() => approveLead(lead.lead_id)}
                                disabled={approving === lead.lead_id || !lead.email_message}
                                className={`px-5 py-1.5 font-medium text-xs rounded transition-all shadow-sm ${
                                  !lead.email_message 
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : approving === lead.lead_id
                                    ? "bg-[#755BB5]/50 text-white cursor-not-allowed"
                                    : "bg-[#654CA5] text-white hover:bg-[#563D96]"
                                }`}
                              >
                                {approving === lead.lead_id ? "..." : "Approve"}
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
          </div>
        </div>
      </main>
    </div>
  );
}
