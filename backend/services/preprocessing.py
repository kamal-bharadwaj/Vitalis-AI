import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback if model isn't downloaded yet. 
    # To download: python -m spacy download en_core_web_sm
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def redact_pii(text: str) -> str:
    """
    Removes Personally Identifiable Information (PII) like names using SpaCy NER.
    """
    doc = nlp(text)
    redacted_text = text
    
    # We redact PERSON entities to protect patient privacy.
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            redacted_text = redacted_text.replace(ent.text, "[REDACTED NAME]")
            
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
