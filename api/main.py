import sys
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Add parent directory to path so we can import models and database
sys.path.append(str(Path(__file__).parent.parent))
from database import Database
from utils.logger import get_logger

logger = get_logger(__name__)

# Initialize Professional FastAPI App
app = FastAPI(
    title="LeadHunter AI Backend",
    description="JSON API connecting the Python Engine to the Next.js Frontend and n8n",
    version="1.0.0"
)

# ==========================================
# CORS SETUP (CRITICAL FOR NEXT.JS)
# ==========================================
# This allows your Next.js frontend (running on localhost:3000 or a live Vercel domain)
# to request data from this Python backend without being blocked by the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change to ["https://your-nextjs-app.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Database()

# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/")
def health_check():
    """Root endpoint to verify the API is alive on Railway."""
    return {
        "status": "online", 
        "message": "LeadHunter AI API is running perfectly on Railway!"
    }

@app.get("/api/leads")
def get_all_leads():
    """
    Fetch all leads for the Next.js Admin Dashboard.
    Automatically sorts them so HOT/High-score leads appear at the top.
    """
    leads_rows = db.get_all_leads()
    leads = [dict(row) for row in leads_rows]
    
    # Sort leads by score (descending)
    leads.sort(key=lambda x: x.get('lead_score', 0), reverse=True)
    
    return {
        "success": True, 
        "count": len(leads), 
        "data": leads
    }

@app.get("/api/leads/preview/{slug}")
def get_lead_by_slug(slug: str):
    """
    Fetch a specific lead by their URL slug. 
    Next.js will call this to render the dynamic Demo Landing Pages.
    """
    leads = db.get_all_leads()
    
    # Find the lead that matches the slug
    for row in leads:
        lead = dict(row)
        demo_url = lead.get('demo_url')
        if demo_url and demo_url.endswith(f"/{slug}"):
            return {"success": True, "data": lead}
            
    raise HTTPException(status_code=404, detail="Demo Landing Page not found")

# ==========================================
# N8N WEBHOOK TRIGGER (OUTREACH)
# ==========================================
class ApprovePayload(BaseModel):
    n8n_webhook_url: Optional[str] = None

@app.post("/api/leads/{lead_id}/approve")
def approve_and_send_lead(lead_id: str, payload: ApprovePayload = None):
    """
    Called when you click 'Approve & Send' on the Next.js Dashboard.
    This prepares the JSON payload and triggers your n8n workflow.
    """
    row = db.get_lead(lead_id)
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    lead = dict(row)
    return {
        "success": True, 
        "message": f"Lead '{lead['business_name']}' approved! Ready to dispatch to n8n.",
        "data": lead
    }

# ==========================================
# ENGINE TRIGGER & DEBUGGING
# ==========================================
# Global variable to store logs in memory (bypasses Railway read-only disk issues)
engine_debug_logs = "Engine has not been started yet."

def run_orchestrator_in_background(city: str, business_type: str):
    """Runs the master pipeline and saves the output to memory for debugging."""
    global engine_debug_logs
    import subprocess
    import traceback
    import sys
    
    logger.info(f"Triggering background orchestrator for {business_type} in {city}...")
    engine_debug_logs = f"--- ENGINE STARTING ({business_type} in {city}) ---\n"
    
    try:
        process = subprocess.Popen(
            [sys.executable, "-u", "orchestrator.py", "--city", city, "--business-type", business_type],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        for line in iter(process.stdout.readline, ''):
            engine_debug_logs += line
            
        process.stdout.close()
        process.wait()
        
        engine_debug_logs += f"\n--- ENGINE FINISHED WITH CODE {process.returncode} ---\n"
    except Exception as e:
        engine_debug_logs += f"\n--- FATAL ERROR ---\n{traceback.format_exc()}\n"

class EngineRequest(BaseModel):
    city: str
    business_type: str

@app.post("/api/engine/start")
def start_engine(request: EngineRequest, background_tasks: BackgroundTasks):
    """
    Hit this URL in your browser to wake up the AI and start scraping!
    """
    background_tasks.add_task(run_orchestrator_in_background, request.city, request.business_type)
    return {
        "success": True,
        "message": f"Engine Started! Searching for {request.business_type} in {request.city}. Check /api/engine/logs to see live progress."
    }

from fastapi.responses import PlainTextResponse

@app.get("/api/engine/logs", response_class=PlainTextResponse)
def get_engine_logs():
    """Read the exact output of the background task to see why it failed."""
    global engine_debug_logs
    return engine_debug_logs

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True)
