import re
from urllib.parse import urlparse

def normalize_business_name(name: str) -> str:
    """Normalizes business names (lowercase, remove Ltd/Pvt/Pvt.Ltd/&, strip whitespace)"""
    if not name:
        return ""
    name = name.lower()
    # Remove common suffixes and '&'
    name = re.sub(r'\b(ltd|pvt|pvt\.ltd|private limited|limited)\b', '', name)
    name = name.replace('&', 'and')
    # Remove non-alphanumeric characters except spaces
    name = re.sub(r'[^a-z0-9\s]', ' ', name)
    # Strip extra whitespace
    name = ' '.join(name.split())
    return name

def normalize_phone(phone: str) -> str:
    """Normalizes phone numbers (strip spaces, dashes, +91 prefix, keep 10 digits)"""
    if not phone:
        return ""
    # Strip all non-digit characters except '+'
    phone = re.sub(r'[^\d+]', '', phone)
    
    # Handle +91 or 91 or 0 prefix
    if phone.startswith('+91'):
        phone = phone[3:]
    elif phone.startswith('91') and len(phone) == 12:
        phone = phone[2:]
    elif phone.startswith('0') and len(phone) == 11:
        phone = phone[1:]
        
    # Keep only digits
    phone = re.sub(r'\D', '', phone)
    
    # Return 10 digits if possible
    if len(phone) >= 10:
        return phone[-10:]
    return phone

def normalize_url(url: str) -> str:
    """Normalizes website URLs (lowercase, remove www, remove trailing slash)"""
    if not url:
        return ""
    url = url.lower().strip()
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url
        
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc
        if netloc.startswith('www.'):
            netloc = netloc[4:]
        
        path = parsed.path
        if path.endswith('/'):
            path = path[:-1]
            
        normalized = netloc + path
        return normalized
    except Exception:
        return url

def normalize_address(address: str) -> str:
    """Normalizes addresses (lowercase, strip extra spaces)"""
    if not address:
        return ""
    address = address.lower()
    address = re.sub(r'[^a-z0-9\s,]', ' ', address)
    address = ' '.join(address.split())
    return address
