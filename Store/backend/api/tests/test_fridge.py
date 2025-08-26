#tests/test_fridge_views.py

from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import date, timedelta

User = get_user_model()

# Import các models của bạn
from ..models.group import Group
from ..models.fridge import Fridge
from ..models.add_to_fridge import AddToFridge
from ..models.product_catalog import ProductCatalog
from ..models.categories import Categories
from ..models.in_model import In

# Hàm trợ giúp để tạo dữ liệu test
def create_test_data():
    """Tạo dữ liệu test chung cho các test case."""
    user = User.objects.create_user(username='testuser', email='testuser@example.com', password='password123')
    group = Group.objects.create(groupName='Test Family')
    In.objects.create(user=user, group=group)
    
    category = Categories.objects.create(categoryName='Thực phẩm tươi sống')
    
    p1 = ProductCatalog.objects.create(productName='Sữa tươi', unit='hộp', category=category, shelfLife=7)
    p2 = ProductCatalog.objects.create(productName='Trứng gà', unit='quả', category=category, shelfLife=30)
    p3 = ProductCatalog.objects.create(productName='Thịt bò', unit='kg', category=category, shelfLife=3)
    p4 = ProductCatalog.objects.create(productName='Cà chua', unit='kg', isCustom=True, category=category, shelfLife=5)


    fridge, _ = Fridge.objects.get_or_create(group=group)
    
    today = date.today()
    # Các sản phẩm trong tủ lạnh
    AddToFridge.objects.create(fridge=fridge, product=p1, quantity=2, expiredDate=today) # Hết hạn hôm nay
    AddToFridge.objects.create(fridge=fridge, product=p2, quantity=10, expiredDate=today + timedelta(days=1)) # Hết hạn ngày mai
    AddToFridge.objects.create(fridge=fridge, product=p3, quantity=1, expiredDate=today + timedelta(days=3)) # Hết hạn trong 3 ngày
    AddToFridge.objects.create(fridge=fridge, product=p4, quantity=1, expiredDate=today + timedelta(days=10)) # Còn lâu mới hết hạn

    return user, group, fridge

