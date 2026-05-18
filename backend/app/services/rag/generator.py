import logging
from datetime import datetime
from openai import OpenAI
from sqlalchemy.orm import Session
from app.core.config import settings
from app.schemas.ai import AIQueryResponse
from app.services.rag.retriever import RetrieverService

logger = logging.getLogger(__name__)

class AIAssistantService:
    @staticmethod
    async def query_assistant(question: str, db: Session) -> AIQueryResponse:
        """
        Processes a natural language query by retrieving relevant chunks from 
        the vector database and consulting the LLM.
        """
        retriever = RetrieverService(db)
        
        context_chunks = retriever.get_relevant_chunks(question)
        
        if not context_chunks:
            return AIQueryResponse(
                answer="I couldn't find any relevant information to answer your question.",
                sources=[],
                timestamp=datetime.utcnow().isoformat()
            )

        context_parts = []
        source_ids = set()
        
        for chunk in context_chunks:
            metadata = chunk.get('metadata', {})
            text = metadata.get('text', '')
            doc_id = metadata.get('document_id', 'Unknown')
            if text:
                context_parts.append(f"Source Document ID: {doc_id}\nContent: {text}")
                if doc_id != 'Unknown':
                    source_ids.add(doc_id)
                    
        context_text = "\n\n---\n\n".join(context_parts)
        
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY
        )
        
        model_name = "minimax/minimax-m2.5:free"
        
        system_instruction = f"""
        You are an intelligent Finance Assistant. You have access to the following extracted financial documents.
        Answer the user's question accurately based ONLY on the provided context.
        If the information is not in the context, say you don't know.
        Be concise and helpful. Format your response with markdown.
        Current Date: {datetime.now().strftime("%Y-%m-%d")}

        CONTEXT:
        {context_text}
        """

        try:
            logger.info(f"Querying AI Assistant with question: {question}")
            
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": question}
                ],
                timeout=45.0
            )

            answer = response.choices[0].message.content
            
            return AIQueryResponse(
                answer=answer,
                sources=list(source_ids),
                timestamp=datetime.utcnow().isoformat()
            )

        except Exception as e:
            logger.error(f"AI Assistant Query failed: {e}")
            return AIQueryResponse(
                answer=f"Sorry, I encountered an error while processing your request: {str(e)}",
                sources=[],
                timestamp=datetime.utcnow().isoformat()
            )
