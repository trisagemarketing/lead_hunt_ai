import sys
import os
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass
import re
from models import Lead, LeadStatus
from database import Database
from utils.logger import get_logger
from config import config

logger = get_logger(__name__)

def generate_slug(business_name: str, city: str) -> str:
    """Generates a clean URL slug from business name and city."""
    raw = f"{business_name} {city}".lower()
    # Replace spaces with hyphens, remove special characters
    slug = re.sub(r'[^a-z0-9\s-]', '', raw)
    slug = re.sub(r'[\s]+', '-', slug)
    return slug.strip('-')

def run_url_generator():
    db = Database()
    all_leads = db.get_all_leads()
    
    # Target leads that are personalized or have outreach messages needing demo URLs
    leads = [
        dict(row) for row in all_leads
        if dict(row).get('status') != LeadStatus.DUPLICATE.value
        and (
            dict(row).get('status') in (LeadStatus.PERSONALIZED.value, LeadStatus.QUALIFIED.value)
            or (dict(row).get('email_message') and '{{DEMO_URL}}' in dict(row).get('email_message', ''))
            or not dict(row).get('demo_url')
        )
    ]
    
    if not leads:
        logger.info("No leads requiring Demo URL generation.")
        return []

    processed = []
    
    # Ensure DEMO_BASE_URL is set or provide a default
    base_url = getattr(config, 'DEMO_BASE_URL', None) or "http://localhost:8000"
    # Remove trailing slash if present
    if base_url.endswith('/'):
        base_url = base_url[:-1]
        
    for row in leads:
        lead_dict = dict(row)
        
        # 1. Generate slug and URLs
        slug = generate_slug(lead_dict['business_name'], lead_dict.get('city', ''))
        demo_url = f"{base_url}/{slug}"
        
        lead_dict['demo_url'] = demo_url
        lead_dict['demo_status'] = "READY"
        
        # 2. Replace {{DEMO_URL}} in messages
        email_msg = lead_dict.get('email_message', '')
        wa_msg = lead_dict.get('whatsapp_message', '')
        
        if '{{DEMO_URL}}' in email_msg:
            lead_dict['email_message'] = email_msg.replace('{{DEMO_URL}}', demo_url)
        if '{{DEMO_URL}}' in wa_msg:
            lead_dict['whatsapp_message'] = wa_msg.replace('{{DEMO_URL}}', demo_url)
            
        logger.info(f"Generated Demo URL for {lead_dict['business_name']}: {demo_url}")
        
        # Save to DB
        try:
            status_enum = LeadStatus(lead_dict['status'])
        except Exception:
            status_enum = LeadStatus.DEMO_READY
            
        updated_lead = Lead(
            business_name=lead_dict['business_name'],
            city=lead_dict['city'],
            phone=lead_dict['phone'],
            category=lead_dict['category'],
            address=lead_dict['address'],
            website_url=lead_dict['website_url'],
            website_status=lead_dict['website_status'],
            email=lead_dict['email'],
            instagram=lead_dict['instagram'],
            facebook=lead_dict['facebook'],
            lead_score=lead_dict['lead_score'],
            lead_tier=lead_dict['lead_tier'],
            qualification_reason=lead_dict['qualification_reason'],
            demo_url=lead_dict['demo_url'],
            demo_status=lead_dict['demo_status'],
            email_message=lead_dict['email_message'],
            whatsapp_message=lead_dict['whatsapp_message'],
            approval_status=lead_dict['approval_status'],
            email_status=lead_dict['email_status'],
            whatsapp_status=lead_dict['whatsapp_status'],
            source_url=lead_dict['source_url'],
            raw_data=lead_dict['raw_data'],
            rating=lead_dict['rating'],
            review_count=lead_dict['review_count'],
            google_maps_url=lead_dict['google_maps_url'],
            status=status_enum,
            created_at=lead_dict['created_at'],
            updated_at=lead_dict['updated_at'],
            error_log=lead_dict['error_log']
        )
        updated_lead.lead_id = lead_dict['lead_id']
        db.insert_or_update_lead(updated_lead)
        processed.append(lead_dict)

    return processed

def main():
    logger.info("Starting Demo URL Generator Module...")
    results = run_url_generator()
    
    print("\nDemo URLs Generated:")
    print("-" * 80)
    for res in results:
        print(f"Business: {res['business_name']}")
        print(f"URL: {res['demo_url']}")
        print("-" * 80)
    
    print(f"Total processed: {len(results)}")

if __name__ == "__main__":
    main()
