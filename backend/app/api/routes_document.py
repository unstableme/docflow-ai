from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from pathlib import Path

from app.core.config import settings 
from app.db.connection import get_db
from app.schemas.document import DocumentUploadResponse
from app.services.ingestion_service import IngestionService

router = APIRouter()

@router.post("/", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Basic Validation (Quick rejection)
    filename = file.filename or "unknown"
    file_extension = Path(filename).suffix.lower()

    if file_extension not in settings.SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file extension")
    
    if file.content_type not in settings.SUPPORTED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported MIME type")

    # 2. Hand off to Ingestion Service
    doc = await IngestionService.handle_upload(file=file, db=db)

    # 3. Trigger Background Processing (OCR/Parsing)
    # We will implement these service calls next!
    # background_tasks.add_task(OCRService.process, doc.id)

    return DocumentUploadResponse(
        id=doc.id,
        status=doc.status,
        message="Document uploaded and processing started"
    )

@router.get("/{documents_id}")
def get_document(documents_id: int, db: Session = Depends(get_db)):
    from app.db.tables import Document
    doc = db.query(Document).filter(Document.id == documents_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
    return {"message": f"Document {documents_id} retrieved successfully"}