# =================================================================
# Test cho FridgeNotificationView
# =================================================================
class FridgeNotificationViewTest(APITestCase):
    def setUp(self):
        self.user, self.group, self.fridge = create_test_data()
        self.url = reverse('fridge-notifications')
        self.client.force_authenticate(user=self.user)

    def test_get_expiring_items_notification(self):
        """Kiểm tra lấy danh sách các sản phẩm sắp hết hạn trong vòng 3 ngày."""
        response = self.client.get(self.url, {'group_id': self.group.groupID})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_expiring'], 3) # Chỉ có 3 sản phẩm sắp hết hạn

        items = response.data['items']
        self.assertEqual(items[0]['urgency'], 'critical') # Sữa tươi hết hạn hôm nay
        self.assertEqual(items[0]['urgency_text'], 'Hết hạn hôm nay')
        
        self.assertEqual(items[1]['urgency'], 'high') # Trứng gà hết hạn ngày mai
        self.assertEqual(items[1]['urgency_text'], 'Hết hạn ngày mai')
        
        self.assertEqual(items[2]['urgency'], 'medium') # Thịt bò hết hạn trong 3 ngày
        self.assertEqual(items[2]['urgency_text'], 'Hết hạn trong 3 ngày')

    def test_get_notification_no_group_id(self):
        """Kiểm tra API tự động lấy nhóm đầu tiên của user nếu không có group_id."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_expiring'], 3)

    def test_get_notification_user_not_in_group(self):
        """Kiểm tra trường hợp user không thuộc nhóm nào."""
        new_user = User.objects.create_user(username='lonelyuser', email='lonely@example.com', password='password')
        self.client.force_authenticate(user=new_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, "User không thuộc nhóm nào")

# =================================================================
# Test cho FridgeDetailView
# =================================================================
class FridgeDetailViewTest(APITestCase):
    def setUp(self):
        self.user, self.group, self.fridge = create_test_data()
        self.list_create_url = reverse('fridge-list-create')
        self.client.force_authenticate(user=self.user)

    def test_get_fridge_items_and_stats(self):
        """Kiểm tra lấy danh sách tất cả sản phẩm trong tủ lạnh và thống kê."""
        response = self.client.get(self.list_create_url, {'group_id': self.group.groupID})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 4) # Có 4 sản phẩm trong tủ lạnh
        
        stats = response.data['stats']
        self.assertEqual(stats['total_products'], 4)
        self.assertEqual(stats['expired_products'], 0) # Chưa có sản phẩm nào hết hạn (lt today)
        self.assertEqual(stats['expiring_soon_products'], 2) # Hết hạn hôm nay hoặc ngày mai (lte tomorrow)
        self.assertIn('popular_categories', stats)

    def test_get_single_fridge_item(self):
        """Kiểm tra lấy chi tiết một sản phẩm trong tủ lạnh."""
        item = AddToFridge.objects.first()
        detail_url = reverse('fridge-detail-update-delete', kwargs={'id': item.id})
        response = self.client.get(detail_url, {'group_id': self.group.groupID})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['product_name'], item.product.productName)

    def test_add_new_product_from_catalog(self):
        """Kiểm tra thêm sản phẩm mới vào tủ lạnh (sản phẩm đã có trong catalog)."""
        new_product = ProductCatalog.objects.create(productName='Phô mai', unit='miếng', shelfLife=30)
        payload = {
            "productName": "Phô mai",
            "product_id": new_product.productID,
            "expiredDate": (date.today() + timedelta(days=20)).isoformat(),
            "quantity": 5,
        }
        response = self.client.post(self.list_create_url + f"?group_id={self.group.groupID}", payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AddToFridge.objects.count(), 5) # Ban đầu có 4, thêm 1 là 5

    def test_add_custom_product(self):
        """Kiểm tra thêm sản phẩm mới (tự nhập) và tạo mới trong ProductCatalog."""
        category = Categories.objects.first()
        payload = {
            "productName": "Cá hồi", # Sản phẩm chưa có trong catalog
            "expiredDate": (date.today() + timedelta(days=5)).isoformat(),
            "quantity": 1,
            "unit": "kg",
            "category_id": category.categoryID
        }
        response = self.client.post(self.list_create_url + f"?group_id={self.group.groupID}", payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ProductCatalog.objects.filter(productName='Cá hồi', isCustom=True).exists())
        self.assertEqual(AddToFridge.objects.count(), 5)

    def test_add_product_with_past_expired_date(self):
        """Kiểm tra lỗi khi thêm sản phẩm với ngày hết hạn trong quá khứ."""
        payload = {
            "productName": "Sản phẩm hỏng",
            "expiredDate": (date.today() - timedelta(days=1)).isoformat(),
            "quantity": 1,
            "unit": "gói"
        }
        response = self.client.post(self.list_create_url + f"?group_id={self.group.groupID}", payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, "Ngày hết hạn phải từ hôm nay trở đi")
    
    def test_add_existing_product_in_fridge(self):
        """Kiểm tra lỗi khi thêm sản phẩm đã có sẵn trong tủ lạnh."""
        existing_product = ProductCatalog.objects.get(productName='Sữa tươi')
        payload = {
            "product_id": existing_product.productID,
            "productName": "Sữa tươi",
            "expiredDate": (date.today() + timedelta(days=10)).isoformat(),
            "quantity": 1,
        }
        response = self.client.post(self.list_create_url + f"?group_id={self.group.groupID}", payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, "Sản phẩm này đã có trong tủ lạnh của bạn.")

    def test_patch_update_fridge_item(self):
        """Kiểm tra cập nhật (PATCH) một sản phẩm trong tủ lạnh."""
        item = AddToFridge.objects.get(product__productName='Trứng gà')
        update_url = reverse('fridge-detail-update-delete', kwargs={'id': item.id})
        payload = {
            "quantity": 20,
            "location": "freeze"
        }
        response = self.client.patch(update_url + f"?group_id={self.group.groupID}", payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 20)
        self.assertEqual(response.data['location'], 'freeze')

        item.refresh_from_db()
        self.assertEqual(item.quantity, 20)
        
    def test_delete_fridge_item(self):
        """Kiểm tra xóa một sản phẩm khỏi tủ lạnh."""
        item = AddToFridge.objects.first()
        delete_url = reverse('fridge-detail-update-delete', kwargs={'id': item.id})
        response = self.client.delete(delete_url + f"?group_id={self.group.groupID}")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(AddToFridge.objects.count(), 3) # Ban đầu có 4, xóa 1 còn 3