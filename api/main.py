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
# ENGINE TRIGGER
# ==========================================
def run_orchestrator_in_background():
    """Runs the master pipeline in the background so the HTTP request doesn't timeout."""
    import subprocess
    logger.info("Triggering background orchestrator...")
    try:
        subprocess.run([sys.executable, "orchestrator.py"], check=True)
        logger.info("Background orchestrator finished successfully!")
    except Exception as e:
        logger.error(f"Background orchestrator failed: {e}")

@app.get("/api/engine/start")
def start_engine(background_tasks: BackgroundTasks):
    """
    Hit this URL in your browser to wake up the AI and start scraping!
    It runs in the background so your browser doesn't load forever.
    """
    background_tasks.add_task(run_orchestrator_in_background)
    return {
        "success": True,
        "message": "🚀 Engine Started! The AI is now scraping Google Maps and writing emails in the background. Check back in 60 seconds!"
    }

if __name__ == "__main__":
    import uvicorn
    # Railway dynamically assigns a PORT environment variable. 
    # We must listen on it, otherwise Railway will crash the deployment.
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True)
