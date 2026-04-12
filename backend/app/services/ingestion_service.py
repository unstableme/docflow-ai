from logging import raiseExceptions
import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.db.tables import Document
from app.core.config import settings

from app.services.ocr_service import OCRService
from app.services.parsing_service import ParsingService
from app.services.extraction_service import ExtractionService

class IngestionService:
    @staticmethod
    async def handle_upload(file: UploadFile, db: Session):
        """
        Main entry point for document ingestion.
        1. Validates file metadata
        2. Saves file to disk with unique name
        3. Creates database record
        4. Returns the database object
        """
        # 1. Generate unique filename to prevent overwriting
        original_filename = file.filename or "unknown"
        file_extension = Path(original_filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # 2. Save file to disk
        try:
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

        # 3. Create initial database record
        db_document = Document(
            original_filename=original_filename,
            stored_path=file_path,
            status="Processing"
        )
        
        try:
            db.add(db_document)
            db.commit()
            db.refresh(db_document)
        except Exception as e:
            # Cleanup file if DB save fails
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        return db_document

    @staticmethod
    async def process_document(doc_id: str, db: Session = None):
        """
        Background task to process the document (OCR or Parsing) and update DB.
        """
        # If no DB session provided (standard for background tasks), create one
        if db is None:
            from app.db.connection import SessionLocal
            db = SessionLocal()
            close_session = True
        else:
            close_session = False

        try:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if not doc:
                return 

            file_extension = Path(doc.stored_path).suffix.lower()
            text_pages = []

            if file_extension in settings.SUPPORTED_WORD_EXTENSIONS:
                text_pages = ParsingService.parse_word(doc.stored_path)
            elif file_extension in settings.SUPPORTED_IMAGE_EXTENSIONS:
                from PIL import Image
                img = Image.open(doc.stored_path)
                text_pages = [OCRService.process_image(img)]
            elif file_extension in settings.SUPPORTED_PDF_EXTENSIONS:
                text_pages = ParsingService.parse_pdf(doc.stored_path)
                # Fallback to OCR if PDF has no text layer
                if not any(text_pages):
                    text_pages = await OCRService.process_pdf_with_ocr(doc.stored_path)
            
            # Save extracted text
            full_text = "\n\n".join(text_pages)
            doc.extracted_text = full_text
            
            # 2. Agentic Extraction (The 'Agent' Node)
            metadata = await ExtractionService.extract_expense_from_text(full_text)
            doc.extracted_metadata = metadata.model_dump()

            doc.status = "Completed"
            db.commit()
              
        except Exception as e:
            if db:
                doc.status = "Failed"
                db.commit()
            print(f"Error processing document {doc_id}: {str(e)}")
        finally:
            if close_session:
                db.close()
