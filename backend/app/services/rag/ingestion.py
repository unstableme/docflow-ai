"""
RAG Ingestion Orchestrator.

This is the piece that wires chunking → embedding → Pinecone upsert.
It handles two data sources:
  1. Uploaded documents (after approval) — uses extracted_text
  2. Manual entries — serializes ExpenseMetadata into text for embedding
"""

import logging
from typing import Optional, Dict, Any

from app.services.rag.chunking import chunk_text
from app.services.rag.embeddings import embed_text
from app.services.rag.pinecone_client import PineconeClient

logger = logging.getLogger(__name__)


class RAGIngestionService:
    """Orchestrates the full ingestion pipeline: text → chunks → embeddings → Pinecone."""

    def __init__(self):
        self.pinecone_client = PineconeClient()

    def ingest_document(
        self,
        document_id: str,
        text: str,
        source_type: str = "upload",
        extra_metadata: Optional[Dict[str, Any]] = None,
    ):
        """
        Full ingestion pipeline for a single document.
        Automatically removes old vectors for this document before upserting new ones.
        """
        doc_id_str = str(document_id)

        # Step 0: Remove old vectors for this document to prevent stale data/duplicates
        self.remove_document(doc_id_str)

        if not text or len(text.strip()) < 10:
            logger.warning(f"Skipping RAG ingestion for doc {doc_id_str}: text too short.")
            return

        # Step 1: Chunk
        chunks = chunk_text(text)
        logger.info(f"Doc {doc_id_str}: Split into {len(chunks)} chunks.")

        if not chunks:
            logger.warning(f"Doc {doc_id_str}: No chunks produced. Skipping.")
            return

        # Step 2: Embed
        embeddings = embed_text(chunks)
        logger.info(f"Doc {doc_id_str}: Generated {len(embeddings)} embeddings.")

        # Step 3: Build Pinecone vectors
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{doc_id_str}-chunk-{i}"
            metadata = {
                "text": chunk,
                "document_id": doc_id_str,
                "source_type": source_type,
                "chunk_index": i,
            }
            if extra_metadata:
                metadata.update(extra_metadata)

            vectors.append({
                "id": chunk_id,
                "values": embedding,
                "metadata": metadata,
            })

        # Step 4: Upsert to Pinecone
        self.pinecone_client.upsert_vectors(vectors)
        logger.info(f"Doc {doc_id_str}: Upserted {len(vectors)} vectors to Pinecone.")

    def remove_document(self, document_id: str):
        """
        Removes all vectors for a document from Pinecone using metadata filtering.
        """
        doc_id_str = str(document_id)
        try:
            self.pinecone_client.delete_vectors_by_doc_id(doc_id_str)
            logger.info(f"Doc {doc_id_str}: Successfully removed old vectors from Pinecone.")
        except Exception as e:
            logger.error(f"Failed to remove vectors for doc {doc_id_str}: {e}")


def serialize_metadata_to_text(metadata: Dict[str, Any]) -> str:
    """
    Converts structured ExpenseMetadata (dict) into a natural-language text
    representation suitable for chunking and embedding.

    This ensures manual entries (which have no extracted_text) can still be
    searched via the RAG pipeline.
    """
    parts = []

    if metadata.get("vendor_name"):
        parts.append(f"Vendor: {metadata['vendor_name']}")
    if metadata.get("transaction_date"):
        parts.append(f"Transaction Date: {metadata['transaction_date']}")
    if metadata.get("total_amount") is not None:
        currency = metadata.get("currency", "USD")
        parts.append(f"Total Amount: {currency} {metadata['total_amount']}")
    if metadata.get("tax_amount") is not None:
        parts.append(f"Tax Amount: {metadata.get('currency', 'USD')} {metadata['tax_amount']}")
    if metadata.get("category"):
        parts.append(f"Category: {metadata['category']}")

    line_items = metadata.get("line_items", [])
    if line_items:
        parts.append("Line Items:")
        for idx, item in enumerate(line_items, 1):
            desc = item.get("description", "Unknown item")
            qty = item.get("quantity", 1)
            unit = item.get("unit_price")
            total = item.get("total_price", 0)
            item_line = f"  {idx}. {desc} — Qty: {qty}"
            if unit is not None:
                item_line += f", Unit Price: {unit}"
            item_line += f", Total: {total}"
            parts.append(item_line)

    return "\n".join(parts)


def run_rag_ingestion_for_document(document_id: str, db_session=None):
    """
    Standalone function designed to be called as a FastAPI BackgroundTask.
    Fetches the document from DB and runs the full RAG ingestion.

    This is triggered when:
      - A document is approved (status → "approved")
      - A manual entry is created (auto-approved)
    """
    from app.db.connection import SessionLocal
    from app.db.tables import Document

    close_session = False
    if db_session is None:
        db_session = SessionLocal()
        close_session = True

    try:
        doc = db_session.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"RAG ingestion: Document {document_id} not found.")
            return

        text_to_ingest = None

        if doc.source_type == "manual":
            if doc.extracted_metadata:
                text_to_ingest = serialize_metadata_to_text(doc.extracted_metadata)
                logger.info(f"RAG ingestion: Using serialized metadata for manual entry {document_id}")
            else:
                logger.warning(f"RAG ingestion: Manual entry {document_id} has no metadata. Skipping.")
                return
        else:
            if doc.extracted_text:
                text_to_ingest = doc.extracted_text
                # so queries about vendor names, amounts, etc. also hit
                if doc.extracted_metadata:
                    metadata_text = serialize_metadata_to_text(doc.extracted_metadata)
                    text_to_ingest += f"\n\n--- Structured Summary ---\n{metadata_text}"
                logger.info(f"RAG ingestion: Using extracted text for document {document_id}")
            else:
                logger.warning(f"RAG ingestion: Document {document_id} has no extracted text. Skipping.")
                return

        service = RAGIngestionService()
        service.ingest_document(
            document_id=str(doc.id),
            text=text_to_ingest,
            source_type=doc.source_type or "upload",
            extra_metadata={
                "filename": doc.original_filename,
            },
        )
        logger.info(f"RAG ingestion complete for document {document_id}")

    except Exception as e:
        logger.error(f"RAG ingestion failed for document {document_id}: {e}", exc_info=True)
    finally:
        if close_session:
            db_session.close()
