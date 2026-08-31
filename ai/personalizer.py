import time
import json
from groq import Groq
from models import Lead, LeadStatus
from database import Database
from utils.logger import get_logger
from config import config

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a professional web design consultant in India. Generate concise, natural outreach messages. Use only the provided business data. Never invent services, prices, awards, menu items, or facts not present in the input. Keep messages short and human. Your response must be purely a valid JSON object without any markdown wrapping or extra text."""

def generate_messages_mock(lead_data: dict) -> dict:
    """Mock generator for testing without an API key."""
    status = lead_data['website_status']
    name = lead_data['business_name']
    
    if status == 'NO_WEBSITE':
        hook = "Having a dedicated website could really help capture more local searches."
    elif status == 'BROKEN_WEBSITE':
        hook = "I noticed your site seems to be down."
    elif status == 'SOCIAL_ONLY':
        hook = "I see you're active on Instagram - a website could help customers find you faster."
    else:
        hook = "A fresh website could help you stand out."
        
    email_subj = f"Quick question about {name}'s online presence"
    email_body = f"Hi Team,\n\n{hook} We specialize in building fast, modern websites for businesses in {lead_data['city']}. Check out this demo we put together for you: {{{{DEMO_URL}}}}\n\nLet me know if you'd be open to a quick chat.\n\nBest,\nHimanshu"
    
    whatsapp = f"Hi {name} team! I noticed your site seems to be down. Check out a quick concept we made for you here: {{{{DEMO_URL}}}} Are you open to a brief chat about upgrading your online presence?"
    
    return {
        "email_subject": email_subj,
        "email_body": email_body,
        "whatsapp_message": whatsapp
    }

def generate_messages_groq(client: Groq, lead_data: dict) -> dict:
    """Uses Groq API to generate personalized messages."""
    
    prompt_data = f"""
Business Name: {lead_data['business_name']}
City: {lead_data['city']}
Category: {lead_data['category']}
Phone: {lead_data['phone']}
Website Status: {lead_data['website_status']}
Rating: {lead_data['rating']}
Reviews: {lead_data['review_count']}
Instagram: {lead_data['instagram']}
Facebook: {lead_data['facebook']}

Instructions:
1. Generate an Email and a WhatsApp message.
2. Email format: Subject line (max 8 words), Body (max 120 words, professional Hindi-English mix is fine).
3. WhatsApp format: Max 80 words, casual but professional, ends with one clear question. Do not use any emojis.
4. If website_status is NO_WEBSITE: focus on opportunity, not failure.
5. If BROKEN_WEBSITE: mention "I noticed your site seems to be down".
6. If SOCIAL_ONLY: mention "I see you're active on Instagram - a website could help customers find you faster".
7. Add demo_url placeholder exactly as: {{DEMO_URL}} in both messages.

Output format MUST be a pure JSON object with these exact keys: "email_subject", "email_body", "whatsapp_message". Do not include any other text or markdown block backticks.
"""
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_data}
            ],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=500
        )
        
        content = response.choices[0].message.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())
    except Exception as e:
        logger.error(f"Groq API Error for {lead_data['business_name']}: {e}")
        logger.info("Falling back to local mock generator due to API error...")
        return generate_messages_mock(lead_data)

def process_leads(limit=50):
    db = Database()
    all_leads = db.get_all_leads()
    
    # Get leads that need personalization (QUALIFIED, SCORED, or missing email_message) and are not duplicate
    leads = [
        dict(l) for l in all_leads 
        if dict(l).get('status') != LeadStatus.DUPLICATE.value
        and (
            dict(l).get('status') in (LeadStatus.QUALIFIED.value, LeadStatus.SCORED.value, LeadStatus.VERIFIED.value)
            or not dict(l).get('email_message')
        )
    ]
    
    if not leads:
        logger.info("No leads found requiring personalization.")
        return []

    # Sort to get HOT leads first (score >= 70), then WARM (score >= 45), then by score descending
    leads.sort(key=lambda x: x.get('lead_score', 0.0), reverse=True)
    leads_to_process = leads[:limit]
    
    if not config.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY is missing. Using mock generator for testing.")
        client = None
    else:
        client = Groq(api_key=config.GROQ_API_KEY)
        
    processed = []
    
    for lead_dict in leads_to_process:
        logger.info(f"Personalizing messages for {lead_dict['business_name']} (Status: {lead_dict['website_status']})")
        
        if client:
            messages = generate_messages_groq(client, lead_dict)
            time.sleep(0.5) # Delay between API calls
        else:
            messages = generate_messages_mock(lead_dict)
            
        if not messages:
            logger.error(f"Failed to generate messages for {lead_dict['business_name']}")
            continue
            
        # Compile full email message with subject
        full_email = f"Subject: {messages.get('email_subject', '')}\n\n{messages.get('email_body', '')}"
        
        lead_dict['email_message'] = full_email
        lead_dict['whatsapp_message'] = messages.get('whatsapp_message', '')
        lead_dict['status'] = LeadStatus.PERSONALIZED.value
        
        # Save to DB
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
            status=LeadStatus.PERSONALIZED,
            created_at=lead_dict['created_at'],
            updated_at=lead_dict['updated_at'],
            error_log=lead_dict['error_log']
        )
        updated_lead.lead_id = lead_dict['lead_id']
        db.insert_or_update_lead(updated_lead)
        
        processed.append(lead_dict)
        logger.info(f"Successfully personalized and saved lead: {lead_dict['business_name']}")

    return processed

def main():
    logger.info("Starting AI Personalization Module on all qualified leads (up to 50)...")
    results = process_leads(limit=50)
    
    print("\nAI Generated Messages:")
    print("=" * 80)
    for res in results:
        print(f"Business: {res['business_name']} | Website Status: {res['website_status']}")
        print("-" * 40)
        print("EMAIL:")
        print(res['email_message'])
        print("-" * 40)
        print("WHATSAPP:")
        print(res['whatsapp_message'])
        print("=" * 80)

if __name__ == "__main__":
    main()
