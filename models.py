from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import hashlib

class LeadStatus(Enum):
    DISCOVERED = "DISCOVERED"
    ENRICHED = "ENRICHED"
    VERIFIED = "VERIFIED"
    QUALIFIED = "QUALIFIED"
    SCORED = "SCORED"
    PERSONALIZED = "PERSONALIZED"
    DEMO_READY = "DEMO_READY"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    SENT = "SENT"
    FAILED = "FAILED"
    DUPLICATE = "DUPLICATE"

@dataclass
class Lead:
    business_name: str
    city: str
    phone: str
    category: str = ""
    address: str = ""
    website_url: str = ""
    website_status: str = ""
    email: str = ""
    instagram: str = ""
    facebook: str = ""
    lead_score: float = 0.0
    lead_tier: str = ""
    qualification_reason: str = ""
    demo_url: str = ""
    demo_status: str = ""
    email_message: str = ""
    whatsapp_message: str = ""
    approval_status: str = ""
    email_status: str = ""
    whatsapp_status: str = ""
    source_url: str = ""
    raw_data: str = ""
    rating: float = 0.0
    review_count: int = 0
    google_maps_url: str = ""
    status: LeadStatus = LeadStatus.DISCOVERED
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    error_log: str = ""
    
    lead_id: str = field(init=False)

    def __post_init__(self):
        # Deterministic hash based on business_name + city + phone
        hash_input = f"{self.business_name.lower().strip()}_{self.city.lower().strip()}_{self.phone.strip()}"
        self.lead_id = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
