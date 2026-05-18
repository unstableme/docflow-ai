import os
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec
import logging

logger = logging.getLogger(__name__)

class PineconeClient:
    """
    Service for interacting with Pinecone Vector Database.
    """
    def __init__(self, api_key: Optional[str] = None):
        # Pinecone uses the API key to connect to project.
        self.api_key = api_key or os.getenv("PINECONE_API_KEY")
        if not self.api_key:
            raise ValueError("PINECONE_API_KEY environment variable is not set. Please add it to your .env file.")
            
        # Initialize the Pinecone client
        self.pc = Pinecone(api_key=self.api_key)

        self.index_name = os.getenv("PINECONE_INDEX_NAME", "docflow-index") # just a name
        self.index = None #  actual active connection to the Pinecone db

    def _ensure_index(self, dimension: int = 384):
        """
        Helper method to check if the index exists, and create it if it doesn't.
        Default dimension (384) matches sentence-transformers/all-MiniLM-L6-v2.
        """
        existing_indexes = [index_info["name"] for index_info in self.pc.list_indexes()]
        
        if self.index_name not in existing_indexes:
            logger.info(f"Creating Pinecone index: {self.index_name} with dimension: {dimension}")
            # Serverless is the recommended, modern way to use Pinecone
            self.pc.create_index(
                name=self.index_name,
                dimension=dimension,
                metric="cosine", 
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1" 
                )
            )

        if self.index is None:
            self.index = self.pc.Index(self.index_name)

    def upsert_vectors(self, vectors: List[Dict[str, Any]], namespace: str = ""):
        """
        Uploads/inserts vectors and their associated text (metadata) to Pinecone.
        
        Args:
            vectors: A list of dictionaries. Each dict MUST have:
                - 'id': A unique string ID for this chunk (e.g., 'docXYZ-chunk1').
                - 'values': The embedding list of floats.
                - 'metadata': A dictionary containing the actual chunk text, e.g., {'text': '...', 'document_id': '...'}
            namespace: Optional way to partition data within an index. 
        """
        if not vectors:
            return
            
        # Initialize/connect to the index using the dimension of the first vector
        self._ensure_index(dimension=len(vectors[0]["values"]))

        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch, namespace=namespace)
            
    def query(self, query_vector: List[float], top_k: int = 5, metadata_filter: Optional[Dict] = None, namespace: str = "") -> List[Dict[str, Any]]:
        """
        Searches the database for the vectors most similar to the query vector.
        
        Args:
            query_vector: The embedding of the user's question.
            top_k: How many chunks to retrieve.
            metadata_filter: Crucial for multi-tenant apps. E.g., {"document_id": {"$eq": "docXYZ"}}
                             This ensures we only search within a specific document.
        Returns:
            A list of match objects containing the score and the metadata (where our text lives).
        """
        self._ensure_index(dimension=len(query_vector))
        
        query_response = self.index.query(
            namespace=namespace,
            vector=query_vector,
            top_k=top_k,
            include_values=False, # We don't need the float arrays back, saving bandwidth
            include_metadata=True, # We DO need the metadata back because it has the 'text'
            filter=metadata_filter
        )
        
        return query_response.get("matches", [])

    def delete_vectors_by_doc_id(self, document_id: str, namespace: str = ""):
        """
        Deletes all vectors belonging to a specific document ID using metadata filtering.
        """
        if self.index is None:
            self._ensure_index()
            
        # Modern Pinecone (Serverless/Pod) supports deleting by filter
        try:
            self.index.delete(filter={"document_id": {"$eq": str(document_id)}}, namespace=namespace)
        except Exception as e:
            logger.error(f"Error deleting vectors by doc_id: {e}")
            # Fallback if filter deletion is not supported or fails
            raise e
        
    def delete_vectors(self, ids: List[str], namespace: str = ""):
        """Deletes vectors by exact ID."""
        if self.index:
            self.index.delete(ids=ids, namespace=namespace)
        else:
            self._ensure_index()
            self.index.delete(ids=ids, namespace=namespace)
