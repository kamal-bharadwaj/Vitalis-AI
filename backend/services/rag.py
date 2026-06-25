from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    def __init__(self):
        # We use Google's embedding model to match the Gemini LLM
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set.")
            
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)
        
        # Initialize text splitter for chunking medical documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100,
            length_function=len,
        )
        
        # Initialize ChromaDB persistent storage directory
        self.persist_directory = "./chroma_db"
        
        # Namespace 1: Static Medical Knowledge (dietary rules, foods to avoid)
        self.knowledge_db = Chroma(
            collection_name="static_medical_knowledge",
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )
        
        # Namespace 2: Patient History (dynamically vectorized chunks from uploaded files)
        self.patient_db = Chroma(
            collection_name="patient_history",
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )

    def ingest_patient_document(self, clean_text: str, source_id: str):
        """Chunks and embeds processed OCR text into the patient history vector database."""
        chunks = self.text_splitter.create_documents(
            texts=[clean_text],
            metadatas=[{"source_id": source_id}]
        )
        self.patient_db.add_documents(chunks)
        # Note: In newer versions of Chroma/Langchain, persistent is automatic or handled implicitly,
        # but we can explicitly call persist() if needed depending on version.
        self.patient_db.persist()

    def ingest_static_knowledge(self, knowledge_text: str, source_name: str):
        """Seeds the static medical knowledge vector index."""
        chunks = self.text_splitter.create_documents(
            texts=[knowledge_text],
            metadatas=[{"source": source_name}]
        )
        self.knowledge_db.add_documents(chunks)
        self.knowledge_db.persist()

    def retrieve_context(self, query: str, k: int = 3):
        """
        Retrieves the most relevant context chunks from both namespaces simultaneously.
        """
        # Retrieve from Patient History
        patient_docs = self.patient_db.similarity_search(query, k=k)
        
        # Retrieve from Static Medical Knowledge
        knowledge_docs = self.knowledge_db.similarity_search(query, k=k)
        
        return {
            "patient_context": [doc.page_content for doc in patient_docs],
            "medical_context": [doc.page_content for doc in knowledge_docs]
        }

rag_service = RAGService()
