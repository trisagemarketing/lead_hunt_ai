import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
    GOOGLE_CREDS_PATH = os.getenv("GOOGLE_CREDS_PATH", "./google_creds.json")
    SENDER_EMAIL = os.getenv("SENDER_EMAIL")
    SENDER_NAME = os.getenv("SENDER_NAME")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
    DEMO_BASE_URL = os.getenv("DEMO_BASE_URL")
    DRY_RUN = os.getenv("DRY_RUN", "true").lower() == "true"
    MAX_LEADS = int(os.getenv("MAX_LEADS", 10))
    DB_PATH = os.getenv("DB_PATH", "leads.db")
    DATABASE_URL = os.getenv("DATABASE_URL") # Provided by Railway Postgres
    SERPAPI_KEY = os.getenv("SERPAPI_KEY")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    DEMO_BASE_URL = os.getenv("DEMO_BASE_URL", "http://localhost:8000/preview")

config = Config()
