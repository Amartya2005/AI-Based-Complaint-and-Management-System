from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.models.user import UserRole
from app.schemas.user import UserCreate
from app.services import user_service


def test_create_user_raises_for_duplicate_email(mocker):
    email_query = mocker.Mock()
    email_query.filter.return_value.first.return_value = object()
    db = mocker.Mock()
    db.query.return_value = email_query
    data = UserCreate(
        college_id="C1",
        name="User",
        email="user@example.com",
        password="secret",
        role=UserRole.STUDENT,
    )

    with pytest.raises(HTTPException) as exc_info:
        user_service.create_user(db, data)

    assert exc_info.value.status_code == 400


def test_create_user_raises_for_duplicate_college_id(mocker):
    empty_query = mocker.Mock()
    empty_query.filter.return_value.first.return_value = None
    duplicate_query = mocker.Mock()
    duplicate_query.filter.return_value.first.return_value = object()
    db = mocker.Mock()
    db.query.side_effect = [empty_query, duplicate_query]
    data = UserCreate(
        college_id="C1",
        name="User",
        email="user@example.com",
        password="secret",
        role=UserRole.STUDENT,
    )

    with pytest.raises(HTTPException) as exc_info:
        user_service.create_user(db, data)

    assert exc_info.value.status_code == 400


def test_create_user_raises_for_invalid_department_id(mocker):
    empty_query = mocker.Mock()
    empty_query.filter.return_value.first.return_value = None
    dept_query = mocker.Mock()
    dept_query.filter.return_value.first.return_value = None
    db = mocker.Mock()
    db.query.side_effect = [empty_query, empty_query, dept_query]
    data = UserCreate(
        college_id="C1",
        name="User",
        email="user@example.com",
        password="secret",
        role=UserRole.STUDENT,
        department_id=5,
    )

    with pytest.raises(HTTPException) as exc_info:
        user_service.create_user(db, data)

    assert exc_info.value.status_code == 400


def test_create_user_hashes_password_and_returns_user(mocker):
    empty_query = mocker.Mock()
    empty_query.filter.return_value.first.return_value = None
    dept_query = mocker.Mock()
    dept_query.filter.return_value.first.return_value = object()
    db = mocker.Mock()
    db.query.side_effect = [empty_query, empty_query, dept_query]
    mocker.patch.object(user_service, "hash_password", return_value="hashed")

    def refresh_side_effect(user):
        user.id = 10

    db.refresh.side_effect = refresh_side_effect
    data = UserCreate(
        college_id="C1",
        name="User",
        email="user@example.com",
        password="secret",
        role=UserRole.STUDENT,
        department_id=2,
    )

    user = user_service.create_user(db, data)

    assert user.password_hash == "hashed"
    assert user.id == 10
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(user)


def test_create_user_rolls_back_on_integrity_error(mocker):
    empty_query = mocker.Mock()
    empty_query.filter.return_value.first.return_value = None
    db = mocker.Mock()
    db.query.side_effect = [empty_query, empty_query]
    db.commit.side_effect = IntegrityError("stmt", "params", "orig")
    mocker.patch.object(user_service, "hash_password", return_value="hashed")
    data = UserCreate(
        college_id="C1",
        name="User",
        email="user@example.com",
        password="secret",
        role=UserRole.STUDENT,
    )

    with pytest.raises(HTTPException) as exc_info:
        user_service.create_user(db, data)

    assert exc_info.value.status_code == 400
    db.rollback.assert_called_once()


def test_get_users_returns_filtered_results_when_role_is_provided(mocker):
    expected = ["staff-user"]
    db = mocker.Mock()
    db.query.return_value.filter.return_value.all.return_value = expected

    assert user_service.get_users(db, role=UserRole.STAFF) == expected


def test_get_users_returns_all_results_without_role_filter(mocker):
    expected = ["all-users"]
    db = mocker.Mock()
    db.query.return_value.all.return_value = expected

    assert user_service.get_users(db) == expected


