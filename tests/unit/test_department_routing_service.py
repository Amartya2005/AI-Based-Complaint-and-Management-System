from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import app.services.department_routing_service as routing


class Department:
    def __init__(self, department_id, name, code):
        self.id = department_id
        self.name = name
        self.code = code


def _settings():
    return SimpleNamespace(
        LOCAL_QWEN_ROUTING_ENABLED=True,
        LOCAL_LLM_BASE_URL="http://127.0.0.1:11434",
        LOCAL_LLM_MODEL="qwen3.5:4b",
        LOCAL_LLM_TIMEOUT_SECONDS=1,
        AI_ROUTING_MIN_CONFIDENCE=0.45,
    )


def test_explicit_department_selection_is_authoritative(monkeypatch):
    departments = [Department(1, "Computer Science", "CSE"), Department(2, "Mechanical", "ME")]
    monkeypatch.setattr(
        routing,
        "_request_local_model",
        lambda *args: pytest.fail("The model must not override an explicit department choice"),
    )

    decision = routing.resolve_department(
        title="Machine shop issue",
        description="A machine is broken",
        category="ACADEMIC",
        departments=departments,
        selected_department_id=2,
        settings=_settings(),
    )

    assert decision.department_id == 2
    assert decision.department_name == "Mechanical"
    assert decision.source == "student_selected"


def test_qwen_department_code_is_checked_against_database_departments(monkeypatch):
    departments = [Department(1, "Computer Science", "CSE"), Department(2, "Mechanical", "ME")]
    monkeypatch.setattr(routing, "_request_local_model", lambda *args: ("CSE", 0.92))

    decision = routing.resolve_department(
        title="Programming lab machines are down",
        description="Students cannot run code",
        category="ACADEMIC",
        departments=departments,
        settings=_settings(),
    )

    assert decision.department_id == 1
    assert decision.source == "local_qwen"
    assert decision.confidence == 0.92


def test_unknown_model_code_falls_back_without_inventing_a_destination(monkeypatch):
    departments = [Department(1, "Computer Science", "CSE"), Department(2, "Mechanical", "ME")]
    monkeypatch.setattr(routing, "_request_local_model", lambda *args: ("UNKNOWN", 0.99))

    decision = routing.resolve_department(
        title="A general complaint",
        description="Please review this issue",
        category="ADMINISTRATIVE",
        departments=departments,
        settings=_settings(),
    )

    assert decision.department_id is None
    assert decision.source == "unresolved"


def test_keyword_fallback_can_route_a_hostel_complaint(monkeypatch):
    departments = [Department(1, "Computer Science", "CSE"), Department(3, "Hostel", "HS")]
    monkeypatch.setattr(routing, "_request_local_model", lambda *args: None)

    decision = routing.resolve_department(
        title="Hostel water supply is unavailable",
        description="No water is reaching the rooms",
        category="HOSTEL",
        departments=departments,
        settings=_settings(),
    )

    assert decision.department_id == 3
    assert decision.source == "keyword_fallback"


def test_missing_explicit_department_is_rejected():
    with pytest.raises(HTTPException) as error:
        routing.resolve_department(
            title="A complaint",
            description="Details",
            category="ACADEMIC",
            departments=[Department(1, "Hostel", "HS")],
            selected_department_id=999,
            settings=_settings(),
        )

    assert error.value.status_code == 400
