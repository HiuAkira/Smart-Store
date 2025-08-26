from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from ..models.user import User

class UserApiTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin', 
            email='admin@example.com', 
            name='Admin', 
            password='adminpass', 
            role='admin',
            is_staff=True
        )
        self.user = User.objects.create_user(
            username='user', 
            email='user@example.com', 
            name='User', 
            password='userpass', 
            role='member'
        )
        self.client.force_authenticate(user=self.admin)

    def test_get_user_list(self):
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_get_me(self):
        url = reverse('user-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], 'admin@example.com')

    def test_update_me(self):
        url = reverse('user-update')
        data = {'name': 'Admin Updated'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['name'], 'Admin Updated')

    def test_get_user_detail(self):
        url = reverse('user-detail', kwargs={'user_id': self.user.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['email'], 'user@example.com')

    def test_patch_user_detail(self):
        url = reverse('user-detail', kwargs={'user_id': self.user.id})
        data = {'name': 'User Patched'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['name'], 'User Patched')

    def test_delete_user(self):
        url = reverse('user-detail', kwargs={'user_id': self.user.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Xóa người dùng thành công')

    def test_patch_user_status(self):
        url = reverse('user-status', kwargs={'user_id': self.user.id})
        response = self.client.patch(url, {'is_active': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['data']['is_active'])

    def test_patch_user_role(self):
        url = reverse('user-role', kwargs={'user_id': self.user.id})
        response = self.client.patch(url, {'role': 'housekeeper'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['role'], 'housekeeper') 