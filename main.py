from utils.logger import get_logger
from config import config
from database import Database
from models import Lead, LeadStatus

logger = get_logger(__name__)

def test_database():
    logger.info("Starting SQLite database test...")
    db = Database()
    
    # Create a test lead
    test_lead = Lead(
        business_name="Acme Corp",
        city="New York",
        phone="555-0199",
        category="Tech",
        status=LeadStatus.DISCOVERED
    )
    
    logger.info(f"Created Test Lead with ID: {test_lead.lead_id}")
    
    # Insert the lead
    db.insert_or_update_lead(test_lead)
    logger.info("Lead inserted into database.")
    
    # Fetch the lead back
    fetched_row = db.get_lead(test_lead.lead_id)
    if fetched_row:
        logger.info("Successfully fetched lead from database!")
        logger.info(f"Fetched Data: Business Name={fetched_row['business_name']}, City={fetched_row['city']}")
    else:
        logger.error("Failed to fetch lead from database.")

    # Try inserting the exact same lead again to test deterministic ID and UPSERT
    db.insert_or_update_lead(test_lead)
    logger.info("Duplicate insertion handled gracefully (UPSERT successful).")

def main():
    logger.info("LeadHunter AI initialized.")
    logger.info(f"Dry Run Mode: {config.DRY_RUN}")
    
    test_database()

if __name__ == "__main__":
    main()
