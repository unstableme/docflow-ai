from pydantic import BaseModel
from typing import List, Optional

class AIQueryRequest(BaseModel):
    question: str

class AIQueryResponse(BaseModel):
    answer: str
    sources: List[str]
    timestamp: str
