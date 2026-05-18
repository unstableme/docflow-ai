from pydantic import BaseModel, Field
from typing import Any, List, Optional
from datetime import date

class ExpenseItem(BaseModel):
    description: str
    quantity: Optional[float] = 1.0
    unit_price: Optional[float] = None
    total_price: float

class ExpenseMetadata(BaseModel):
    vendor_name: Optional[str] = Field(None, description="The name of the merchant/vendor")
    transaction_date: Optional[date] = Field(None, description="The date of the transaction")
    total_amount: Optional[float] = Field(None, description="The total amount paid")
    currency: str = Field("USD", description="The currency found on the receipt (e.g. USD, EUR, INR)")
    tax_amount: Optional[float] = None
    category: Optional[str] = Field(None, description="Inferred category (e.g. Food, Travel, Office Supplies)")
    line_items: List[ExpenseItem] = []
    confidence_score: float = Field(0.0, ge=0.0, le=1.0)

class DocumentUploadResponse(BaseModel):
    id: Any
    status: str
    message: str = "Document Uploaded Successfully"
    metadata: Optional[ExpenseMetadata] = None

class DocumentRead(BaseModel):
    id: Any
    filename: str = Field(..., alias="original_filename")
    file_type: str = "application/pdf" # Default for now
    document_type: str = "invoice"
    status: str
    uploaded_at: Any = Field(..., alias="upload_time")
    source_type: str = "upload"
    metadata: Optional[ExpenseMetadata] = Field(None, alias="extracted_metadata")

    class Config:
        populate_by_name = True
        from_attributes = True

class DocumentUpdate(BaseModel):
    status: Optional[str] = None
    metadata: Optional[ExpenseMetadata] = Field(None, alias="extracted_metadata")
    
    class Config:
        populate_by_name = True

class DashboardStats(BaseModel):
    totalDocuments: int
    processedDocuments: int
    flaggedDocuments: int
    totalBilledAmount: float
    currency: str = "USD"

