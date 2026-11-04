import pytest
from pydantic import ValidationError

from app.models.complaint import ComplaintCategory, ComplaintStatus
from app.schemas.complaint import AssignComplaint, ComplaintCreate, UpdateComplaintStatus


def _complaint_payload(**overrides):
    payload = {
        "title": "Water supply issue",
        "description": "There is no water in the hostel block.",
        "category": ComplaintCategory.HOSTEL,
    }
    payload.update(overrides)
    return payload


def test_complaint_create_strips_required_text():
    complaint = ComplaintCreate(
        **_complaint_payload(
            title="  Water supply issue  ",
            description="  There is no water in the hostel block.  ",
        )
    )

    assert complaint.title == "Water supply issue"
    assert complaint.description == "There is no water in the hostel block."


@pytest.mark.parametrize("title", ["", "   ", "x" * 501])
def test_complaint_create_rejects_blank_or_overlong_title(title):
    with pytest.raises(ValidationError):
        ComplaintCreate(**_complaint_payload(title=title))


@pytest.mark.parametrize("description", ["", "   ", "x" * 10001])
def test_complaint_create_rejects_blank_or_overlong_description(description):
    with pytest.raises(ValidationError):
        ComplaintCreate(**_complaint_payload(description=description))



def test_status_update_normalizes_optional_remarks():
    update = UpdateComplaintStatus(
        new_status=ComplaintStatus.IN_PROGRESS,
        remarks="  Work has started.  ",
    )
    empty = UpdateComplaintStatus(
        new_status=ComplaintStatus.RESOLVED,
        remarks="   ",
    )

    assert update.remarks == "Work has started."
    assert empty.remarks is None


def test_status_update_rejects_overlong_remarks():
    with pytest.raises(ValidationError):
        UpdateComplaintStatus(
            new_status=ComplaintStatus.IN_PROGRESS,
            remarks="x" * 2001,
        )




@pytest.mark.parametrize("staff_id", [0, -1])
def test_assignment_schema_rejects_non_positive_staff_ids(staff_id):
    with pytest.raises(ValidationError):
        AssignComplaint(staff_id=staff_id)


def test_assignment_schema_accepts_positive_staff_id():
    assert AssignComplaint(staff_id=7).staff_id == 7
