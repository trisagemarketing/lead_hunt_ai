import sys
import os
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass
import sys
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import httpx

# Add parent directory to path so we can import models and database
sys.path.append(str(Path(__file__).parent.parent))
from database import Database
from utils.logger import get_logger

logger = get_logger(__name__)

# Initialize Professional FastAPI App
app = FastAPI(
    title="LeadHunter AI Backend",
    description="Enterprise API connecting the Python Autonomous Pipeline to the Next.js SaaS Dashboard and n8n",
    version="2.0.0"
)

# ==========================================
# CORS SETUP (PRODUCTION READY)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Database()

# Global state for engine monitoring
engine_debug_logs = "Engine has not been started yet."
engine_is_running = False
engine_current_phase = "IDLE"
engine_progress_percent = 0

# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/")
def health_check():
    """Root health check endpoint."""
    return {
        "status": "online", 
        "version": "2.0.0",
        "service": "LeadHunter AI Engine",
        "message": "LeadHunter AI API is running perfectly!"
    }

@app.get("/api/stats")
def get_dashboard_stats():
    """
    Returns aggregated metrics across all discovered leads for real-time dashboard cards.
    """
    leads_rows = db.get_all_leads()
    leads = [dict(row) for row in leads_rows]
    
    total = len(leads)
    hot = sum(1 for l in leads if l.get('lead_tier') == 'HOT')
    warm = sum(1 for l in leads if l.get('lead_tier') == 'WARM')
    low = sum(1 for l in leads if l.get('lead_tier') == 'LOW')
    no_website = sum(1 for l in leads if l.get('website_status') in ('NO_WEBSITE', 'BROKEN_WEBSITE', 'SOCIAL_ONLY'))
    demo_ready = sum(1 for l in leads if l.get('demo_url') or l.get('demo_status') == 'READY')
    pending_approval = sum(1 for l in leads if l.get('email_message') and l.get('lead_tier') == 'HOT')
    duplicates = sum(1 for l in leads if l.get('status') == 'DUPLICATE')
    
    # Calculate unique campaigns
    campaigns_map = {}
    for l in leads:
        c_city = l.get('city') or 'Unknown'
        c_cat = l.get('category') or 'General'
        key = f"{c_city.strip().title()}|{c_cat.strip().title()}"
        if key not in campaigns_map:
            campaigns_map[key] = {
                "city": c_city.strip().title(),
                "category": c_cat.strip().title(),
                "count": 0,
                "hot_count": 0,
                "last_active": l.get('created_at', '')
            }
        campaigns_map[key]["count"] += 1
        if l.get('lead_tier') == 'HOT':
            campaigns_map[key]["hot_count"] += 1
            
    campaigns = sorted(list(campaigns_map.values()), key=lambda x: x['count'], reverse=True)
    
    return {
        "success": True,
        "metrics": {
            "total_leads": total,
            "hot_leads": hot,
            "warm_leads": warm,
            "low_leads": low,
            "no_website_leads": no_website,
            "demo_ready_leads": demo_ready,
            "pending_approval": pending_approval,
            "duplicate_leads": duplicates
        },
        "campaigns": campaigns
    }

