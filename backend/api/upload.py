from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from services.ocr import extract_text_from_image
from services.preprocessing import preprocess_medical_text
from services.rag import rag_service
from middleware.auth import verify_firebase_token

router = APIRouter()

@router.post("/")
async def upload_document(
    file: UploadFile = File(...),
    user: dict = Depends(verify_firebase_token)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported in this MVP.")
    
    try:
        contents = await file.read()
        raw_text = extract_text_from_image(contents)
        clean_text = preprocess_medical_text(raw_text)
        
        # Chunk and index into the Vector DB, tagged with the user's UID
        rag_service.ingest_patient_document(
            clean_text=clean_text, 
            source_id=file.filename, 
            uid=user["uid"]
        )
        
        return {
            "filename": file.filename,
            "status": "success",
            "message": "Document processed and stored securely in the patient history vector database.",
            "extracted_text_preview": clean_text[:200] + "..." if len(clean_text) > 200 else clean_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")
