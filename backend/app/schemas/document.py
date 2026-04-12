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

