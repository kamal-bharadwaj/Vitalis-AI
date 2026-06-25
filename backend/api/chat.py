from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from services.rag import rag_service
from middleware.triage import check_critical_vitals
from prompts.dietitian import dietitian_prompt
import os

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable is missing")
    
    # 1. Deterministic Triage Middleware
    critical_alert = check_critical_vitals(request.message)
    if critical_alert:
        return ChatResponse(reply=critical_alert)
        
    try:
        # 2. Hybrid RAG Retrieval
        context = rag_service.retrieve_context(request.message, k=3)
        patient_ctx_str = "\n".join(context["patient_context"]) if context["patient_context"] else "No patient records available."
        medical_ctx_str = "\n".join(context["medical_context"]) if context["medical_context"] else "No static guidelines available."
        
        # 3. Format Strict Prompt
        final_prompt = dietitian_prompt.format(
            patient_context=patient_ctx_str,
            medical_context=medical_ctx_str,
            user_query=request.message
        )
        
        # 4. Generate Response using Gemini
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
        response = llm.invoke([HumanMessage(content=final_prompt)])
        
        # 5. Output Validation (Basic check)
        reply = response.content
        if "### 🍏 What to Eat" not in reply or "### ❌ What to Avoid" not in reply:
            # Programmatic fallback or warning if the LLM hallucinated outside the layout
            reply += "\n\n*Note: The assistant failed to strictly adhere to the requested formatting layout.*"
            
        return ChatResponse(reply=reply)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")
