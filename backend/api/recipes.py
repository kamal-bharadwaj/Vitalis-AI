from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from services.rag import rag_service
from services.personalization import generate_constraint_text
import os

router = APIRouter()

class RecipeRequest(BaseModel):
    ingredients: list[str]
    patient_allergies: list[str] = []
    patient_conditions: list[str] = []

class RecipeResponse(BaseModel):
    safe_ingredients: list[str]
    risky_ingredients: list[str]
    recipe_instructions: str
    safety_score: str

@router.post("/", response_model=RecipeResponse)
async def recipe_matcher(request: RecipeRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable is missing")
        
    ingredients_str = ", ".join(request.ingredients)
    
    # Generate strict constraints based on patient profile
    constraints = generate_constraint_text(request.patient_conditions, request.patient_allergies)
    
    # Retrieve safety rules for the provided ingredients from static knowledge
    context = rag_service.knowledge_db.similarity_search(ingredients_str, k=3)
    knowledge_context = "\n".join([doc.page_content for doc in context]) if context else "No specific warnings found in database."

    prompt = f"""
You are an expert clinical culinary assistant. A patient wants to make a recipe using these ingredients:
{ingredients_str}

Medical Knowledge Context:
{knowledge_context}

Patient Constraints:
{constraints}

Task:
1. Identify any 'risky' ingredients from the list that violate the Patient Constraints or Medical Knowledge.
2. Identify the 'safe' ingredients from the list.
3. Provide a healthy recipe using ONLY the safe ingredients (you may add basic pantry staples like salt, pepper, olive oil if safe).
4. Provide a 'Safety Score' (e.g., 'High', 'Moderate', 'Low') indicating how well the original ingredients fit the patient's profile.

Respond EXACTLY in this format:
SAFE: [comma separated list]
RISKY: [comma separated list]
SCORE: [High/Moderate/Low]
RECIPE:
[Recipe text]
"""
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
        response = llm.invoke([HumanMessage(content=prompt)])
        reply = response.content
        
        # Parse the custom format
        safe_ing = []
        risky_ing = []
        score = "Unknown"
        recipe_text = reply
        
        lines = reply.split("\n")
        for i, line in enumerate(lines):
            if line.startswith("SAFE:"):
                safe_ing = [x.strip() for x in line.replace("SAFE:", "").split(",")]
            elif line.startswith("RISKY:"):
                risky_ing = [x.strip() for x in line.replace("RISKY:", "").split(",") if x.strip()]
            elif line.startswith("SCORE:"):
                score = line.replace("SCORE:", "").strip()
            elif line.startswith("RECIPE:"):
                recipe_text = "\n".join(lines[i+1:]).strip()
                break
                
        return RecipeResponse(
            safe_ingredients=safe_ing,
            risky_ingredients=risky_ing,
            recipe_instructions=recipe_text,
            safety_score=score
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")
