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
        
        if not settings.GROQ_API_KEY:
            logger.error("GROQ_API_KEY is not set in environment settings.")
            return AIQueryResponse(
                answer="Sorry, the AI assistant is currently unavailable: GROQ_API_KEY is missing from configuration.",
                sources=[],
                timestamp=datetime.utcnow().isoformat()
            )

        client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=settings.GROQ_API_KEY
        )
        
        models_to_try = [
            settings.RAG_MODEL_1,
            settings.RAG_MODEL_2,
            settings.RAG_MODEL_3
        ]
        # Filter out empty/None models
        models_to_try = [m for m in models_to_try if m]
        
        system_instruction = f"""
        You are an intelligent Finance Assistant. You have access to the following extracted financial documents.
        Answer the user's question accurately based ONLY on the provided context.
        If the information is not in the context, say you don't know.
        Be concise and helpful. Format your response with markdown.
        Current Date: {datetime.now().strftime("%Y-%m-%d")}

        CONTEXT:
        {context_text}
        """

        answer = None
        last_error = None

        for model_name in models_to_try:
            try:
                logger.info(f"Querying AI Assistant with model {model_name} for question: {question}")
                
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": question}
                    ],
                    timeout=45.0
                )

                answer = response.choices[0].message.content
                logger.info(f"Successfully got response from model {model_name}")
                break  # Success, exit fallback loop

            except Exception as e:
                logger.warning(f"AI Assistant Query failed with model {model_name}: {e}. Trying fallback if available...")
                last_error = e

        if answer is not None:
            return AIQueryResponse(
                answer=answer,
                sources=list(source_ids),
                timestamp=datetime.utcnow().isoformat()
            )
        else:
            logger.error(f"All AI Assistant models failed. Last error: {last_error}")
            return AIQueryResponse(
                answer=f"Sorry, I encountered an error while processing your request: {str(last_error)}",
                sources=[],
                timestamp=datetime.utcnow().isoformat()
            )
