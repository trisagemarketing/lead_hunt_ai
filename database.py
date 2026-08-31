import sys
import os
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass
import sqlite3
import os
from typing import Optional
from models import Lead, LeadStatus
from utils.logger import get_logger
from config import config

logger = get_logger(__name__)

# Try importing psycopg2 for Postgres
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

class Database:
    def __init__(self):
        self.use_postgres = bool(config.DATABASE_URL) and HAS_POSTGRES
        if self.use_postgres:
            self.db_url = config.DATABASE_URL
            logger.info("Using PostgreSQL Database (Railway/Cloud).")
        else:
            self.db_path = config.DB_PATH
            logger.info("Using SQLite Database (Local).")
            
        self._create_tables()

    def get_connection(self):
        if self.use_postgres:
            return psycopg2.connect(self.db_url)
        else:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            return conn

    def _create_tables(self):
        query = """
        CREATE TABLE IF NOT EXISTS leads (
            lead_id TEXT PRIMARY KEY,
            business_name TEXT NOT NULL,
            category TEXT,
            city TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT,
            website_url TEXT,
            website_status TEXT,
            email TEXT,
            instagram TEXT,
            facebook TEXT,
            lead_score REAL,
            lead_tier TEXT,
            qualification_reason TEXT,
            demo_url TEXT,
            demo_status TEXT,
            email_message TEXT,
            whatsapp_message TEXT,
            approval_status TEXT,
            email_status TEXT,
            whatsapp_status TEXT,
            source_url TEXT,
            raw_data TEXT,
            status TEXT,
            created_at TEXT,
            updated_at TEXT,
            error_log TEXT,
            rating REAL,
            review_count INTEGER,
            google_maps_url TEXT
        )
        """
        try:
            conn = self.get_connection()
            if self.use_postgres:
                with conn.cursor() as cursor:
                    cursor.execute(query)
            else:
                conn.execute(query)
            conn.commit()
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise
        finally:
            if 'conn' in locals() and conn:
                conn.close()

    def insert_or_update_lead(self, lead: Lead):
        # Postgres uses %s for variables, SQLite uses ?
        placeholder = "%s" if self.use_postgres else "?"
        
        query = f"""
        INSERT INTO leads (
            lead_id, business_name, category, city, phone, address, website_url,
            website_status, email, instagram, facebook, lead_score, lead_tier,
            qualification_reason, demo_url, demo_status, email_message, whatsapp_message,
            approval_status, email_status, whatsapp_status, source_url, raw_data,
            status, created_at, updated_at, error_log, rating, review_count, google_maps_url
        ) VALUES (
            {", ".join([placeholder] * 30)}
        )
        ON CONFLICT(lead_id) DO UPDATE SET
            business_name=excluded.business_name,
            category=excluded.category,
            city=excluded.city,
            phone=excluded.phone,
            address=excluded.address,
            website_url=excluded.website_url,
            website_status=excluded.website_status,
            email=excluded.email,
            instagram=excluded.instagram,
            facebook=excluded.facebook,
            lead_score=excluded.lead_score,
            lead_tier=excluded.lead_tier,
            qualification_reason=excluded.qualification_reason,
            demo_url=excluded.demo_url,
            demo_status=excluded.demo_status,
            email_message=excluded.email_message,
            whatsapp_message=excluded.whatsapp_message,
            approval_status=excluded.approval_status,
            email_status=excluded.email_status,
            whatsapp_status=excluded.whatsapp_status,
            source_url=excluded.source_url,
            raw_data=excluded.raw_data,
            status=excluded.status,
            updated_at=excluded.updated_at,
            error_log=excluded.error_log,
            rating=excluded.rating,
            review_count=excluded.review_count,
            google_maps_url=excluded.google_maps_url
        """
        values = (
            lead.lead_id, lead.business_name, lead.category, lead.city, lead.phone, lead.address, lead.website_url,
            lead.website_status, lead.email, lead.instagram, lead.facebook, lead.lead_score, lead.lead_tier,
            lead.qualification_reason, lead.demo_url, lead.demo_status, lead.email_message, lead.whatsapp_message,
            lead.approval_status, lead.email_status, lead.whatsapp_status, lead.source_url, lead.raw_data,
            lead.status.value, lead.created_at, lead.updated_at, lead.error_log, lead.rating, lead.review_count, lead.google_maps_url
        )
        try:
            conn = self.get_connection()
            if self.use_postgres:
                with conn.cursor() as cursor:
                    cursor.execute(query, values)
            else:
                conn.execute(query, values)
            conn.commit()
            logger.debug(f"Lead {lead.lead_id} inserted/updated successfully.")
        except Exception as e:
            logger.error(f"Error inserting/updating lead {lead.lead_id}: {e}")
            raise
        finally:
            if 'conn' in locals() and conn:
                conn.close()

    def get_lead(self, lead_id: str):
        placeholder = "%s" if self.use_postgres else "?"
        query = f"SELECT * FROM leads WHERE lead_id = {placeholder}"
        try:
            conn = self.get_connection()
            if self.use_postgres:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, (lead_id,))
                    row = cursor.fetchone()
            else:
                cursor = conn.execute(query, (lead_id,))
                row = cursor.fetchone()
            return row
        except Exception as e:
            logger.error(f"Error fetching lead {lead_id}: {e}")
            return None
        finally:
            if 'conn' in locals() and conn:
                conn.close()

    def get_all_leads(self):
        query = "SELECT * FROM leads ORDER BY created_at DESC"
        try:
            conn = self.get_connection()
            if self.use_postgres:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query)
                    rows = cursor.fetchall()
            else:
                cursor = conn.execute(query)
                rows = cursor.fetchall()
            return rows
        except Exception as e:
            logger.error(f"Error fetching all leads: {e}")
            return []
        finally:
            if 'conn' in locals() and conn:
                conn.close()

    def get_leads_by_status(self, status: str):
        placeholder = "%s" if self.use_postgres else "?"
        query = f"SELECT * FROM leads WHERE status = {placeholder}"
        try:
            conn = self.get_connection()
            if self.use_postgres:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, (status,))
                    rows = cursor.fetchall()
            else:
                cursor = conn.execute(query, (status,))
                rows = cursor.fetchall()
            return rows
        except Exception as e:
            logger.error(f"Error fetching leads by status {status}: {e}")
            return []
        finally:
            if 'conn' in locals() and conn:
                conn.close()
