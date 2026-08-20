"use client";

import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle, Mail, Send, Activity, MessageSquare, LayoutDashboard, Search, Users, Settings, Globe, Phone, Hash as Instagram, ThumbsUp as Facebook, Link as LinkIcon, Building2 } from "lucide-react";

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
      <div className="flex h-screen items-center justify-center bg-[#0A0A0A] text-white">
        <Activity className="animate-spin text-white w-6 h-6 mr-3" />
        <span className="text-sm font-medium text-[#A1A1AA]">Initializing Workspace...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#EDEDED] overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* --- LEFT SIDEBAR (Minimalist) --- */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-[#222222] flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-[#222222]">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center mr-3">
            <Activity className="text-black w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">LeadHunter</span>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-[#666666] uppercase tracking-wider">Menu</div>
          
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-[#1A1A1A] text-white' : 'text-[#A1A1AA] hover:bg-[#111111] hover:text-white'}`}
          >
            <LayoutDashboard className="w-4 h-4 mr-3 opacity-70" /> Overview
          </button>
          
          <button 
            onClick={() => setActiveTab("search")}
            className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'search' ? 'bg-[#1A1A1A] text-white' : 'text-[#A1A1AA] hover:bg-[#111111] hover:text-white'}`}
          >
            <Search className="w-4 h-4 mr-3 opacity-70" /> Discover Leads
          </button>
          
          <button 
            onClick={() => setActiveTab("pipeline")}
            className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'pipeline' ? 'bg-[#1A1A1A] text-white' : 'text-[#A1A1AA] hover:bg-[#111111] hover:text-white'}`}
          >
            <Users className="w-4 h-4 mr-3 opacity-70" /> Outreach Pipeline
            <span className="ml-auto bg-[#222222] text-xs px-2 py-0.5 rounded-full">{leads.length}</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-[#222222]">
          <button className="w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-[#A1A1AA] hover:bg-[#111111] hover:text-white transition-all">
            <Settings className="w-4 h-4 mr-3 opacity-70" /> Settings
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0A0A0A]">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-[#0A0A0A] border-b border-[#222222] flex items-center justify-between px-8 shrink-0">
          <div className="text-sm font-medium text-[#A1A1AA] capitalize flex items-center gap-2">
            Workspace <span className="text-[#444444]">/</span> <span className="text-white">{activeTab.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-7 h-7 rounded-full bg-[#222222] flex items-center justify-center text-xs font-bold border border-[#333]">
              US
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">

            {/* TAB: FIND LEADS */}
            {activeTab === "search" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Lead Discovery Engine</h2>
                  <p className="text-[#A1A1AA] mt-1 text-sm">Configure target parameters for the AI orchestrator.</p>
                </div>
                
                <div className="bg-[#111111] rounded-lg border border-[#222222] p-8 max-w-xl">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Target Location</label>
                      <input 
                        type="text" 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Austin, TX"
                        className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Business Vertical</label>
                      <input 
                        type="text" 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Restaurants, Dentists"
                        className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    
                    <div className="pt-2">
                      <button 
                        onClick={startEngine}
                        disabled={startingEngine}
                        className={`w-full py-2.5 font-medium rounded-md flex items-center justify-center text-sm transition-all ${
                          startingEngine 
                            ? "bg-[#333333] text-[#888888] cursor-not-allowed" 
                            : "bg-white text-black hover:bg-[#E5E5E5]"
                        }`}
                      >
                        {startingEngine ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                        {startingEngine ? "Executing Run..." : "Execute Search"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold text-white tracking-tight mb-8">System Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-[#111111] border border-[#222222] p-6 rounded-lg">
                    <div className="text-[#888888] text-xs font-medium uppercase tracking-wider mb-2">Total Entities</div>
                    <div className="text-3xl font-bold text-white">{leads.length}</div>
                  </div>
                  <div className="bg-[#111111] border border-[#222222] p-6 rounded-lg relative overflow-hidden">
                    <div className="text-[#888888] text-xs font-medium uppercase tracking-wider mb-2">High Priority (HOT)</div>
                    <div className="text-3xl font-bold text-white">
                      {leads.filter(l => l.lead_tier === 'HOT').length}
                    </div>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-5 rounded-bl-full"></div>
                  </div>
                  <div className="bg-[#111111] border border-[#222222] p-6 rounded-lg">
                    <div className="text-[#888888] text-xs font-medium uppercase tracking-wider mb-2">Ready for Outreach</div>
                    <div className="text-3xl font-bold text-white">
                      {leads.filter(l => l.email_message).length}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PIPELINE */}
            {activeTab === "pipeline" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Outreach Pipeline</h2>
                    <p className="text-[#A1A1AA] mt-1 text-sm">Review full lead data and approve AI-generated campaigns.</p>
                  </div>
                  <button onClick={fetchLeads} className="bg-[#111111] border border-[#333333] hover:bg-[#1A1A1A] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center">
                    <Activity className="w-3 h-3 mr-2" /> Refresh
                  </button>
                </div>

                <div className="bg-[#111111] rounded-lg border border-[#222222] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#0A0A0A] text-[#888888] uppercase text-[10px] tracking-widest border-b border-[#222222]">
                          <th className="px-5 py-3 font-semibold w-1/4">Business Info</th>
                          <th className="px-5 py-3 font-semibold w-1/4">Web & Social Data</th>
                          <th className="px-5 py-3 font-semibold w-1/3">AI Generation</th>
                          <th className="px-5 py-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222222]">
                        {leads.map((lead) => (
                          <tr key={lead.lead_id} className="hover:bg-[#151515] transition-colors group">
                            
                            {/* COL 1: Business Info */}
                            <td className="px-5 py-5 align-top">
                              <div className="font-semibold text-white text-base leading-tight mb-1">{lead.business_name}</div>
                              <div className="text-xs text-[#A1A1AA] flex items-center gap-1.5 mb-3">
                                <Building2 className="w-3 h-3 opacity-70" /> {lead.category} • {lead.city}
                              </div>
                              
                              <div className="inline-flex items-center gap-1.5 bg-[#1A1A1A] border border-[#333333] rounded px-2 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{lead.lead_tier} • {lead.lead_score}</span>
                              </div>
                              <div className="text-[11px] text-[#666666] mt-2 leading-snug">
                                {lead.qualification_reason}
                              </div>
                            </td>

                            {/* COL 2: Web & Social Data */}
                            <td className="px-5 py-5 align-top">
                              <div className="space-y-2.5">
                                <div className="flex items-center gap-2 text-xs">
                                  <Phone className="w-3.5 h-3.5 text-[#666666]" />
                                  <span className={lead.phone ? "text-[#EDEDED]" : "text-[#444444] italic"}>
                                    {lead.phone || "N/A"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <Globe className="w-3.5 h-3.5 text-[#666666]" />
                                  {lead.website_url ? (
                                    <a href={lead.website_url} target="_blank" rel="noreferrer" className="text-white hover:underline truncate max-w-[150px]">
                                      {lead.website_url.replace(/^https?:\/\/(www\.)?/, '')}
                                    </a>
                                  ) : (
                                    <span className="text-[#444444] italic">N/A</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <Instagram className="w-3.5 h-3.5 text-[#666666]" />
                                  <span className={lead.instagram ? "text-[#EDEDED]" : "text-[#444444] italic"}>
                                    {lead.instagram || "N/A"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <Facebook className="w-3.5 h-3.5 text-[#666666]" />
                                  <span className={lead.facebook ? "text-[#EDEDED]" : "text-[#444444] italic"}>
                                    {lead.facebook || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* COL 3: AI Generated Pitch */}
                            <td className="px-5 py-5 align-top">
                              {lead.email_message ? (
                                <div className="space-y-3">
                                  {/* Demo URL Badge */}
                                  {lead.demo_url && (
                                    <a href={lead.demo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-[#1A1A1A] text-white border border-[#333333] hover:bg-[#222222] px-2 py-1 rounded transition-colors">
                                      <LinkIcon className="w-3 h-3" /> View Preview Demo
                                    </a>
                                  )}

                                  <div className="bg-[#0A0A0A] border border-[#222222] rounded p-3">
                                    <div className="text-[10px] text-[#666666] mb-1.5 flex items-center gap-1 font-bold uppercase tracking-widest">
                                      <Mail className="w-3 h-3" /> AI Email Draft
                                    </div>
                                    <div className="text-xs text-[#A1A1AA] line-clamp-3 leading-relaxed">
                                      {lead.email_message}
                                    </div>
                                  </div>
                                  
                                  {lead.whatsapp_message && (
                                    <div className="bg-[#0A0A0A] border border-[#222222] rounded p-3">
                                      <div className="text-[10px] text-[#666666] mb-1.5 flex items-center gap-1 font-bold uppercase tracking-widest">
                                        <MessageSquare className="w-3 h-3" /> WhatsApp Draft
                                      </div>
                                      <div className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                                        {lead.whatsapp_message}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[#666666] text-xs italic">Awaiting AI generation...</span>
                              )}
                            </td>

                            {/* COL 4: Action */}
                            <td className="px-5 py-5 align-middle text-right">
                              <button
                                onClick={() => approveLead(lead.lead_id)}
                                disabled={approving === lead.lead_id || !lead.email_message}
                                className={`inline-flex items-center justify-center px-4 py-2 font-medium text-xs rounded-md transition-all ${
                                  !lead.email_message 
                                    ? "bg-[#111111] text-[#444444] border border-[#222222] cursor-not-allowed"
                                    : approving === lead.lead_id
                                    ? "bg-[#333333] text-[#888888] cursor-not-allowed"
                                    : "bg-white text-black hover:bg-[#E5E5E5] shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                }`}
                              >
                                {approving === lead.lead_id ? (
                                  <Activity className="w-3 h-3 mr-2 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3 mr-2" />
                                )}
                                {approving === lead.lead_id ? "Sending..." : "Approve"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
