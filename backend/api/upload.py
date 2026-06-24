from fastapi import APIRouter, UploadFile, File, HTTPException
from services.ocr import extract_text_from_image
from services.preprocessing import preprocess_medical_text

router = APIRouter()

@router.post("/")
async def upload_document(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported in this MVP.")
    
    try:
        contents = await file.read()
        raw_text = extract_text_from_image(contents)
        clean_text = preprocess_medical_text(raw_text)
        
        # Here we would normally chunk and index into the Vector DB
        # For this endpoint, we return the parsed text to verify functionality
        return {
            "filename": file.filename,
            "extracted_text": clean_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")
