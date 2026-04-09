import fitz
import docx
class ParsingService:
    @staticmethod
    def parse_pdf(file_path: str, db_document: Document):
        """
        Extracts structured data from born-digital pdfs.
        """
        doc = fitz.open(file_path)
        pages = []
        for page in doc:
            text = page.get_text()
            pages.append(text.strip())
        return pages

    def parse_word(file_path: str, db_document: Document):
        """
        Extracts structured data from born-digital word documents(.doc and/or .docx).
        """
        file_extension = Path(file_path).suffix.lower()

        if file_extension == ".docx":
            doc = docx.Document(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
            return [text.strip()]
        elif file_extension == ".doc":
            import docx2txt
            text = docx2txt.process(file_path)
            return [text.strip()]
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}")


        