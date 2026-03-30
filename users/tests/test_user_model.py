import pytest

from app.models.user import User


def test_user_validate_ok():
    u = User.from_dict(
        {"first_name": " Ana ", "last_name": " Novak ", "email": " Ana@Example.COM "}
    )
    u.validate()
    assert u.first_name == "Ana"
    assert u.last_name == "Novak"
    assert u.email == "ana@example.com"


@pytest.mark.parametrize(
    "payload",
    [
        {"last_name": "N", "email": "a@b.com"},
        {"first_name": "A", "email": "a@b.com"},
        {"first_name": "A", "last_name": "B"},
        {"first_name": "A", "last_name": "B", "email": "bad"},
    ],
)
def test_user_validate_errors(payload):
    u = User.from_dict(payload)
    with pytest.raises(ValueError):
        u.validate()
