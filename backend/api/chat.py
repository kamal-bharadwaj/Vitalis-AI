from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage
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
    
    try:
        # Initialize the Gemini model via Langchain
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
        
        # Send baseline request to verify connectivity
        response = llm.invoke([HumanMessage(content=request.message)])
        
        return ChatResponse(reply=response.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")
