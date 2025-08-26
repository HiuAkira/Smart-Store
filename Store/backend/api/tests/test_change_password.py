import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestChangePasswordView:
    @pytest.fixture
    def create_user(self):
        """Tạo người dùng để kiểm thử."""
        user = User.objects.create_user(
            email="testuser@example.com",
            username="testuser@example.com",
            password="oldpassword123"
        )
        return user

    @pytest.fixture
    def authenticated_client(self, create_user):
        """Tạo client đã đăng nhập."""
        client = APIClient()
        client.force_authenticate(user=create_user)
        return client

    def test_change_password_success(self, authenticated_client, create_user):
        """Kiểm tra thay đổi mật khẩu thành công."""
        response = authenticated_client.post("/api/change-password/", data={
            "current_password": "oldpassword123",
            "new_password": "newpassword456"
        })
        assert response.status_code == 200
        assert response.data["message"] == "Đổi mật khẩu thành công."

        # Kiểm tra mật khẩu mới
        create_user.refresh_from_db()
        assert create_user.check_password("newpassword456") is True

    def test_change_password_wrong_current_password(self, authenticated_client):
        """Kiểm tra khi mật khẩu hiện tại không đúng."""
        response = authenticated_client.post("/api/change-password/", data={
            "current_password": "wrongpassword",
            "new_password": "newpassword456"
        })
        assert response.status_code == 400
        assert response.data["message"] == "Mật khẩu hiện tại không đúng."

    def test_change_password_missing_data(self, authenticated_client):
        """Kiểm tra khi dữ liệu không đầy đủ."""
        response = authenticated_client.post("/api/change-password/", data={
            "current_password": "oldpassword123"
        })
        assert response.status_code == 400
        assert "new_password" in response.data

    def test_change_password_unauthenticated(self):
        """Kiểm tra khi người dùng không đăng nhập."""
        client = APIClient()
        response = client.post("/api/change-password/", data={
            "current_password": "oldpassword123",
            "new_password": "newpassword456"
        })
        assert response.status_code == 401
