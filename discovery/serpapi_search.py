import sys
import os
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass
import argparse
import sys
from serpapi import GoogleSearch
from models import Lead, LeadStatus
from database import Database
from config import config
from utils.logger import get_logger

logger = get_logger(__name__)

def search_businesses(city: str, business_type: str, max_results: int = 10) -> dict:
    """
    Searches for businesses using SerpAPI Google Maps search.
    """
    logger.info(f"Starting business discovery:\ncity={city}\nbusiness_type={business_type}\nmax_results={max_results}")
    
    # Validate inputs
    if not city or not isinstance(city, str) or not city.strip():
        logger.error("Validation Error: city is required and must be a non-empty string.")
        return {"error": "Invalid city"}
    if not business_type or not isinstance(business_type, str) or not business_type.strip():
        logger.error("Validation Error: business_type is required and must be a non-empty string.")
        return {"error": "Invalid business_type"}
    if not isinstance(max_results, int) or max_results <= 0 or max_results > 1000:
        logger.error("Validation Error: max_results must be an integer between 1 and 1000.")
        return {"error": "Invalid max_results"}

    # Load SERPAPI_KEY
    if not config.SERPAPI_KEY:
        logger.error("SERPAPI_KEY is not configured.")
        return {"error": "SERPAPI_KEY is not configured."}

    # Clean and sanitize business_type for Google Maps search engine
    import re
    clean_type = re.sub(r'[\(\[\{].*?[\)\]\}]?', '', business_type).strip() or business_type
    clean_type = re.sub(r'[^a-zA-Z0-9\s]', ' ', clean_type).strip()
    query = f"{clean_type} in {city}".strip()
    logger.info(f"Sanitized Google Maps Search Query: '{query}'")
    
    # Pagination logic to fetch up to max_results
    db = Database()
    discovered = 0
    inserted = 0
    duplicates = 0
    
    start_index = 0
    
    while inserted < max_results:
        params = {
          "engine": "google_maps",
          "q": query,
          "api_key": config.SERPAPI_KEY,
          "start": start_index
        }
        
        try:
            search = GoogleSearch(params)
            results = search.get_dict()
        except Exception as e:
            logger.error(f"Network/Connection error during SerpAPI request: {e}")
            return {"error": f"Connection error: {e}"}

        if "error" in results:
            api_error = results["error"]
            if "rate limit" in api_error.lower() or "limit" in api_error.lower():
                 logger.error("SerpAPI rate limit reached (HTTP 429). Discovery stopped.")
                 return {"error": "HTTP 429 Rate Limit"}
            logger.error(f"SerpAPI Error: {api_error}")
            return {"error": api_error}

        local_results = results.get("local_results", [])
        if not local_results:
            logger.info("No more results returned from SerpAPI.")
            break
            
        discovered += len(local_results)
        
        for business in local_results:
            if inserted >= max_results:
                break
                
            business_name = business.get("title")
            if not business_name:
                continue
                
            phone = business.get("phone", "")
            
            lead = Lead(
                business_name=business_name,
                city=city,
                phone=phone,
                category=business.get("type", ""),
                address=business.get("address", ""),
                website_url=business.get("website", ""),
                rating=float(business.get("rating", 0.0)) if business.get("rating") else 0.0,
                review_count=int(business.get("reviews", 0)) if business.get("reviews") else 0,
                google_maps_url=business.get("gps_coordinates", {}).get("link", ""), 
                source_url="https://serpapi.com/search",
                status=LeadStatus.DISCOVERED
            )
            
            existing_lead = db.get_lead(lead.lead_id)
            if existing_lead:
                logger.info(f"Skipping duplicate lead: {lead.lead_id}")
                duplicates += 1
                continue
                
            try:
                db.insert_or_update_lead(lead)
                logger.info(f"Lead inserted: {lead.lead_id}")
                inserted += 1
            except Exception as e:
                logger.error(f"Failed to insert lead {lead.lead_id}: {e}")
                
        if inserted >= max_results or len(local_results) < 20:
            break
            
        start_index += 20

    logger.info(f"Search completed: discovered={discovered}, inserted={inserted}, duplicates={duplicates}")
    
    return {
        "city": city,
        "business_type": business_type,
        "discovered": discovered,
        "inserted": inserted,
        "duplicates": duplicates
    }

def main():
    parser = argparse.ArgumentParser(description="Business Discovery via SerpAPI")
    parser.add_argument("--city", required=True, help="City to search in")
    parser.add_argument("--business-type", required=True, help="Type of business (e.g., restaurants)")
    parser.add_argument("--max-results", type=int, default=10, help="Maximum number of new leads to insert")
    
    args = parser.parse_args()
    
    result = search_businesses(args.city, args.business_type, args.max_results)
    
    print("\nBusiness Discovery")
    print("------------------")
    print(f"City: {args.city}")
    print(f"Business Type: {args.business_type}")
    print(f"Requested: {args.max_results}\n")
    
    if "error" in result:
        print(f"Status: ERROR - {result['error']}")
    else:
        print(f"Discovered: {result.get('discovered', 0)}")
        print(f"Inserted: {result.get('inserted', 0)}")
        print(f"Duplicates: {result.get('duplicates', 0)}\n")
        print("Status: SUCCESS")

if __name__ == "__main__":
    main()
