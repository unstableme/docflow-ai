import uuid
import mimetypes
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from app.db.connection import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    original_filename = Column(String, nullable=False)
    stored_path = Column(String, nullable=False)
    status = Column(String, default="pending")
    upload_time = Column(DateTime, default=func.now())
    extracted_text = Column(String, nullable=True)
    extracted_metadata = Column(JSONB, nullable=True)
    source_type = Column(String, default="upload", nullable=False)

    @property
    def file_type(self):
        return mimetypes.guess_type(self.original_filename)[0] or "application/octet-stream"
