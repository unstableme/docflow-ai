from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.connection import get_db
from app.schemas.ai import AIQueryRequest, AIQueryResponse
from app.services.rag.generator import AIAssistantService

router = APIRouter()

@router.post("/query", response_model=AIQueryResponse)
async def query_ai(request: AIQueryRequest, db: Session = Depends(get_db)):
    """
    Entry point for AI assistant queries.
    """
    try:
        response = await AIAssistantService.query_assistant(request.question, db)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
