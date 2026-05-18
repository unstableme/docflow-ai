import os
from dotenv import load_dotenv, find_dotenv

# Load environment variables
load_dotenv(find_dotenv())

class Settings:
    PROJECT_NAME: str = "AI Expense Intelligence System"
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # File Upload Settings
    SUPPORTED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
    SUPPORTED_PDF_EXTENSIONS = {".pdf"}
    SUPPORTED_WORD_EXTENSIONS = {".docx", ".doc"}
    SUPPORTED_EXTENSIONS = SUPPORTED_IMAGE_EXTENSIONS | SUPPORTED_PDF_EXTENSIONS | SUPPORTED_WORD_EXTENSIONS

    MAX_FILE_SIZE_MB: int = 10

    SUPPORTED_MIME_TYPES = {
        "image/jpeg",
        "image/png",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
    
    # Folder paths (for OCR and storage)
    UPLOAD_DIR: str = "uploads"

    # AI Model Settings
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY")
    EXTRACTION_MODEL: str = os.getenv("EXTRACTION_MODEL", "google/gemini-2.0-flash-001")

settings = Settings()
