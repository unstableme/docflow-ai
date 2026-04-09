from pydantic import BaseModel

class DocumentUploadResponse(BaseModel):
    id: int
    status: str
    message: str = "Document Uploaded Successfully"

