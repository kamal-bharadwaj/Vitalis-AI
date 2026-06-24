# Vitalis AI - Virtual Healthcare Assistant

Vitalis AI is a secure, virtual healthcare assistant designed to ingest medical documents, perform OCR, and use a RAG pipeline with strict safety guardrails to provide dietary and medical insights based on static knowledge and patient history.

## Architecture

* **Backend:** FastAPI, Python, PostgreSQL, ChromaDB
* **LLM:** Google Gemini API / Groq (Llama 3)
* **OCR:** PyTesseract
* **Frontend:** React / Next.js (Coming Soon)

## Setup Instructions

### 1. Python Environment Setup
```bash
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Mac/Linux
source venv/bin/activate

pip install -r backend/requirements.txt
```

### 2. Configuration
Copy the sample environment file to create your own:
```bash
cp backend/.env.example backend/.env
```
Add your `GEMINI_API_KEY` to the `.env` file.

### 3. Run the Backend
```bash
cd backend
uvicorn main:app --reload
```

## API Endpoints
* `POST /api/chat`: Baseline chat endpoint to interact with the LLM.
* `POST /api/upload`: Upload an image (e.g. medical document) to extract text via OCR and redact PII.
