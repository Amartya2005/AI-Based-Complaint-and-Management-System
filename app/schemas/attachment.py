from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AttachmentResponse(BaseModel):
    id: int
    original_name: str
    size_bytes: int
    mime_type: str
    created_at: datetime
    uploaded_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AttachmentCreate(BaseModel):
    # Used internally after upload processing
    filename: str
    original_name: str
    size_bytes: int
    mime_type: str
    uploaded_by: int
