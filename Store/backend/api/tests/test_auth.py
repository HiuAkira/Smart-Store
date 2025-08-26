from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from ..models.user import User

class AuthTest(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')  # Đảm bảo tên url là 'register'
        self.login_url = reverse('token_obtain_pair')  # Đảm bảo tên url là 'token_obtain_pair'
        self.user_data = {
            'email': 'test@example.com',
            'name': 'Test User',
            'password': 'testpassword123',
            'role': 'member'
        }
        User.objects.create_user(username='exist@example.com', email='exist@example.com', name='Exist', password='password', role='member')

    def test_register_success(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        print("[REGISTER SUCCESS] Input:", self.user_data)
        print("[REGISTER SUCCESS] Output:", response.status_code, response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Đăng ký thành công')

    def test_register_fail_duplicate_email(self):
        data = self.user_data.copy()
        data['email'] = 'exist@example.com'
        response = self.client.post(self.register_url, data, format='json')
        print("[REGISTER DUPLICATE EMAIL] Input:", data)
        print("[REGISTER DUPLICATE EMAIL] Output:", response.status_code, response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        User.objects.create_user(username='login@example.com', email='login@example.com', name='Login', password='testpass', role='member')
        login_input = {'email': 'login@example.com', 'password': 'testpass'}
        response = self.client.post(self.login_url, login_input, format='json')
        print("[LOGIN SUCCESS] Input:", login_input)
        print("[LOGIN SUCCESS] Output:", response.status_code, response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_fail_wrong_password(self):
        User.objects.create_user(username='fail@example.com', email='fail@example.com', name='Fail', password='rightpass', role='member')
        login_input = {'email': 'fail@example.com', 'password': 'wrongpass'}
        response = self.client.post(self.login_url, login_input, format='json')
        print("[LOGIN WRONG PASSWORD] Input:", login_input)
        print("[LOGIN WRONG PASSWORD] Output:", response.status_code, response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) 