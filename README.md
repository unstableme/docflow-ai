# DocFlow AI

DocFlow AI is a full-stack expense document intelligence app. It helps users upload receipts or invoices, extract structured financial data with AI, review the results, approve trusted records, and ask questions about approved documents through a RAG-powered assistant.

The project includes a FastAPI backend, a Next.js frontend, PostgreSQL storage, OCR/parsing services, AI extraction, and Pinecone-based semantic retrieval.(Frontend is fully vibecoded, backend part is mostly done by me, but polished with AI for commenting, docstring stuff, and somewhere logic)

## Main Workflows

### Upload and Extract

1. Upload a PDF, image, or camera scan from the frontend.
2. The backend validates file extension and MIME type.
3. The file is saved and a `processing` document row is created.
4. A background task parses PDFs or runs OCR on images.
5. The extraction service asks an AI model to return structured expense JSON.
6. The document is updated with extracted text, metadata, and a `processed` status.

### Review and Approve

Processed documents can be reviewed from the Documents screen. Users can inspect extracted fields, update metadata, approve records, flag uncertain documents, or delete records when needed.

When a document is approved, its text and metadata are ingested into Pinecone so the AI assistant can retrieve it later.

### Manual Entry

Manual entries let users create an expense record without uploading a file. These records are saved directly as approved documents and trigger RAG ingestion immediately.

### Ask AI

The AI assistant answers natural-language questions using approved document context. It retrieves relevant chunks from Pinecone, sends them to the configured AI model, and returns an answer with source references.

## Tech Stack

**Frontend**

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn-style UI primitives
- Lucide icons

**Backend**

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Pydantic
- PyMuPDF, Pillow, pdf2image, pytesseract, OpenCV
- OpenRouter-compatible extraction through the OpenAI SDK
- Sentence Transformers and Pinecone for RAG

**Infrastructure**

- Docker Compose
- PostgreSQL 15
- Local file storage for uploaded documents

## Prerequisites

- Docker and Docker Compose, for the easiest setup
- Node.js 20+ and npm, if running the frontend directly
- Python 3.11+, if running the backend directly
- PostgreSQL, if not using Docker
- Tesseract OCR and Poppler, if running the backend directly on your machine

On macOS, local OCR dependencies can be installed with:

```bash
brew install tesseract poppler
```

## Environment Setup

Create a root `.env` file from the example file:

```bash
cp .env.example .env
```

Update the copied `.env` with your database URL, API keys, model names, and admin password. The Docker Compose file and backend both read from the root `.env`.

For local frontend runs, create `frontend/.env.local` if you need to override the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running with Docker

From the project root:

```bash
docker compose up --build
```

Services will be available at:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:25432`

After the containers start, run database migrations:

```bash
docker compose exec backend alembic upgrade head
```

The backend stores uploaded files in `backend/uploads`, mounted into the backend container as `/app/uploads`.

## Running Locally

Start PostgreSQL first. You can use only the database service from Docker Compose:

```bash
docker compose up db
```

Then start the backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.
