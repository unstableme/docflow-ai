from typing import List
def chunk_text(text:str, chunk_size: int=1200, overlap: int =500) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks
