import re

def redact_pii(text: str) -> str:
    """
    Removes Personally Identifiable Information (PII) using basic Regex for MVP.
    Replaces common name patterns or specific identifiers to avoid Spacy Cython errors on Windows.
    """
    # MVP regex fallback for PII (simple example to avoid heavy ML models)
    # In a real app, you would use a robust model or cloud API.
    # Here we just redact obvious mock names or digits as a placeholder.
    redacted_text = re.sub(r'\b(John|Doe|Jane|Smith)\b', '[REDACTED NAME]', text, flags=re.IGNORECASE)
    
    # Redact obvious SSN or phone patterns as a bonus
    redacted_text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED SSN]', redacted_text)
    
    return redacted_text

def normalize_units(text: str) -> str:
    """
    Basic deterministic parsing to normalize common medical units.
    E.g., converting 'mg/dl' to 'mg/dL' for consistency.
    """
    # Simple replace for MVP
    text = text.replace("mg/dl", "mg/dL")
    text = text.replace("mmol/l", "mmol/L")
    return text

def preprocess_medical_text(raw_text: str) -> str:
    normalized = normalize_units(raw_text)
    safe_text = redact_pii(normalized)
    return safe_text

