import json
import logging
from typing import Optional
from app.schemas.document import ExpenseMetadata
# We will use google-generativeai, but I'll write it to be easily swappable
# If you don't have it: pip install google-generativeai

logger = logging.getLogger(__name__)

class ExtractionService:
    @staticmethod
    async def extract_expense_from_text(text: str, api_key: Optional[str] = None) -> ExpenseMetadata:
        """
        Agentic Extraction Node: Takes raw text and turns it into structured ExpenseMetadata.
        This follows a 'Chain of Thought' approach internally.
        """
        if not text or len(text.strip()) < 5:
            logger.warning("Extraction skipped: Text is too short or empty.")
            return ExpenseMetadata(confidence_score=0.0)

        # 1. In a real scenario, we'd initialize the Gemini/LLM client here
        # For now, let's create the prompt and a placeholder for the call
        
        system_instruction = """
        You are an expert Accountant and Data Extraction Agent. 
        Your task is to analyze raw OCR text from receipts/invoices and extract structured data.
        
        RULES:
        1. Only return valid JSON matching the provided schema.
        2. If a value is missing, return null or an empty list.
        3. TRANSACTION_DATE: Convert to YYYY-MM-DD.
        4. CONFIDENCE_SCORE: Rate how readable the text was from 0.0 to 1.0.
        5. CATEGORY: Categorize into: Food, Travel, Office, Utilities, or Other.
        """
        
        prompt = f"Extract expense data from the following OCR text:\n\n{text}"
        
        # TODO: Implement actual LLM call here. 
        # Example using Gemini:
        # model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_instruction)
        # response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        
        # MOCK RESPONSE for demonstration of the flow:
        mock_data = {
            "vendor_name": "Sample Vendor (LLM Not Configured)",
            "total_amount": 0.0,
            "currency": "USD",
            "confidence_score": 0.1,
            "line_items": []
        }
        
        try:
            # Here we would normally parse response.text
            return ExpenseMetadata(**mock_data)
        except Exception as e:
            logger.error(f"Error parsing LLM response: {e}")
            return ExpenseMetadata(confidence_score=0.0)

    @staticmethod
    def validate_extraction(data: ExpenseMetadata) -> bool:
        """
        Validation Node: Checks if the data is sane.
        This is where the LangGraph 'Conditional Edge' would live.
        """
        if not data.vendor_name or data.total_amount is None:
            return False
        
        # Check if line items sum up to total (if they exist)
        if data.line_items:
            items_sum = sum(item.total_price for item in data.line_items)
            if abs(items_sum - data.total_amount) > 0.01:
                logger.info("Validation Failed: Line items do not match total.")
                return False
                
        return True
