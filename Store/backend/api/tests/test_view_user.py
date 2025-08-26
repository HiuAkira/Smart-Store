import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from ..models.user import User

# --- Fixtures: Định nghĩa các đối tượng mẫu cho test ---

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user():
    return User.objects.create_user(
        username="admin",
        email="admin@example.com",
        password="password123",
        role="admin",
        is_active=True
    )

@pytest.fixture
def regular_user():
    return User.objects.create_user(
        username="user1",
        email="user1@example.com",
        password="password123",
        role="member",
        is_active=True
    )

@pytest.fixture
def inactive_user():
    return User.objects.create_user(
        username="inactive_user",
        email="inactive@example.com",
        password="password123",
        role="member",
        is_active=False
    )

# --- Tests: Các bài test cho User API ---

@pytest.mark.django_db
def test_get_user_list(api_client, admin_user, regular_user):
    api_client.force_authenticate(user=admin_user)
    url = reverse('user-list')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    user_emails = [user["email"] for user in response.data]
    assert admin_user.email in user_emails
    assert regular_user.email in user_emails

@pytest.mark.django_db
def test_get_user_me(api_client, regular_user):
    api_client.force_authenticate(user=regular_user)
    url = reverse('user-me')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['success'] is True
    assert 'user' in response.data

    user_data = response.data['user']
    assert user_data['id'] == regular_user.id
    assert user_data['username'] == regular_user.username
    assert user_data['email'] == regular_user.email
    assert user_data['role'] == regular_user.role

@pytest.mark.django_db
def test_update_user_me(api_client, regular_user):
    api_client.force_authenticate(user=regular_user)
    url = reverse('user-update')
    data = {"name": "Updated Name", "phone": "123456789"}
    response = api_client.put(url, data)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["user"]["name"] == "Updated Name"
    assert response.data["user"]["phone"] == "123456789"

@pytest.mark.django_db
def test_get_user_detail(api_client, admin_user, regular_user):
    api_client.force_authenticate(user=admin_user)
    url = f"/api/users/{regular_user.id}/"
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert "data" in response.data
    
    user_data = response.data["data"]
    assert user_data['id'] == regular_user.id
    assert user_data['email'] == regular_user.email
    assert user_data['username'] == regular_user.username
    assert user_data['role'] == regular_user.role
    assert 'password' not in user_data

@pytest.mark.django_db
def test_update_user_detail(api_client, admin_user, regular_user):
    api_client.force_authenticate(user=admin_user)
    url = f"/api/users/{regular_user.id}/"
    data = {"name": "Admin Updated", "email": "new_email@example.com"}
    response = api_client.patch(url, data)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["data"]["name"] == "Admin Updated"
    assert response.data["data"]["email"] == "new_email@example.com"

# @pytest.mark.django_db
# def test_delete_user(api_client, admin_user, regular_user):
#     api_client.force_authenticate(user=admin_user)
#     url = f"/api/users/{regular_user.id}/"
#     response = api_client.delete(url)

#     assert response.status_code == status.HTTP_204_NO_CONTENT
#     assert User.objects.filter(id=regular_user.id).exists() is False

# @pytest.mark.django_db
# def test_update_user_status(api_client, admin_user, regular_user):
#     api_client.force_authenticate(user=admin_user)
#     url = f"/api/users/{regular_user.id}/status/"
#     data = {"is_active": False}
#     response = api_client.patch(url, data)

#     assert response.status_code == status.HTTP_200_OK
#     assert response.data["data"]["is_active"] is False

# @pytest.mark.django_db
# def test_update_user_role(api_client, admin_user, regular_user):
#     api_client.force_authenticate(user=admin_user)
#     url = f"/api/users/{regular_user.id}/role/"
#     data = {"role": "housekeeper"}
#     response = api_client.patch(url, data)

#     assert response.status_code == status.HTTP_200_OK
#     assert response.data["data"]["role"] == "housekeeper"

# @pytest.mark.django_db
# def test_prohibit_role_update_on_self(api_client, admin_user):
#     api_client.force_authenticate(user=admin_user)
#     url = f"/api/users/{admin_user.id}/role/"
#     data = {"role": "housekeeper"}
#     response = api_client.patch(url, data)

#     assert response.status_code == status.HTTP_400_BAD_REQUEST
#     assert response.data["message"] == "Không thể thay đổi vai trò của chính mình"