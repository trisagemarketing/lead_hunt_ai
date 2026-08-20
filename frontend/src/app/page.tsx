"use client";

import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle, Mail, Send, Activity, MessageSquare, LayoutDashboard, Search, Users, Settings, Bell, Menu } from "lucide-react";

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
        alert("Lead Approved! Triggering n8n Webhook...");
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
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Activity className="animate-spin text-emerald-500 w-8 h-8 mr-3" />
        <span className="text-lg font-medium">Loading AI Intelligence...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* --- LEFT SIDEBAR --- */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Activity className="text-emerald-500 w-6 h-6 mr-2" />
          <span className="text-xl font-bold tracking-tight text-white">LeadHunter AI</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("search")}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'search' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}
          >
            <Search className="w-5 h-5 mr-3" /> Find Leads
          </button>
          <button 
            onClick={() => setActiveTab("pipeline")}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pipeline' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}
          >
            <Users className="w-5 h-5 mr-3" /> Outreach Pipeline
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors">
            <Settings className="w-5 h-5 mr-3" /> Settings
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center md:hidden">
            <Menu className="w-6 h-6 text-zinc-400" />
            <span className="ml-4 text-lg font-bold">LeadHunter AI</span>
          </div>
          <div className="hidden md:flex text-sm font-medium text-zinc-400 capitalize">
            {activeTab.replace('-', ' ')}
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-zinc-400 hover:text-white relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border border-zinc-700"></div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">

            {/* TAB: FIND LEADS */}
            {activeTab === "search" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Lead Engine</h2>
                  <p className="text-zinc-400 mt-2">Target a specific city and niche. The AI will do the rest.</p>
                </div>
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl p-8 max-w-2xl">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-2">Target City</label>
                      <input 
                        type="text" 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Austin, TX"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-2">Business Category</label>
                      <input 
                        type="text" 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Roofers, Dentists, Restaurants"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                    </div>
                    <button 
                      onClick={startEngine}
                      disabled={startingEngine}
                      className={`w-full py-4 font-bold rounded-lg shadow-lg flex items-center justify-center text-lg transition-all ${
                        startingEngine ? "bg-emerald-600/50 text-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/20"
                      }`}
                    >
                      {startingEngine ? <Activity className="w-6 h-6 mr-3 animate-spin" /> : <Search className="w-6 h-6 mr-3" />}
                      {startingEngine ? "Igniting Cloud Engine..." : "Start Lead Discovery"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DASHBOARD (Simple Overview) */}
            {activeTab === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-bold text-white tracking-tight mb-8">Dashboard Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Leads Discovered</div>
                    <div className="text-4xl font-bold text-white">{leads.length}</div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">High Value (HOT)</div>
                    <div className="text-4xl font-bold text-emerald-400">
                      {leads.filter(l => l.lead_tier === 'HOT').length}
                    </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Outreach Pending</div>
                    <div className="text-4xl font-bold text-amber-400">
                      {leads.filter(l => l.email_message).length}
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveTab("pipeline")} className="text-emerald-500 hover:text-emerald-400 font-medium flex items-center">
                  View Full Pipeline <ExternalLink className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}

            {/* TAB: PIPELINE (The Table) */}
            {activeTab === "pipeline" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Outreach Pipeline</h2>
                    <p className="text-zinc-400 mt-1">Review AI-generated pitches and approve for sending.</p>
                  </div>
                  <button onClick={fetchLeads} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                    <Activity className="w-4 h-4 mr-2" /> Refresh Data
                  </button>
                </div>

                <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900/50 text-zinc-400 uppercase text-xs tracking-wider border-b border-zinc-800">
                          <th className="p-4 font-semibold">Business</th>
                          <th className="p-4 font-semibold">Intelligence</th>
                          <th className="p-4 font-semibold">Generated Pitch</th>
                          <th className="p-4 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {leads.map((lead) => (
                          <tr key={lead.lead_id} className="hover:bg-zinc-800/50 transition-colors">
                            <td className="p-4 align-top w-1/4">
                              <div className="font-bold text-white text-lg">{lead.business_name}</div>
                              <div className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {lead.category}
                              </div>
                              <div className="mt-3 flex gap-2">
                                {lead.demo_url && (
                                  <a
                                    href={lead.demo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/20 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" /> View Demo
                                  </a>
                                )}
                              </div>
                            </td>

                            <td className="p-4 align-top w-1/4">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className={`px-2 py-1 text-xs font-bold rounded-full ${
                                    lead.lead_tier === "HOT"
                                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                      : lead.lead_tier === "WARM"
                                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  }`}
                                >
                                  {lead.lead_tier} SCORE: {lead.lead_score}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-2 rounded border border-zinc-800">
                                {lead.qualification_reason}
                              </div>
                            </td>

                            <td className="p-4 align-top w-1/3">
                              {lead.email_message ? (
                                <div className="space-y-3">
                                  <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
                                    <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1 font-semibold uppercase">
                                      <Mail className="w-3 h-3" /> AI Email
                                    </div>
                                    <div className="text-sm text-zinc-300 line-clamp-3">
                                      {lead.email_message}
                                    </div>
                                  </div>
                                  
                                  {lead.whatsapp_message && (
                                    <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
                                      <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1 font-semibold uppercase">
                                        <MessageSquare className="w-3 h-3" /> AI WhatsApp
                                      </div>
                                      <div className="text-sm text-zinc-300 line-clamp-2">
                                        {lead.whatsapp_message}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-zinc-600 text-sm italic">No AI copy generated yet.</span>
                              )}
                            </td>

                            <td className="p-4 align-middle text-right">
                              <button
                                onClick={() => approveLead(lead.lead_id)}
                                disabled={approving === lead.lead_id || !lead.email_message}
                                className={`inline-flex items-center justify-center px-4 py-2 font-semibold text-sm rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/50 ${
                                  !lead.email_message 
                                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                    : approving === lead.lead_id
                                    ? "bg-emerald-600/50 text-emerald-200 cursor-not-allowed"
                                    : "bg-emerald-600 text-white hover:bg-emerald-500 hover:-translate-y-0.5"
                                }`}
                              >
                                {approving === lead.lead_id ? (
                                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 mr-2" />
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
