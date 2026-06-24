import pytesseract
from PIL import Image
import io

# Note: pytesseract requires the tesseract executable to be installed on the system.
# For Windows, it's typically at C:\Program Files\Tesseract-OCR\tesseract.exe
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_from_image(image_bytes: bytes) -> str:
    """Extracts text from a given image using PyTesseract."""
    image = Image.open(io.BytesIO(image_bytes))
    extracted_text = pytesseract.image_to_string(image)
    return extracted_text
