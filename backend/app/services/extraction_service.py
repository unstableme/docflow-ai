import json
import logging
from openai import OpenAI
from app.schemas.document import ExpenseMetadata
from app.core.config import settings

logger = logging.getLogger(__name__)

class ExtractionService:
    @staticmethod
    async def extract_expense_from_text(text: str) -> ExpenseMetadata:
        """
        Agentic Extraction Node: Uses OpenRouter (OpenAI SDK) to turn raw text 
        into structured ExpenseMetadata with a fallback loop.
        """
        if not text or len(text.strip()) < 5:
            logger.warning("Extraction skipped: Text is too short or empty.")
            return ExpenseMetadata(confidence_score=0.0)

        logger.info(f"--- START EXTRACTED TEXT ---\n{text}\n--- END EXTRACTED TEXT ---")

        # 1. Model priority (Primary -> Backups)
        models_to_try = [
            settings.EXTRACTION_MODEL,                   
            "minimax/minimax-m2.5:free",
            "qwen/qwen3-next-80b-a3b-instruct:free",
            "openai/gpt-oss-120b:free"
        ]

        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY
        )

        system_instruction = """
        You are an expert Accountant and Data Extraction Agent. 
        Analyze the raw OCR or parsed text from a receipt/invoice and extract structured data into the specified JSON format.
        
        KEY IDENTIFICATION RULES:
        1. VENDOR_NAME: This is the entity PROVIDING the service or product (the seller). They are usually at the top, often in a larger font or identified by their logo.
        2. RECIPIENT: The person or company being billed. Do NOT confuse them with the Vendor.
        3. TRANSACTION_DATE: The date the invoice was issued. Convert to YYYY-MM-DD.
        4. CATEGORY: Infer the most likely category from [Food, Travel, Office, Utilities, Other].
        5. LINE_ITEMS: Extract each item with its description, quantity, unit_price, and total_price.
        
        JSON SCHEMA:
        {
            "vendor_name": "string or null",
            "transaction_date": "YYYY-MM-DD or null",
            "total_amount": "number or null",
            "currency": "string (3-letter code, default USD)",
            "tax_amount": "number or null",
            "category": "string or null",
            "line_items": [
                {
                    "description": "string",
                    "quantity": "number",
                    "unit_price": "number or null",
                    "total_price": "number"
                }
            ],
            "confidence_score": "number between 0 and 1"
        }

        RULES:
        1. Return ONLY valid JSON matching the schema above.
        2. Use null for missing fields.
        3. Ensure numeric values are numbers, not strings.
        4. SPELLING CORRECTION: If you are highly confident (99-100%) that a word in the OCR text is misspelled (due to typos or OCR errors), automatically correct it to the intended word in the extracted JSON.
        """

        for model_name in models_to_try:
            try:
                logger.info(f"Attempting extraction with model: {model_name}")
                
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Extract data from this text:\n\n{text}"}
                    ],
                    timeout=30.0, # Don't wait forever
                    response_format={"type": "json_object"} if "gemini" in model_name.lower() or "qwen" in model_name.lower() else None
                )

                raw_json = response.choices[0].message.content
                data = json.loads(raw_json)
                
                extracted_data = ExpenseMetadata(**data)
                
                # If we got here, it's a success! Break the loop.
                logger.info(f"Successful extraction using {model_name}")
                return extracted_data

            except Exception as e:
                logger.error(f"Model {model_name} failed: {e}. Trying next...")
                continue # Move to the next model in the list

        logger.error("All extraction models failed.")
        return ExpenseMetadata(confidence_score=0.0)

    @staticmethod
    def validate_extraction(data: ExpenseMetadata) -> bool:
        """
        Validation Node: Checks if the data is sane.
        """
        if not data.vendor_name or data.total_amount is None:
            return False
        
        # Check if line items sum up to total (if they exist)
        if hasattr(data, 'line_items') and data.line_items:
            items_sum = sum(item.total_price for item in data.line_items)
            # Allow for a small rounding difference (0.01)
            if abs(items_sum - data.total_amount) > 0.05:
                logger.info(f"Validation Warn: Sum ({items_sum}) != Total ({data.total_amount})")
                return False
                
        return True