def test_delete_user_raises_not_found_for_unknown_id(mocker):
    db = mocker.Mock()
    db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        user_service.delete_user(db, user_id=5)

    assert exc_info.value.status_code == 404


def test_delete_user_deletes_related_records_and_user(mocker):
    user = SimpleNamespace(id=8, name="User", college_id="C8")
    # New explicit complaints check query (must return no complaints so we don't 409 early)
    no_complaints_query = mocker.Mock()
    no_complaints_query.filter.return_value.first.return_value = None
    first_query = mocker.Mock()
    first_query.filter.return_value.first.return_value = user
    delete_query_one = mocker.Mock()
    delete_query_one.filter.return_value.delete.return_value = 1
    delete_query_two = mocker.Mock()
    delete_query_two.filter.return_value.delete.return_value = 1
    db = mocker.Mock()
    db.query.side_effect = [first_query, no_complaints_query, delete_query_one, delete_query_two]

    result = user_service.delete_user(db, user_id=8)

    assert "deleted successfully" in result["message"]
    db.delete.assert_called_once_with(user)
    db.commit.assert_called_once()


def test_delete_user_rolls_back_and_returns_constraint_error_message(mocker):
    user = SimpleNamespace(id=8, name="User", college_id="C8")
    # New explicit complaints check (return None so we reach the commit error path)
    no_complaints_query = mocker.Mock()
    no_complaints_query.filter.return_value.first.return_value = None
    first_query = mocker.Mock()
    first_query.filter.return_value.first.return_value = user
    delete_query_one = mocker.Mock()
    delete_query_one.filter.return_value.delete.return_value = 1
    delete_query_two = mocker.Mock()
    delete_query_two.filter.return_value.delete.return_value = 1
    db = mocker.Mock()
    db.query.side_effect = [first_query, no_complaints_query, delete_query_one, delete_query_two]
    db.commit.side_effect = Exception("FOREIGN KEY constraint failed")

    with pytest.raises(HTTPException) as exc_info:
        user_service.delete_user(db, user_id=8)

    # Per requirements we now return 409 Conflict for users that have (or had) related complaint data
    assert exc_info.value.status_code == 409
    assert "associated complaints" in exc_info.value.detail or "Deactivate instead" in exc_info.value.detail
    db.rollback.assert_called_once()


def test_deactivate_user_marks_user_inactive(mocker):
    user = SimpleNamespace(is_active=True)
    db = mocker.Mock()
    db.query.return_value.filter.return_value.first.return_value = user

    updated = user_service.deactivate_user(db, user_id=3)

    assert updated is user
    assert user.is_active is False
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(user)


def test_get_user_by_email_returns_matching_user(mocker):
    user = object()
    db = mocker.Mock()
    db.query.return_value.filter.return_value.first.return_value = user

    assert user_service.get_user_by_email(db, "user@example.com") is user


def test_authenticate_user_returns_user_for_valid_credentials(mocker):
    user = SimpleNamespace(password_hash="hash", is_active=True)
    mocker.patch.object(user_service, "get_user_by_email", return_value=user)
    mocker.patch.object(user_service, "verify_password", return_value=True)

    assert user_service.authenticate_user(mocker.Mock(), "user@example.com", "secret") is user


def test_authenticate_user_raises_for_invalid_credentials(mocker):
    mocker.patch.object(user_service, "get_user_by_email", return_value=None)

    with pytest.raises(HTTPException) as exc_info:
        user_service.authenticate_user(mocker.Mock(), "user@example.com", "secret")

    assert exc_info.value.status_code == 401


def test_authenticate_user_raises_for_inactive_user(mocker):
    user = SimpleNamespace(password_hash="hash", is_active=False)
    mocker.patch.object(user_service, "get_user_by_email", return_value=user)
    mocker.patch.object(user_service, "verify_password", return_value=True)

    with pytest.raises(HTTPException) as exc_info:
        user_service.authenticate_user(mocker.Mock(), "user@example.com", "secret")

    assert exc_info.value.status_code == 403
