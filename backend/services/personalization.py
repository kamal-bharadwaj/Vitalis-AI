def generate_constraint_text(conditions: list[str], allergies: list[str]) -> str:
    """
    Generates explicit constraint strings to append to LLM prompts
    based on the patient's conditions and allergies.
    """
    constraints = []
    
    if allergies:
        allergy_str = ", ".join(allergies)
        constraints.append(f"CRITICAL CONSTRAINT: Ensure no suggested foods or recipes contain any of the following allergens: {allergy_str}.")
        
    for condition in conditions:
        condition_lower = condition.lower()
        if "diabetes" in condition_lower:
            constraints.append("CRITICAL CONSTRAINT: Ensure all suggestions are strictly low-glycemic index and suitable for diabetics.")
        elif "celiac" in condition_lower or "gluten intolerance" in condition_lower:
            constraints.append("CRITICAL CONSTRAINT: Ensure all suggestions are 100% gluten-free.")
        elif "hypertension" in condition_lower or "high blood pressure" in condition_lower:
            constraints.append("CRITICAL CONSTRAINT: Ensure all suggestions strictly adhere to a low-sodium diet (DASH diet principles).")

    return "\n".join(constraints)
