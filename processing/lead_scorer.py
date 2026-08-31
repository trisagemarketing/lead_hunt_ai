from models import Lead, LeadStatus
from database import Database
from utils.logger import get_logger
import re

logger = get_logger(__name__)

def score_lead(lead_dict: dict) -> tuple[float, str, str, str]:
    """
    Scores the lead based on Website and Business signals.
    Returns (score, tier, qualification_reason, new_status)
    """
    score = 0.0
    reasons = []
    
    # 1. Website signals
    website_status = lead_dict.get('website_status', '')
    if website_status == 'NO_WEBSITE':
        score += 40
        reasons.append("NO_WEBSITE (+40)")
    elif website_status == 'BROKEN_WEBSITE':
        score += 35
        reasons.append("BROKEN_WEBSITE (+35)")
    elif website_status == 'SOCIAL_ONLY':
        score += 30
        reasons.append("SOCIAL_ONLY (+30)")
    elif website_status == 'DIRECTORY_ONLY':
        score += 28
        reasons.append("DIRECTORY_ONLY (+28)")
    elif website_status == 'DOMAIN_ONLY':
        score += 20
        reasons.append("DOMAIN_ONLY (+20)")
    elif website_status == 'VALID_WEBSITE':
        score += 0
        reasons.append("VALID_WEBSITE (0 - skip as lead)")
    
    # 2. Business signals
    if lead_dict.get('phone'):
        score += 15
        reasons.append("Has phone (+15)")
        
    if lead_dict.get('email'):
        score += 10
        reasons.append("Has email (+10)")
        
    rating = float(lead_dict.get('rating', 0.0) or 0.0)
    reviews = int(lead_dict.get('review_count', 0) or 0)
    
    if rating >= 4.0 and reviews >= 20:
        score += 15
        reasons.append(f"Rating {rating} with {reviews} reviews (+15)")
    elif 3.0 <= rating < 4.0 and reviews > 0:
        score += 8
        reasons.append(f"Rating {rating} with {reviews} reviews (+8)")
        
    if lead_dict.get('instagram'):
        score += 5
        reasons.append("Has Instagram (+5)")
        
    # Category check
    category = (lead_dict.get('category') or '').lower()
    target_categories = ['restaurant', 'hotel', 'clinic', 'salon', 'gym', 'shop']
    
    # Simple check if any target keyword is in the category string
    if any(target in category for target in target_categories):
        score += 10
        reasons.append(f"Category matches target ({category}) (+10)")
        
    # Assign tier
    if score >= 70:
        tier = "HOT"
        new_status = LeadStatus.QUALIFIED.value
    elif 45 <= score <= 69:
        tier = "WARM"
        new_status = LeadStatus.QUALIFIED.value
    else:
        tier = "LOW"
        new_status = LeadStatus.SCORED.value # Stop here, mark as scored so we don't re-process
        
    qualification_reason = ", ".join(reasons)
    
    return score, tier, qualification_reason, new_status

def run_lead_scorer():
    db = Database()
    all_leads = db.get_all_leads()
    
    leads = [
        dict(row) for row in all_leads 
        if dict(row).get('status') != LeadStatus.DUPLICATE.value
        and (
            dict(row).get('status') in (LeadStatus.VERIFIED.value, LeadStatus.DISCOVERED.value, LeadStatus.ENRICHED.value)
            or dict(row).get('lead_score', 0.0) == 0.0
        )
    ]
    
    if not leads:
        logger.info("No leads found that need scoring.")
        return []

    processed = []
    
    for row in leads:
        lead_dict = dict(row)
        
        score, tier, reason, new_status = score_lead(lead_dict)
        
        lead_dict['lead_score'] = score
        lead_dict['lead_tier'] = tier
        lead_dict['qualification_reason'] = reason
        lead_dict['status'] = new_status
        
        logger.info(f"Scored {lead_dict['business_name']} ({lead_dict['lead_id']}): Score={score}, Tier={tier}")
        
        # Save to DB
        try:
            status_enum = LeadStatus(lead_dict['status'])
        except ValueError:
            status_enum = LeadStatus.SCORED
            
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
    logger.info("Starting Lead Scoring Module...")
    results = run_lead_scorer()
    
    print("\nLead Scoring Results:")
    print("-" * 80)
    for res in results:
        print(f"Name: {res['business_name'][:30]}")
        print(f"Tier: {res['lead_tier']} (Score: {res['lead_score']}) | Status: {res['status']}")
        print(f"Reason: {res['qualification_reason']}")
        print("-" * 80)
        
    print(f"Total Leads Scored: {len(results)}")

if __name__ == "__main__":
    main()
