# Service for retrieving relevant documents from the vector store based on a query.
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.tables import Document
from app.services.rag.embeddings import embed_query
from app.services.rag.pinecone_client import PineconeClient

class RetrieverService:
    def __init__(self, db: Session):
        self.db = db
        self.pinecone_client = PineconeClient()

    def get_relevant_chunks(self, query: str):
        """
        Retrieves relevant document chunks using a hybrid approach:
        1. Keyword-based search (Fast & Precise for specific terms)
        2. Semantic-based search (Fallback for conceptual queries)
        """
        # Try keyword search first
        keyword_results = self._keyword_search(query)
        if keyword_results:
            return keyword_results

        # Fallback to semantic search
        query_vector = embed_query(query)
        return self.pinecone_client.query(query_vector, top_k=5)

    def _keyword_search(self, query: str):
        """Simple keyword matching against approved documents."""
        if len(query) < 3: return []
        
        # 1. Try full phrase match (most precise)
        docs = self.db.query(Document).filter(
            Document.status == 'approved',
            Document.extracted_text.ilike(f"%{query}%")
        ).limit(3).all()
        
        match_term = query

        # 2. Fallback to significant keywords if no phrase match
        if not docs:
            significant_words = [w for w in query.split() if len(w) > 4]
            if significant_words:
                conditions = [Document.extracted_text.ilike(f"%{w}%") for w in significant_words]
                docs = self.db.query(Document).filter(Document.status == 'approved', *conditions).limit(3).all()
                match_term = significant_words[0] # Use first significant word for snippet anchoring

        results = []
        for doc in docs:
            text = doc.extracted_text
            # Anchor snippet around the match_term
            idx = text.lower().find(match_term.lower())
            if idx == -1: idx = 0 # Fallback to start if not found
            
            start = max(0, idx - 200)
            end = min(len(text), idx + 800)
            
            results.append({
                "metadata": {
                    "text": text[start:end],
                    "document_id": str(doc.id)
                },
                "score": 1.0
            })
        return results

