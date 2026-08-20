import subprocess
import sys
import time
import argparse
from utils.logger import get_logger

logger = get_logger(__name__)

def run_module(module_args: list, description: str):
    """Runs a Python module as a subprocess and streams the output."""
    logger.info(f"========== STARTING: {description} ==========")
    try:
        # Run the module and stream output in real-time
        cmd = [sys.executable, "-m"] + module_args
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        
        for line in process.stdout:
            print(line.strip())
            
        process.wait()
        
        if process.returncode != 0:
            logger.error(f"[X] MODULE FAILED: {' '.join(module_args)} (Exit code: {process.returncode})")
            return False
            
        logger.info(f"[SUCCESS] MODULE COMPLETE: {description}")
        return True
        
    except Exception as e:
        logger.error(f"[FATAL ERROR] running {' '.join(module_args)}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="LeadHunter AI Orchestrator")
    parser.add_argument("--city", type=str, default="Vadodara", help="City to search in")
    parser.add_argument("--business-type", type=str, default="restaurants", help="Type of business to search for")
    args = parser.parse_args()

    logger.info("STARTING FULL LEADHUNTER AI ORCHESTRATOR")
    start_time = time.time()
    
    # Define the exact sequence of the pipeline
    pipeline = [
        (["discovery.serpapi_search", "--city", args.city, "--business-type", args.business_type], "Phase 1: Discovery (Google Maps Scrape)"),
        (["processing.normalize"], "Phase 2A: Data Normalization"),
        (["processing.deduplicate"], "Phase 2B: Deduplication"),
        (["processing.website_checker"], "Phase 3: Website Auditing"),
        (["processing.lead_scorer"], "Phase 4: Lead Scoring Engine"),
        (["ai.personalizer"], "Phase 5: AI Personalization (Groq Llama-3)"),
        (["demo.url_generator"], "Phase 6: Demo URL Generation")
    ]
    
    for module_args, description in pipeline:
        success = run_module(module_args, description)
        if not success:
            logger.error("[HALT] Pipeline halted due to module failure.")
            sys.exit(1)
            
        # Brief pause between heavy modules
        time.sleep(2)
        
    elapsed = time.time() - start_time
    logger.info(f"[DONE] PIPELINE FINISHED SUCCESSFULLY in {elapsed:.2f} seconds!")

if __name__ == "__main__":
    main()
