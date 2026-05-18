from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_document import router as document_router
from app.api.routes_ai import router as ai_router

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For MVP, allow all origins.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "DocFlow AI is working!"}

app.include_router(document_router, prefix="/documents", tags=["Documents"])
app.include_router(ai_router, prefix="/ai", tags=["AI"])
