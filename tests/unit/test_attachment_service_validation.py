from pathlib import Path
from types import SimpleNamespace
from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.services import attachment_service


@pytest.fixture
def upload_directory(tmp_path, monkeypatch):
    monkeypatch.setattr(
        attachment_service,
        "get_settings",
        lambda: SimpleNamespace(UPLOAD_DIR=str(tmp_path)),
    )
    return tmp_path


def _upload(filename: str, payload: bytes, content_type: str) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(payload),
        headers=Headers({"content-type": content_type}),
    )


def test_rejects_allowed_extension_with_disallowed_mime(upload_directory):
    upload = _upload("notes.txt", b"plain text", "application/octet-stream")

    attachment_service._validate_file(upload)
    with pytest.raises(HTTPException) as error:
        attachment_service._save_file(upload, complaint_id=42)

    assert error.value.status_code == 422
    assert list((upload_directory / "42").iterdir()) == []


def test_accepts_text_file_with_allowed_mime(upload_directory):
    upload = _upload("notes.txt", b"plain text", "text/plain")

    attachment_service._validate_file(upload)
    stored_name, size, mime = attachment_service._save_file(upload, complaint_id=42)

    saved_file = upload_directory / "42" / stored_name
    assert saved_file.is_file()
    assert saved_file.read_bytes() == b"plain text"
    assert size == len(b"plain text")
    assert mime.startswith("text/")


def test_rejects_unsupported_filename_extension():
    upload = _upload("payload.exe", b"not an executable", "text/plain")

    with pytest.raises(HTTPException) as error:
        attachment_service._validate_file(upload)

    assert error.value.status_code == 422
