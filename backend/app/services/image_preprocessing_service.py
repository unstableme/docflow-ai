import cv2
import numpy as np
from PIL import Image

class ImagePreprocessingService:
    @staticmethod
    def preprocess_image(image):
        """
        Applies basic preprocessing to improve OCR accuracy.
        `image` can be a PIL Image or numpy array.
        """
        # Convert PIL Image to cv2 numpy array
        if isinstance(image, Image.Image):
            img_np = np.array(image)
            if len(img_np.shape) == 3 and img_np.shape[2] == 3:
                img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            else:
                img_cv = img_np
        elif isinstance(image, np.ndarray):
            img_cv = image
        else:
            raise ValueError("Unsupported image format. Must be PIL Image or Numpy Array")

        if len(img_cv.shape) == 3:
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        else:
            gray = img_cv

        # Contrast Limited Adaptive Histogram Equalization
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        contrast = clahe.apply(gray)

        blur = cv2.GaussianBlur(contrast, (5, 5), 0)

        _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        closing = cv2.morphologyEx(opening, cv2.MORPH_CLOSE, kernel, iterations=1)

        return closing
