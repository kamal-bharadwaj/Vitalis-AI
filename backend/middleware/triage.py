import re

def check_critical_vitals(text: str) -> str | None:
    """
    Scans input text for critical health values and returns an explicit warning
    if a threshold is breached, short-circuiting the LLM.
    
    This deterministic safety layer runs before any generative AI processing.
    """
    # Simple regex search for Systolic Blood Pressure (e.g., "BP 185/90", "Blood Pressure: 181")
    bp_match = re.search(r'(?:bp|blood\s+pressure)[\s:=-]*(\d{2,3})(?:\s*/\s*\d{2,3})?', text, re.IGNORECASE)
    if bp_match:
        systolic = int(bp_match.group(1))
        if systolic > 180:
            return "CRITICAL ALERT: Your Systolic Blood Pressure is dangerously high (>180). Seek immediate medical attention. We cannot provide dietary advice for hypertensive crises."
    
    # Blood sugar (glucose) search (e.g., "glucose 350 mg/dL")
    bg_match = re.search(r'(?:glucose|blood\s+sugar)[\s:=-]*(\d{2,4})', text, re.IGNORECASE)
    if bg_match:
        glucose = int(bg_match.group(1))
        if glucose > 300:
            return "CRITICAL ALERT: Your Blood Glucose level is critically high (>300). Seek immediate medical attention."
            
    return None
