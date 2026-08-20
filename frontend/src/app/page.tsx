"use client";

import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle, Mail, Send, Activity, MessageSquare } from "lucide-react";

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  // Engine State
  const [city, setCity] = useState("Vadodara");
  const [category, setCategory] = useState("restaurants");
  const [startingEngine, setStartingEngine] = useState(false);

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
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <Activity className="text-emerald-500" /> LeadHunter AI
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">Mission Control: Approval & Outreach Pipeline</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg shadow-sm">
            <span className="text-zinc-400">Total Pipeline:</span>{" "}
            <span className="text-emerald-400 font-bold text-lg">{leads.length} Leads</span>
          </div>
        </div>

        {/* --- CONTROL PANEL --- */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl p-6 mb-8 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">City</label>
            <input 
              type="text" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Business Category</label>
            <input 
              type="text" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button 
            onClick={startEngine}
            disabled={startingEngine}
            className={`px-6 py-3 font-bold rounded-lg shadow flex items-center transition-all ${
              startingEngine ? "bg-indigo-600/50 text-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {startingEngine ? <Activity className="w-5 h-5 mr-2 animate-spin" /> : <Activity className="w-5 h-5 mr-2" />}
            {startingEngine ? "Igniting..." : "Start Engine"}
          </button>
        </div>
        {/* ------------------- */}

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
                    <td className="p-4 align-top">
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

                    <td className="p-4 align-top">
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

                    <td className="p-4 align-top max-w-md">
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
                        disabled={approving === lead.lead_id}
                        className={`inline-flex items-center justify-center px-4 py-2 font-semibold text-sm rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/50 ${
                          approving === lead.lead_id
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
    </div>
  );
}
