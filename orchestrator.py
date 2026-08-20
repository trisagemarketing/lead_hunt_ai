import subprocess
import sys
import time
from utils.logger import get_logger

logger = get_logger(__name__)

def run_module(module_name: str, description: str):
    """Runs a Python module as a subprocess and streams the output."""
    logger.info(f"========== STARTING: {description} ==========")
    try:
        # Run the module and stream output in real-time
        process = subprocess.Popen(
            [sys.executable, "-m", module_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        
        for line in process.stdout:
            print(line.strip())
            
        process.wait()
        
        if process.returncode != 0:
            logger.error(f"❌ MODULE FAILED: {module_name} (Exit code: {process.returncode})")
            return False
            
        logger.info(f"✅ MODULE COMPLETE: {description}")
        return True
        
    except Exception as e:
        logger.error(f"❌ FATAL ERROR running {module_name}: {e}")
        return False

def main():
    logger.info("🚀 STARTING FULL LEADHUNTER AI ORCHESTRATOR 🚀")
    start_time = time.time()
    
    # Define the exact sequence of the pipeline
    pipeline = [
        ("discovery.serpapi_search", "Phase 1: Discovery (Google Maps Scrape)"),
        ("processing.normalize", "Phase 2A: Data Normalization"),
        ("processing.deduplicate", "Phase 2B: Deduplication"),
        ("processing.website_checker", "Phase 3: Website Auditing"),
        ("processing.lead_scorer", "Phase 4: Lead Scoring Engine"),
        ("ai.personalizer", "Phase 5: AI Personalization (Groq Llama-3)"),
        ("demo.url_generator", "Phase 6: Demo URL Generation")
    ]
    
    for module_name, description in pipeline:
        success = run_module(module_name, description)
        if not success:
            logger.error("🛑 Pipeline halted due to module failure.")
            sys.exit(1)
            
        # Brief pause between heavy modules
        time.sleep(2)
        
    elapsed = time.time() - start_time
    logger.info(f"🎉 PIPELINE FINISHED SUCCESSFULLY in {elapsed:.2f} seconds!")

if __name__ == "__main__":
    main()
