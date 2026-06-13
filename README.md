# DocFlow AI

DocFlow AI is a full-stack expense document intelligence app. It lets users upload receipts, invoices, statements, or manually entered expenses, extracts structured financial metadata with AI, stores the records in PostgreSQL, and makes approved documents searchable through a RAG-powered assistant.

The project is split into a FastAPI backend and a Next.js frontend, with Docker Compose available for local orchestration.

## Features

- Upload PDF, image, and Word documents.
- Capture receipt images from a browser camera flow.
- Extract raw text from PDFs, images, and Word files using parsing and OCR services.
- Convert extracted text into structured expense metadata such as vendor, date, category, total amount, tax, currency, line items, and confidence score.
- Review, filter, approve, update, and delete documents.
- Add manual expense entries that bypass OCR and are saved as approved documents.
- Ingest approved documents into Pinecone for semantic search.
- Ask natural-language questions about approved financial documents through the AI assistant.
- View dashboard totals for document count, approved records, flagged records, and billed amount.

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
- PyMuPDF, Pillow, python-docx, pdf2image, pytesseract, OpenCV
- OpenRouter-compatible extraction through the OpenAI SDK
- Sentence Transformers and Pinecone for RAG

**Infrastructure**

- Docker Compose
- PostgreSQL 15
- Local file storage for uploaded documents

## Project Structure

```text
.
+-- backend/
|   +-- app/
|   |   +-- api/                 # FastAPI route modules
|   |   +-- core/                # Runtime configuration
|   |   +-- db/                  # SQLAlchemy connection and tables
|   |   +-- schemas/             # Pydantic request/response models
|   |   +-- services/            # Upload, OCR, parsing, extraction, and RAG logic
|   +-- alembic/                 # Database migrations
|   +-- Dockerfile
|   +-- requirements.txt
+-- frontend/
|   +-- app/                     # Next.js routes
|   +-- components/              # UI and feature components
|   +-- lib/                     # API client, formatting, utilities, mock data
|   +-- types/                   # Shared frontend TypeScript types
|   +-- package.json
+-- docker-compose.yml
+-- README.md
```

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

## Environment Variables

Create a root `.env` file before running the app. The Docker Compose file and backend both read from this file.

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/docflow
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=docflow

OPENROUTER_API_KEY=your_openrouter_key
EXTRACTION_MODEL=google/gemini-2.0-flash-001

GROQ_API_KEY=your_groq_key
RAG_MODEL_1=llama-3.3-70b-versatile
RAG_MODEL_2=meta-llama/llama-4-scout-17b-16e-instruct
RAG_MODEL_3=openai/gpt-oss-20b

PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=docflow-index

ADMIN_PASSWORD=choose_a_delete_password
```

For local, non-Docker backend runs, change `DATABASE_URL` to point at your local database host, for example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:25432/docflow
```

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

## Main Workflows

### Upload and Extract

1. Upload a PDF, image, Word document, or camera scan from the frontend.
2. The backend validates file extension and MIME type.
3. The file is saved to local storage and a `processing` document row is created.
4. A background task parses or OCRs the document.
5. The extraction service asks an AI model to return structured expense JSON.
6. The document is updated with extracted text, metadata, and a `processed` status.

### Review and Approve

Processed documents can be reviewed from the Documents screen. When a document is approved, the backend ingests its text and metadata into Pinecone so it can be used by the AI assistant.

### Manual Entry

Manual entries are saved directly as approved documents with structured metadata. They also trigger RAG ingestion immediately.

### Ask AI

The AI assistant sends questions to the backend, retrieves relevant approved document context from Pinecone, and generates an answer with source references.

## API Overview

Base URL: `http://localhost:8000`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Health-style root response |
| `POST` | `/documents/` | Upload a document file |
| `GET` | `/documents/` | List documents, optionally filtered by status and source type |
| `GET` | `/documents/stats` | Dashboard statistics |
| `GET` | `/documents/{id}` | Get one document |
| `PATCH` | `/documents/{id}` | Update status or extracted metadata |
| `GET` | `/documents/{id}/file` | Stream the original uploaded file |
| `POST` | `/documents/manual` | Create an approved manual entry |
| `DELETE` | `/documents/{id}` | Delete a document, its stored file, and its vectors |
| `POST` | `/ai/query` | Ask the AI assistant a question |

Deletion can be protected with `ADMIN_PASSWORD`. If it is set, clients must send the same value in the `X-Admin-Password` header.

## Document Data Model

Documents are stored in PostgreSQL with:

- `id`: UUID primary key
- `original_filename`: uploaded filename or generated manual-entry name
- `stored_path`: local file path or `manual`
- `status`: processing lifecycle state
- `upload_time`: creation timestamp
- `extracted_text`: OCR or parsed text
- `extracted_metadata`: structured JSON metadata
- `source_type`: `upload`, `scan`, or `manual`

Extracted metadata includes:

- vendor name
- transaction date
- total amount
- currency
- tax amount
- category
- line items
- confidence score

## Useful Commands

Backend:

```bash
cd backend
alembic upgrade head
alembic revision --autogenerate -m "describe change"
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

Docker:

```bash
docker compose up --build
docker compose down
docker compose exec backend alembic upgrade head
```

## Notes and Limitations

- Uploaded files are stored on local disk, not object storage.
- CORS is open for MVP development.
- Standard browser `fetch` does not provide upload progress, so frontend upload progress is completed when the request finishes.
- Approved documents are the ones used for RAG ingestion.
- The dashboard totals currently sum approved documents only.
- The backend expects OCR and PDF system dependencies to exist when not running inside Docker.

## Troubleshooting

**Backend cannot connect to the database**

Check `DATABASE_URL`. Use `db` as the hostname inside Docker Compose and `localhost` when running the backend directly against the exposed Compose database port.

**OCR or PDF parsing fails locally**

Install Tesseract and Poppler. The backend Docker image already installs them.

**AI extraction returns empty metadata**

Check that `OPENROUTER_API_KEY` is present and that the selected `EXTRACTION_MODEL` is available to your account.

**AI assistant cannot answer from documents**

Make sure documents are approved, `PINECONE_API_KEY` is configured, and the Pinecone index can be created or accessed.

**Delete requests fail with 403**

If `ADMIN_PASSWORD` is set, include it as the `X-Admin-Password` header.
