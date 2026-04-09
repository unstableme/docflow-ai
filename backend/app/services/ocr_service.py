import os
from pathlib import Path
import cv2
import pytesseract as pt
from PIL import Image 


def pdf_to_images(pdf_path: str):
        try:
            from pdf2image import convert_from_path
        except:
            raise ImportError("pdf2image is not installed. Please install it using 'pip install pdf2image'")
        
        try:
            kwargs = {"pdf_path":pdf_path,"dpi": 150}
            if settings.POPPLER_PATH:
                kwargs["poppler_path"] = settings.POPPLER_PATH
            
            images = convert_from_path(**kwargs)
            return images
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not convert PDF to images: {str(e)}")

class OCRService:
    @staticmethod
    def process_image(image: np.ndarray)->str:
        try:
            text = pt.image_to_string(image)
            return text.strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not process image: {str(e)}")

    @staticmethod
    async def process_pdf_with_ocr(file_path:str)->list[str]:
        try:
            images = pdf_to_images(file_path)
            pages = []
            for image in images:
                pages.append(OCRService.process_image(image))
            return pages
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not process PDF with OCR: {str(e)}")       
                