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
    def get_processing_strategy(file: UploadFile):
        """
        Determines if the file should be parsed (digital) or OCR'd (scanned).
        """
        try:
            file_extension = Path(file).suffic.lower()
            if file_extension in settings.SUPPORTED_WORD_EXTENSIONS:
                text = ParsingService.parse_word(file)
            elif file_extension in settings.SUPPORTED_IMAGE_EXTENSIONS:
                text = OCRService.process_image(file) 
            elif file_extension in settings.SUPPORTED_PDF_EXTENSIONS:
                text = ParsingService.parse_pdf(file)
                if not text:
                    text = OCRService.process_pdf_with_ocr(file)
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Couldn't proceed. :{str(e)}")
        
