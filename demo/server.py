from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
import sys

# Add parent directory to path so we can import modules
sys.path.append(str(Path(__file__).parent.parent))
from database import Database

app = FastAPI()

# Set up templates directory
templates_dir = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(templates_dir))

db = Database()

@app.get("/dashboard", response_class=HTMLResponse)
async def admin_dashboard(request: Request):
    leads_rows = db.get_all_leads()
    leads = [dict(row) for row in leads_rows]
    
    # Sort leads by score (descending)
    leads.sort(key=lambda x: x.get('lead_score', 0), reverse=True)
    
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={"leads": leads}
    )

@app.get("/preview/{slug}", response_class=HTMLResponse)
async def serve_preview(request: Request, slug: str):
    leads = db.get_all_leads()
    lead_data = None
    
    # We don't store the slug in the DB directly, so we reconstruct it to find the lead
    # OR we can just check if the URL matches demo_url
    for row in leads:
        lead = dict(row)
        demo_url = lead.get('demo_url')
        if demo_url and demo_url.endswith(f"/preview/{slug}"):
            lead_data = lead
            break
            
    if not lead_data:
        # Fallback: maybe the slug is actually a lead_id passed as a fallback query param
        lead_id = request.query_params.get("lead_id")
        if lead_id:
            row = db.get_lead(lead_id)
            if row:
                lead_data = dict(row)
                
    if not lead_data:
        raise HTTPException(status_code=404, detail="Demo not found")
        
    return templates.TemplateResponse(
        request=request,
        name="preview.html", 
        context={
            "business_name": lead_data.get('business_name', ''),
            "city": lead_data.get('city', ''),
            "category": lead_data.get('category', ''),
            "phone": lead_data.get('phone', ''),
            "address": lead_data.get('address', ''),
            "rating": lead_data.get('rating', '')
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("demo.server:app", host="0.0.0.0", port=8000, reload=True)
