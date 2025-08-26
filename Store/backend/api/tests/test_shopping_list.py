
# ===============================================================
# api/tests/test_shopping_lists.py (Corrected)
# ===============================================================

from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta # Import timedelta
from api.models.shopping_list import ShoppingList
from api.models.add_to_list import AddToList
from api.models import ProductCatalog, Categories
from api.models import Group
from datetime import date

User = get_user_model()

class ShoppingListTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user1', email='user1@test.com', password='password')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.group = Group.objects.create(groupName='Test Group')
        self.shopping_list = ShoppingList.objects.create(
            user=self.user, 
            group=self.group, 
            listName='List B',
            date=date.today(),
            type='day'
        )

    def test_create_shopping_list(self):
        url = reverse('shopping-list')
        data = {
            'group': self.group.groupID, 
            'listName': 'Test List',
            'date': date.today().isoformat(),
            'type': 'day'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['listName'], 'Test List')

    def test_get_shopping_lists(self):
        ShoppingList.objects.create(
            user=self.user, 
            group=self.group, 
            listName='List A',
            date=date.today(),
            type='day'
        )
        url = reverse('shopping-list')
        response = self.client.get(url, {'group_id': self.group.groupID})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)  # Có 2 list: List B từ setUp và List A

class ShoppingListDetailTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user2', email='user2@test.com', password='pass')
        self.client.force_authenticate(self.user)
        self.group = Group.objects.create(groupName='Test Group 2')
        self.shopping_list = ShoppingList.objects.create(
            user=self.user, 
            group=self.group, 
            listName='List B',
            date=date.today(),
            type='day'
        )

    def test_get_list_detail(self):
        url = reverse('shopping-list-detail', args=[self.shopping_list.listID])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['list']['listName'], 'List B')

    def test_update_shopping_list(self):
        url = reverse('shopping-list-detail', args=[self.shopping_list.listID])
        response = self.client.put(url, {'listName': 'Updated Title'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['listName'], 'Updated Title')

    def test_delete_shopping_list(self):
        url = reverse('shopping-list-detail', args=[self.shopping_list.listID])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class AddItemTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user3', email='user3@test.com', password='pass')
        self.client.force_authenticate(self.user)
        self.group = Group.objects.create(groupName='Test Group 3')
        self.list = ShoppingList.objects.create(
            user=self.user, 
            group=self.group, 
            listName='List C',
            date=date.today(),
            type='day'
        )
        self.category = Categories.objects.create(categoryName='Dairy')
        self.product = ProductCatalog.objects.create(
            productName='Milk', 
            original_price=10,
            price=10,
            unit='lít',
            shelfLife=7,
            category=self.category
        )

    def test_add_item_to_list(self):
        url = reverse('add-to-list', args=[self.list.listID])
        response = self.client.post(url, {
            'product': self.product.productID,
            'quantity': 2
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['data']['quantity'], 2)

class UpdateItemTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user4', email='user4@test.com', password='pass')
        self.client.force_authenticate(self.user)
        self.group = Group.objects.create(groupName='Test Group 4')
        self.list = ShoppingList.objects.create(
            user=self.user, 
            group=self.group, 
            listName='List D',
            date=date.today(),
            type='day'
        )
        self.category = Categories.objects.create(categoryName='Protein')
        self.product = ProductCatalog.objects.create(
            productName='Egg', 
            original_price=5,
            price=5,
            unit='vỉ',
            shelfLife=14,
            category=self.category
        )
        self.item = AddToList.objects.create(
            list=self.list, 
            product=self.product, 
            quantity=3,
            status='pending'
        )

    def test_update_item_quantity(self):
        """Ensure we can update the quantity of an item in the list."""
        url = reverse('add-to-list-detail', args=[self.list.listID, self.item.id])
        data = {'quantity': 5}
        # Fix: Use PATCH for partial updates, which is better practice.
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify by reloading the object, which is more reliable
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 5)

    def test_delete_item(self):
        """Ensure we can delete an item from the list."""
        url = reverse('add-to-list-detail', args=[self.list.listID, self.item.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AddToList.objects.filter(id=self.item.id).exists())


class ToggleStatusTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user5', email='user5@test.com', password='pass')
        self.client.force_authenticate(self.user)
        self.group = Group.objects.create(groupName='Test Group 5')
        self.list = ShoppingList.objects.create(
            user=self.user, 
            group=self.group, 
            listName='List E',
            date=date.today(),
            type='day'
        )
        self.category = Categories.objects.create(categoryName='Grain')
        self.product = ProductCatalog.objects.create(
            productName='Rice', 
            original_price=8,
            price=8,
            unit='kg',
            shelfLife=365,
            category=self.category
        )
        self.item = AddToList.objects.create(
            list=self.list, 
            product=self.product, 
            quantity=1, 
            status='pending'
        )

    def test_toggle_status(self):
        url = reverse('toggle-item-status', args=[self.list.listID, self.item.id])
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify by reloading the object
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, 'purchased')


class StatsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user6', email='user6@test.com', password='pass')
        self.client.force_authenticate(self.user)
        self.group = Group.objects.create(groupName='Test Group 6')
        self.category = Categories.objects.create(categoryName='Dairy')
        self.product = ProductCatalog.objects.create(
            productName='Cheese', 
            original_price=15,
            price=15,
            unit='kg',
            shelfLife=30,
            category=self.category
        )
        self.list = ShoppingList.objects.create(
            user=self.user, 
            group=self.group, 
            listName='Stats List',
            date=date.today(),
            type='day'
        )
        AddToList.objects.create(
            list=self.list, 
            product=self.product, 
            quantity=3, 
            status='purchased'
        )

    def test_purchased_stats(self):
        url = reverse('purchased-shopping-stats')
        response = self.client.get(url, {'group_id': self.group.groupID})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_quantity'], 3)

    def test_stats_by_category(self):
        url = reverse('purchased-stats-by-category')
        response = self.client.get(url, {'group_id': self.group.groupID})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['name'], 'Dairy')

from rest_framework import serializers
from ..models.add_to_list import AddToList
from ..models.shopping_list import ShoppingList
from api.serializers.product_catalog_serializer import ProductCatalogSerializer
from api.serializers.shopping_serializers import ShoppingListSerializer
from api.models.product_catalog import ProductCatalog


class AddToListSerializer(serializers.ModelSerializer):
    """Serializer for items added to a shopping list."""
    product_details = ProductCatalogSerializer(source='product', read_only=True)
    
    class Meta:
        model = AddToList
        fields = ['id', 'list', 'product', 'quantity', 'status', 'product_details']
        extra_kwargs = {
            'product': {'write_only': True}
        }

class ShoppingListSerializer(serializers.ModelSerializer):
    """Serializer for the ShoppingList model."""
    class Meta:
        model = ShoppingList
        fields = ['listID', 'createdAt', 'listName', 'date', 'group', 'user', 'type']
        read_only_fields = ['listID', 'createdAt', 'user']