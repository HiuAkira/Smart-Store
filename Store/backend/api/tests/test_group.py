from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from api.models.group import Group
from api.models.in_model import In

User = get_user_model()


class GroupAPITests(APITestCase):
    def setUp(self):
        # Tạo hai user
        self.user1 = User.objects.create_user(username="user1", email="user1@example.com", password="password1")
        self.user2 = User.objects.create_user(username="user2", email="user2@example.com", password="password2")

        # URLs
        self.list_url = reverse("group-list")
        self.create_url = reverse("group-create")

    def test_create_group_success(self):
        """POST /groups/create/ tạo nhóm thành công"""
        self.client.force_authenticate(user=self.user1)
        payload = {
            "groupName": "Gia đình A",
            "description": "Nhóm test"
        }
        print("INPUT (Create Group):", payload)
        response = self.client.post(self.create_url, payload, format="json")
        print("OUTPUT (Create Group):", response.status_code, response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Group.objects.count(), 1)
        group = Group.objects.first()
        self.assertEqual(group.groupName, payload["groupName"])
        self.assertTrue(In.objects.filter(user=self.user1, group=group).exists())

    def test_group_list_returns_only_joined_groups(self):
        """GET /groups/ chỉ trả về nhóm mà user đăng nhập là thành viên"""
        g1 = Group.objects.create(groupName="Nhóm 1")
        g2 = Group.objects.create(groupName="Nhóm 2")
        In.objects.create(user=self.user1, group=g1)
        In.objects.create(user=self.user2, group=g2)

        self.client.force_authenticate(user=self.user1)
        print("INPUT (List Groups): GET", self.list_url)
        response = self.client.get(self.list_url)
        print("OUTPUT (List Groups):", response.status_code, response.data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {g["groupID"] for g in response.data}
        self.assertIn(g1.groupID, returned_ids)
        self.assertNotIn(g2.groupID, returned_ids)

    def test_join_group_success(self):
        """POST /groups/<id>/join/ cho phép user tham gia nhóm"""
        group = Group.objects.create(groupName="Nhóm 3")
        self.client.force_authenticate(user=self.user2)
        join_url = reverse("group-join", kwargs={"group_id": group.groupID})
        print("INPUT (Join Group): POST", join_url)
        response = self.client.post(join_url)
        print("OUTPUT (Join Group):", response.status_code, response.data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(In.objects.filter(user=self.user2, group=group).exists())

    def test_join_group_already_member(self):
        """Nếu user đã trong nhóm, trả về 400"""
        group = Group.objects.create(groupName="Nhóm 4")
        In.objects.create(user=self.user2, group=group)
        self.client.force_authenticate(user=self.user2)
        join_url = reverse("group-join", kwargs={"group_id": group.groupID})
        print("INPUT (Join Group - Already Member): POST", join_url)
        response = self.client.post(join_url)
        print("OUTPUT (Join Group - Already Member):", response.status_code, response.data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_join_group_not_found(self):
        """Tham gia nhóm không tồn tại trả về 404"""
        self.client.force_authenticate(user=self.user1)
        join_url = reverse("group-join", kwargs={"group_id": 9999})
        print("INPUT (Join Group - Not Found): POST", join_url)
        response = self.client.post(join_url)
        print("OUTPUT (Join Group - Not Found):", response.status_code, response.data)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
