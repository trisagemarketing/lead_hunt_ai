import time
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from serpapi import GoogleSearch
import re

from models import Lead, LeadStatus
from database import Database
from utils.logger import get_logger
from config import config

logger = get_logger(__name__)

SOCIAL_DOMAINS = ['facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'x.com']
DIRECTORY_DOMAINS = ['justdial.com', 'sulekha.com', 'indiamart.com', 'zomato.com', 'swiggy.com', 'dineout.co.in', 'magicpin.in']

def get_domain(url: str) -> str:
    if not url: return ""
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url
    try:
        netloc = urlparse(url).netloc.lower()
        if netloc.startswith('www.'):
            netloc = netloc[4:]
        return netloc
    except Exception:
        return ""

def classify_initial_url(url: str) -> str:
    domain = get_domain(url)
    if not domain:
        return "NO_WEBSITE"
    
    for s_dom in SOCIAL_DOMAINS:
        if s_dom in domain:
            return "SOCIAL_ONLY"
    
    for d_dom in DIRECTORY_DOMAINS:
        if d_dom in domain:
            return "DIRECTORY_ONLY"
            
    return "REAL_WEBSITE"

def serpapi_website_search(business_name: str, city: str) -> str:
    if not config.SERPAPI_KEY:
        return ""
    
    query = f"{business_name} {city} official website"
    params = {
      "engine": "google",
      "q": query,
      "api_key": config.SERPAPI_KEY
    }
    
    try:
        search = GoogleSearch(params)
        results = search.get_dict()
    except Exception as e:
        logger.error(f"SerpAPI search failed for {business_name}: {e}")
        return ""
        
    organic = results.get("organic_results", [])
    for res in organic:
        link = res.get("link", "")
        classification = classify_initial_url(link)
        if classification == "REAL_WEBSITE":
            return link
    return ""

def verify_website(url: str, business_name: str) -> str:
    """Makes an HTTP GET request to check the website"""
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url
        
    try:
        response = httpx.get(url, timeout=10.0, follow_redirects=True, verify=False)
        response.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.warning(f"HTTP Error {e.response.status_code} for {url}")
        return "BROKEN_WEBSITE"
    except httpx.RequestError as e:
        logger.warning(f"Request Error for {url}: {e}")
        return "BROKEN_WEBSITE"
    except Exception as e:
        logger.warning(f"Unexpected error for {url}: {e}")
        return "BROKEN_WEBSITE"
        
    # Check page title and visible content
    html_content = response.text
    soup = BeautifulSoup(html_content, 'html.parser')
    
    title = soup.title.string if soup.title and soup.title.string else ""
    # Extract some text to check
    body_text = soup.body.get_text(separator=' ', strip=True).lower() if soup.body else ""
    title_lower = title.lower()
    
    # Simple check if any part of the business name is in the title or body
    # This might need to be relaxed if the business name has generic words
    name_parts = [p.lower() for p in re.split(r'\W+', business_name) if len(p) > 2]
    
    matches = 0
    for part in name_parts:
        if part in title_lower or part in body_text:
            matches += 1
            
    if len(name_parts) == 0 or matches > 0:
        return "VALID_WEBSITE"
    else:
        # Site loaded but no mention of the business name -> might be parked domain
        return "DOMAIN_ONLY"

def process_leads_websites():
    db = Database()
    leads = db.get_all_leads()
    
    processed_count = 0
    
    for row in leads:
        lead_dict = dict(row)
        status = lead_dict.get('status')
        
        if status not in (LeadStatus.DISCOVERED.value, LeadStatus.ENRICHED.value):
            continue
            
        logger.info(f"Checking website for {lead_dict['business_name']} ({lead_dict['lead_id']})")
        
        website = lead_dict.get('website_url', '')
        classification = classify_initial_url(website)
        
        if classification in ("NO_WEBSITE", "SOCIAL_ONLY", "DIRECTORY_ONLY"):
            # Try to find a real website
            logger.info(f"No real website found. Searching via SerpAPI...")
            found_website = serpapi_website_search(lead_dict['business_name'], lead_dict['city'])
            time.sleep(1) # Delay between checks
            
            if found_website:
                logger.info(f"Found website via SerpAPI: {found_website}")
                website = found_website
                lead_dict['website_url'] = website
                classification = "REAL_WEBSITE"
            else:
                logger.info("No website found via secondary search.")
                if classification == "NO_WEBSITE":
                    lead_dict['website_status'] = "NO_WEBSITE"
                else:
                    lead_dict['website_status'] = classification
                    
        if classification == "REAL_WEBSITE":
            # Verify the real website
            verify_status = verify_website(website, lead_dict['business_name'])
            lead_dict['website_status'] = verify_status
            logger.info(f"Website Verification Result: {verify_status}")
            
        # Update status
        lead_dict['status'] = LeadStatus.VERIFIED.value
        
        # Save to DB
        try:
            status_enum = LeadStatus(lead_dict['status'])
        except ValueError:
            status_enum = LeadStatus.VERIFIED
            
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
        processed_count += 1
        
        # 1 second delay
        time.sleep(1)
        
    logger.info(f"Website checking complete. Processed {processed_count} leads.")

def main():
    logger.info("Starting Website Verification Module...")
    process_leads_websites()

if __name__ == "__main__":
    main()
