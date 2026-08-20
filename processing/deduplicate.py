import difflib
from models import Lead, LeadStatus
from database import Database
from utils.logger import get_logger
from processing.normalize import normalize_business_name, normalize_phone, normalize_url, normalize_address

logger = get_logger(__name__)

def calculate_quality_score(lead: dict) -> float:
    """Calculates quality score (0-100) based on lead data presence."""
    score = 0.0
    if lead.get('phone'): score += 20
    if lead.get('website_url'): score += 20
    if lead.get('address'): score += 20
    if lead.get('rating') and float(lead.get('rating', 0)) > 0: score += 10
    if lead.get('email'): score += 15
    if lead.get('review_count') and int(lead.get('review_count', 0)) >= 10: score += 15
    return min(100.0, score)

def is_similar(str1: str, str2: str, threshold: float = 0.85) -> bool:
    if not str1 or not str2:
        return False
    return difflib.SequenceMatcher(None, str1, str2).ratio() >= threshold

def deduplicate_and_score_leads():
    db = Database()
    leads = db.get_all_leads()
    
    if not leads:
        logger.info("No leads to process.")
        return []

    processed = []
    
    # We will keep track of unique leads to compare against
    for row in leads:
        lead_dict = dict(row)
        
        # Calculate quality score for internal logic, but don't overwrite lead_score
        quality_score = calculate_quality_score(lead_dict)
        
        # If it's already marked as DUPLICATE, keep it as is?
        # Let's process all DISCOVERED leads and check duplicates
        if lead_dict['status'] == LeadStatus.DUPLICATE.value:
            processed.append(lead_dict)
            continue
            
        norm_name = normalize_business_name(lead_dict.get('business_name', ''))
        norm_phone = normalize_phone(lead_dict.get('phone', ''))
        norm_url = normalize_url(lead_dict.get('website_url', ''))
        norm_addr = normalize_address(lead_dict.get('address', ''))
        
        is_duplicate = False
        duplicate_reason = ""
        
        # Simple duplicate check against already processed in this batch
        # For a real system, we'd query the DB for matches
        for p in processed:
            if p['status'] == LeadStatus.DUPLICATE.value:
                continue
                
            # Rule 1: Same phone number (and valid)
            if norm_phone and norm_phone == normalize_phone(p.get('phone', '')):
                is_duplicate = True
                duplicate_reason = f"Duplicate phone with {p['business_name']}"
                break
                
            # Rule 2: Same website (and valid)
            if norm_url and norm_url == normalize_url(p.get('website_url', '')):
                is_duplicate = True
                duplicate_reason = f"Duplicate website with {p['business_name']}"
                break
                
            # Rule 3: Very similar name AND same address
            if norm_addr and norm_addr == normalize_address(p.get('address', '')):
                if is_similar(norm_name, normalize_business_name(p.get('business_name', ''))):
                    is_duplicate = True
                    duplicate_reason = f"Similar name & same address with {p['business_name']}"
                    break
        
        if is_duplicate:
            lead_dict['status'] = LeadStatus.DUPLICATE.value
            lead_dict['error_log'] = duplicate_reason
            logger.info(f"DUPLICATE FOUND: {lead_dict['business_name']} -> {duplicate_reason}")
        else:
            lead_dict['status'] = LeadStatus.VERIFIED.value # Mark as ready for next phase
            
        # Save to DB
        try:
            status_enum = LeadStatus(lead_dict['status'])
        except ValueError:
            status_enum = LeadStatus.DISCOVERED
            
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
            lead_score=lead_dict.get('lead_score', 0.0),
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
        # Force the original lead_id instead of generating a new one
        updated_lead.lead_id = lead_dict['lead_id']
        
        db.insert_or_update_lead(updated_lead)
        
    return processed

def main():
    logger.info("Starting normalization and deduplication process...")
    results = deduplicate_and_score_leads()
    print("\nDeduplication & Scoring Results:")
    print("-" * 40)
    for res in results:
        # print specific ones to match the prompt's request for Vadodara restaurants
        if res.get('city') == 'Vadodara':
            print(f"Lead ID: {res['lead_id'][:8]}... | Name: {res['business_name'][:30]}")
            print(f"  Score: {res['lead_score']} | Status: {res['status']}")
    print("-" * 40)
    print(f"Total Leads Processed: {len(results)}")

if __name__ == "__main__":
    main()
