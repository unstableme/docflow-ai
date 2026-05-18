from sentence_transformers import SentenceTransformer
from typing import List

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_text(text: List[str]) -> List[List[float]]:
    return model.encode(text, convert_to_numpy=True).tolist()

def embed_query(query: str) -> List[float]:
    return embed_text([query])[0]