@app.get("/api/leads")
def get_all_leads(
    city: Optional[str] = None,
    category: Optional[str] = None,
    tier: Optional[str] = None,
    search: Optional[str] = None,
    limit: Optional[int] = Query(default=1000, le=5000),
    offset: Optional[int] = Query(default=0, ge=0)
):
    """
    Fetch leads with optional filters, search queries, and sorting.
    Automatically sorts so HOT/High-score leads appear at the top.
    """
    leads_rows = db.get_all_leads()
    leads = [dict(row) for row in leads_rows]
    
    total_in_db = len(leads)
    
    # Apply city filter
    if city and city.strip():
        c_filter = city.strip().lower()
        leads = [l for l in leads if (l.get('city') or '').strip().lower() == c_filter]
        
    # Apply category filter
    if category and category.strip():
        cat_filter = category.strip().lower()
        leads = [l for l in leads if cat_filter in (l.get('category') or '').strip().lower()]
        
    # Apply tier filter
    if tier and tier.strip():
        t_filter = tier.strip().upper()
        leads = [l for l in leads if (l.get('lead_tier') or '').strip().upper() == t_filter]
        
    # Apply global search query
    if search and search.strip():
        q = search.strip().lower()
        leads = [
            l for l in leads
            if q in (l.get('business_name') or '').lower()
            or q in (l.get('category') or '').lower()
            or q in (l.get('city') or '').lower()
            or q in (l.get('phone') or '').lower()
            or q in (l.get('website_url') or '').lower()
            or q in (l.get('qualification_reason') or '').lower()
        ]
        
    # Sort leads by score (descending)
    leads.sort(key=lambda x: x.get('lead_score', 0.0) or 0.0, reverse=True)
    
    filtered_total = len(leads)
    paginated_leads = leads[offset : offset + limit]
    
    # Calculate unique campaigns for frontend dropdowns
    campaigns_map = {}
    for l in [dict(row) for row in leads_rows]:
        c_city = l.get('city') or 'Unknown'
        c_cat = l.get('category') or 'General'
        key = f"{c_city.strip().title()}|{c_cat.strip().title()}"
        if key not in campaigns_map:
            campaigns_map[key] = {
                "city": c_city.strip().title(),
                "category": c_cat.strip().title(),
                "count": 0,
                "hot_count": 0
            }
        campaigns_map[key]["count"] += 1
        if l.get('lead_tier') == 'HOT':
            campaigns_map[key]["hot_count"] += 1
            
    campaigns = sorted(list(campaigns_map.values()), key=lambda x: x['count'], reverse=True)
    
    return {
        "success": True, 
        "total_results": total_in_db,
        "filtered_count": filtered_total,
        "returned_count": len(paginated_leads),
        "offset": offset,
        "limit": limit,
        "campaigns": campaigns,
        "data": paginated_leads
    }

@app.get("/api/leads/preview/{slug}")
def get_lead_by_slug(slug: str):
    """
    Fetch a specific lead by their URL slug for dynamic Demo Landing Pages.
    """
    leads = db.get_all_leads()
    for row in leads:
        lead = dict(row)
        demo_url = lead.get('demo_url') or ''
        if demo_url.endswith(f"/{slug}") or lead.get('lead_id') == slug:
            return {"success": True, "data": lead}
            
    raise HTTPException(status_code=404, detail=f"Demo Landing Page '{slug}' not found")

# ==========================================
# N8N WEBHOOK TRIGGER (OUTREACH)
# ==========================================
class ApprovePayload(BaseModel):
    n8n_webhook_url: Optional[str] = None

@app.post("/api/leads/{lead_id}/approve")
def approve_and_send_lead(lead_id: str, payload: Optional[ApprovePayload] = None):
    """
    Called when clicking 'Approve & Send' on the Dashboard.
    Dispatches the JSON payload directly to the n8n automation webhook.
    """
    row = db.get_lead(lead_id)
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    lead = dict(row)
    n8n_url = payload.n8n_webhook_url if payload and payload.n8n_webhook_url else os.environ.get("N8N_WEBHOOK_URL")
    
    if n8n_url:
        try:
            response = httpx.post(n8n_url, json=lead, timeout=8.0)
            response.raise_for_status()
            logger.info(f"Successfully dispatched lead {lead_id} to N8N webhook ({n8n_url}).")
            return {
                "success": True, 
                "message": f"Lead '{lead['business_name']}' successfully dispatched to n8n outreach workflow!",
                "data": lead
            }
        except Exception as e:
            logger.error(f"Failed to dispatch to n8n: {e}")
            raise HTTPException(status_code=502, detail=f"Failed to reach n8n workflow: {str(e)}")
    
    # Fallback simulated response if no webhook configured
    return {
        "success": True, 
        "message": f"Lead '{lead['business_name']}' approved! (Simulated - configure N8N_WEBHOOK_URL for live delivery)",
        "data": lead
    }

# ==========================================
# ENGINE TRIGGER & LIVE OBSERVABILITY
# ==========================================

def run_orchestrator_in_background(city: str, business_type: str, max_results: int = 50):
    """Runs the master pipeline and saves real-time output to memory."""
    global engine_debug_logs, engine_is_running, engine_current_phase, engine_progress_percent
    engine_is_running = True
    engine_progress_percent = 5
    engine_current_phase = "Initializing Pipeline"
    
    import subprocess
    import traceback
    import sys
    
    logger.info(f"Triggering background orchestrator: {business_type} in {city} (target={max_results})...")
    engine_debug_logs = f"--- ENGINE STARTING ({business_type} in {city}, target: {max_results}) ---\n"
    
    try:
        cmd = [
            sys.executable, "-u", "orchestrator.py", 
            "--city", city, 
            "--business-type", business_type, 
            "--max-results", str(max_results)
        ]
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        for line in iter(process.stdout.readline, ''):
            engine_debug_logs += line
            # Update stage estimation based on logs
            if "Phase 1: Discovery" in line:
                engine_current_phase = "Scraping Google Maps via SerpAPI"
                engine_progress_percent = 20
            elif "Phase 2A: Data Normalization" in line or "Phase 2B: Deduplication" in line:
                engine_current_phase = "Normalizing & Deduplicating Leads"
                engine_progress_percent = 40
            elif "Phase 3: Website Auditing" in line:
                engine_current_phase = "Auditing Websites & Online Presence"
                engine_progress_percent = 60
            elif "Phase 4: Lead Scoring Engine" in line:
                engine_current_phase = "Calculating Lead Quality & Scoring Tiers"
                engine_progress_percent = 75
            elif "Phase 5: AI Personalization" in line:
                engine_current_phase = "Generating AI Outreach Messages (Groq Llama-3)"
                engine_progress_percent = 90
            elif "Phase 6: Demo URL Generation" in line:
                engine_current_phase = "Creating Dynamic Concept Demos"
                engine_progress_percent = 95
            elif "PIPELINE FINISHED SUCCESSFULLY" in line:
                engine_current_phase = "Pipeline Complete"
                engine_progress_percent = 100
            
        process.stdout.close()
        process.wait()
        
        engine_debug_logs += f"\n--- ENGINE FINISHED WITH EXIT CODE {process.returncode} ---\n"
        engine_progress_percent = 100
        engine_current_phase = "Complete" if process.returncode == 0 else f"Failed (code {process.returncode})"
    except Exception as e:
        engine_debug_logs += f"\n--- FATAL ERROR ---\n{traceback.format_exc()}\n"
        engine_current_phase = f"Fatal Error: {str(e)}"
    finally:
        engine_is_running = False

class EngineRequest(BaseModel):
    city: str
    business_type: str
    max_results: Optional[int] = 50

@app.post("/api/engine/start")
def start_engine(request: EngineRequest, background_tasks: BackgroundTasks):
    """
    Starts the full autonomous Lead Hunter pipeline.
    """
    global engine_is_running
    if engine_is_running:
        return {
            "success": False,
            "message": "Engine is already running. Please wait for the current hunt to finish."
        }
    
    max_res = request.max_results or 50
    background_tasks.add_task(run_orchestrator_in_background, request.city, request.business_type, max_res)
    return {
        "success": True,
        "message": f"Engine Started! Hunting {max_res} {request.business_type} leads in {request.city}. Check /api/engine/logs for live progress."
    }

@app.get("/api/engine/status")
def get_engine_status():
    """
    Structured real-time status of the pipeline execution.
    """
    global engine_is_running, engine_current_phase, engine_progress_percent, engine_debug_logs
    return {
        "is_running": engine_is_running,
        "phase": engine_current_phase,
        "progress_percent": engine_progress_percent,
        "logs": engine_debug_logs
    }

@app.get("/api/engine/logs", response_class=PlainTextResponse)
def get_engine_logs():
    """Raw text output of the background task."""
    global engine_debug_logs
    return engine_debug_logs

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True)
