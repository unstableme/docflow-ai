from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks, Form
from sqlalchemy.orm import Session
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

from app.core.config import settings 
from app.db.connection import get_db
from app.schemas.document import DocumentUploadResponse, DocumentRead, DashboardStats, DocumentUpdate
from app.services.ingestion_service import IngestionService
from app.services.rag.ingestion import run_rag_ingestion_for_document

router = APIRouter()

@router.post("/", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    source_type: str = Form("upload"),
    db: Session = Depends(get_db)
):
    """
    Handles file upload, validates metadata, and triggers background extraction processing.
    Returns the initial document record with a 'Processing' status.
    """
    # 1. Basic Validation (Quick rejection)
    filename = file.filename or "unknown"
    file_extension = Path(filename).suffix.lower()

    if file_extension not in settings.SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file extension")
    
    if file.content_type not in settings.SUPPORTED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported MIME type")

    # 2. Hand off to Ingestion Service
    doc = await IngestionService.handle_upload(file=file, db=db)
    
    # Update source type after ingestion
    doc.source_type = source_type
    db.commit()
    db.refresh(doc)

    # 3. Trigger Background Processing (OCR/Parsing)
    background_tasks.add_task(IngestionService.process_document, doc.id)


    return DocumentUploadResponse(
        id=doc.id,
        status=doc.status,
        message="Document uploaded and processing started"
    )

@router.get("/", response_model=List[DocumentRead], response_model_by_alias=False)
def list_documents(
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    source_type: Optional[str] = None,
    limit: int = 100
):
    """
    Retrieves a list of uploaded documents.
    Supports optional filtering by status (e.g., 'Completed', 'Processing', 'Failed').
    """
    from app.db.tables import Document
    query = db.query(Document)
    if status and status != "all":
        query = query.filter(Document.status == status)
    if source_type and source_type != "all":
        query = query.filter(Document.source_type == source_type)
    
    docs = query.order_by(Document.upload_time.desc()).limit(limit).all()
    return docs

@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    """
    Calculates and returns summary statistics for the document dashboard.
    Includes total counts and the sum of billed amounts from processed documents.
    """
    from app.db.tables import Document
    from sqlalchemy import func

    total = db.query(Document).count()
    processed = db.query(Document).filter(Document.status == "approved").count()
    flagged = db.query(Document).filter(Document.status == "flagged").count()
    
    # Calculate total billed amount from JSONB metadata
    # This is a bit complex in SQLite/Postgres across JSONB
    # For MVP, we'll sum it in Python or assume a simpler structure
    all_docs = db.query(Document).filter(Document.status.in_(["processed", "approved"])).all()
    total_amount = sum([
        (d.extracted_metadata.get("total_amount") or 0) 
        for d in all_docs 
        if d.extracted_metadata and isinstance(d.extracted_metadata, dict)
    ])

    return DashboardStats(
        totalDocuments=total,
        processedDocuments=processed,
        flaggedDocuments=flagged,
        totalBilledAmount=total_amount,
        currency="USD"
    )

@router.get("/{documents_id}", response_model=DocumentRead, response_model_by_alias=False)
def get_document(documents_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the full details of a specific document by its unique ID,
    including any extracted metadata and status information.
    """
    from app.db.tables import Document
    doc = db.query(Document).filter(Document.id == documents_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

from fastapi.responses import FileResponse

@router.patch("/{documents_id}", response_model=DocumentRead, response_model_by_alias=False)
def update_document(
    documents_id: str,
    update_data: DocumentUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Updates a document (e.g., approving and modifying metadata).
    When status changes to 'approved', triggers RAG ingestion as a background task.
    """
    from app.db.tables import Document
    doc = db.query(Document).filter(Document.id == documents_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    was_not_approved = doc.status != "approved"
        
    if update_data.status is not None:
        doc.status = update_data.status
    if update_data.metadata is not None:
        doc.extracted_metadata = update_data.metadata.model_dump(mode='json')
        
    db.commit()
    db.refresh(doc)

    # Trigger RAG ingestion when a document is approved or updated while approved
    if doc.status == "approved" and (was_not_approved or update_data.metadata is not None):
        background_tasks.add_task(run_rag_ingestion_for_document, str(doc.id))

    return doc

@router.get("/{documents_id}/file")
def get_document_file(documents_id: str, db: Session = Depends(get_db)):
    """
    Returns the original document file for previewing.
    """
    from app.db.tables import Document
    doc = db.query(Document).filter(Document.id == documents_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    file_path = Path(doc.stored_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    return FileResponse(
        path=file_path, 
        filename=doc.original_filename, 
        content_disposition_type="inline"
    )

from app.schemas.document import ExpenseMetadata

@router.post("/manual", response_model=DocumentRead, response_model_by_alias=False)
def create_manual_document(
    metadata: ExpenseMetadata,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Creates a new document entry entirely from manual input, bypassing file storage.
    Automatically triggers RAG ingestion since manual entries are pre-approved.
    """
    from app.db.tables import Document
    import uuid
    
    unique_filename = f"manual_entry_{uuid.uuid4().hex[:8]}"
    
    doc = Document(
        original_filename=unique_filename,
        stored_path="manual",
        status="approved",
        source_type="manual",
        extracted_metadata=metadata.model_dump(mode='json')
    )
    
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Manual entries are auto-approved, so trigger RAG ingestion immediately
    background_tasks.add_task(run_rag_ingestion_for_document, str(doc.id))
    
    return doc

@router.delete("/{documents_id}")
def delete_document(
    documents_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Deletes a document record, its associated file from disk,
    and removes its vectors from Pinecone.
    """
    from app.db.tables import Document
    from app.services.rag.ingestion import RAGIngestionService
    
    doc = db.query(Document).filter(Document.id == documents_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete file from disk if it exists and is not a manual entry
    if doc.stored_path and doc.stored_path != "manual":
        if os.path.exists(doc.stored_path):
            try:
                os.remove(doc.stored_path)
            except Exception as e:
                # For now, we'll just print if file deletion fails, but proceed with DB deletion
                logger.warning(f"Could not delete file {doc.stored_path}: {e}")

    # Clean up Pinecone vectors in the background
    doc_id_str = str(doc.id)
    def _cleanup_vectors():
        try:
            rag_service = RAGIngestionService()
            rag_service.remove_document(doc_id_str)
        except Exception as e:
            logger.warning(f"Could not remove vectors for {doc_id_str}: {e}")

    background_tasks.add_task(_cleanup_vectors)
                
    db.delete(doc)
    db.commit()
    
    return {"message": "Document deleted successfully", "id": documents_id}