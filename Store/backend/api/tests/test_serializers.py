import pytest
from django.test import TestCase
from rest_framework import serializers
from api.models.user import User
from api.serializers.user import RegisterSerializer, LoginSerializer, CustomTokenObtainPairSerializer, validate_email
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.mark.django_db
class TestRegisterSerializer(TestCase):
    def test_validate_email_already_exists(self):
        """Test that validation raises error for duplicate email."""
        User.objects.create_user(email='test@example.com', username='test@example.com', password='password123')
        with pytest.raises(serializers.ValidationError) as exc_info:
            validate_email('test@example.com')
        assert "Email này đã được sử dụng" in str(exc_info.value)

    def test_validate_email_unique(self):
        """Test validation for unique email."""
        result = validate_email('new@example.com')
        assert result == 'new@example.com'

    def test_create_user(self):
        """Test creating a user with valid data."""
        serializer = RegisterSerializer(data={
            'email': 'newuser@example.com',
            'name': 'Test User',
            'password': 'password123'
        })
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()

        assert user.email == 'newuser@example.com'
        assert user.username == 'newuser@example.com'
        assert user.name == 'Test User'
        assert user.check_password('password123')
        assert User.objects.filter(email='newuser@example.com').exists()

    def test_create_user_missing_fields(self):
        """Test creating a user with missing required fields."""
        serializer = RegisterSerializer(data={'email': 'test@example.com'})
        assert not serializer.is_valid()
        assert 'password' in serializer.errors


@pytest.mark.django_db
class TestLoginSerializer(TestCase):
    def test_login_serializer_fields(self):
        """Test that LoginSerializer has correct fields."""
        serializer = LoginSerializer()
        expected_fields = {'email', 'password'}
        assert set(serializer.fields.keys()) == expected_fields

    def test_login_serializer_validation(self):
        """Test LoginSerializer with valid data."""
        serializer = LoginSerializer(data={
            'email': 'test@example.com',
            'password': 'password123'
        })
        assert serializer.is_valid(), serializer.errors

    def test_login_serializer_invalid_data(self):
        """Test LoginSerializer with invalid data (missing fields)."""
        serializer = LoginSerializer(data={'email': 'test@example.com'})
        assert not serializer.is_valid()
        assert 'password' in serializer.errors


@pytest.mark.django_db
class TestCustomTokenObtainPairSerializer(TestCase):
    def setUp(self):
        """Set up a test user."""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='test@example.com',
            password='password123'
        )

    def test_validate_success(self):
        """Test successful token generation."""
        serializer = CustomTokenObtainPairSerializer(data={
            'email': 'test@example.com',
            'password': 'password123'
        })
        assert serializer.is_valid(), serializer.errors
        data = serializer.validated_data

        assert 'refresh' in data
        assert 'access' in data

        refresh = RefreshToken(data['refresh'])
        assert refresh['user_id'] == self.user.id

    def test_validate_invalid_email(self):
        """Test validation with non-existent email."""
        serializer = CustomTokenObtainPairSerializer(data={
            'email': 'nonexistent@example.com',
            'password': 'password123'
        })
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_validate_invalid_password(self):
        """Test validation with incorrect password."""
        serializer = CustomTokenObtainPairSerializer(data={
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        assert not serializer.is_valid()
        assert 'password' in serializer.errors

    def test_username_field_is_email(self):
        """Verify that username_field is correctly set to email."""
        serializer = CustomTokenObtainPairSerializer()
        assert serializer.username_field == 'email'
