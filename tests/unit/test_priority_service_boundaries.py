from datetime import datetime, timedelta

import pytest

from app.models.complaint import PriorityLevel
from app.services import priority_service


def _freeze_clock(monkeypatch, now):
    class FrozenDateTime:
        @staticmethod
        def utcnow():
            return now

    monkeypatch.setattr(priority_service, "datetime", FrozenDateTime)


@pytest.mark.parametrize(
    ("age", "expected"),
    [
        (timedelta(hours=-3), 0),
        (timedelta(hours=0), 0),
        (timedelta(hours=1), 0),
        (timedelta(hours=23), 7),
        (timedelta(hours=24), 10),
        (timedelta(hours=48), 15),
        (timedelta(hours=72), 20),
        (timedelta(days=10), 20),
    ],
)
def test_aging_score_is_clamped_and_respects_escalation_thresholds(
    monkeypatch, age, expected
):
    now = datetime(2026, 11, 4, 9, 0, 0)
    _freeze_clock(monkeypatch, now)

    assert priority_service.calculate_aging_score(now - age) == expected


@pytest.mark.parametrize(
    ("score", "expected"),
    [
        (0, PriorityLevel.LOW),
        (39, PriorityLevel.LOW),
        (40, PriorityLevel.MEDIUM),
        (59, PriorityLevel.MEDIUM),
        (60, PriorityLevel.HIGH),
        (79, PriorityLevel.HIGH),
        (80, PriorityLevel.CRITICAL),
        (100, PriorityLevel.CRITICAL),
    ],
)
def test_priority_level_thresholds(score, expected):
    assert priority_service.calculate_priority_level(score) == expected


@pytest.mark.parametrize(
    ("severity", "impact", "aging", "expected"),
    [
        (-50, 0, 0, 0),
        (20.9, 15, 5, 40),
        (50, 30, 20, 100),
        (80, 30, 20, 100),
    ],
)
def test_priority_score_is_clamped_to_zero_through_one_hundred(
    severity, impact, aging, expected
):
    assert priority_service.calculate_priority_score(severity, impact, aging) == expected
