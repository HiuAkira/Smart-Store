from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from api.models.product_catalog import ProductCatalog
from api.models.categories import Categories

User = get_user_model()


class ProductCatalogAPITests(APITestCase):
    def setUp(self):
        # User cho search endpoint
        self.user = User.objects.create_user(username="searcher", email="s@example.com", password="pass")

        # Category
        self.category = Categories.objects.create(categoryName="Đồ khô")

        # Sample product
        self.product = ProductCatalog.objects.create(
            productName="Gạo ST25",
            original_price=100,
            discount=10,
            unit="kg",
            shelfLife=365,
            category=self.category,
        )

        # URLs
        self.list_url = reverse("product-catalog")  # /products/
        self.detail_url = reverse("product-detail", kwargs={"pk": self.product.productID})
        self.price_url = reverse("product-price", kwargs={"pk": self.product.productID})
        self.search_url = reverse("product-search")

    def test_get_product_list(self):
        """GET /products/ trả về danh sách sản phẩm"""
        print("INPUT (Get Product List): GET", self.list_url)
        res = self.client.get(self.list_url)
        print("OUTPUT (Product List):", res.status_code, res.data)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_filter_product_by_category(self):
        """GET /products/?category= lọc theo category"""
        print("INPUT (Filter by Category): GET", self.list_url, {"category": self.category.categoryID})
        res = self.client.get(self.list_url, {"category": self.category.categoryID})
        print("OUTPUT (Filtered Products):", res.status_code, res.data)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(all(p["categoryID"] == self.category.categoryID for p in res.data))

    def test_create_product_success(self):
        """POST /products/ tạo sản phẩm mới"""
        payload = {
            "productName": "Muối i-ốt",
            "original_price": 20,
            "discount": 0,
            "unit": "gói",
            "shelfLife": 720,
            "category": self.category.categoryID,
        }
        print("INPUT (Create Product): POST", self.list_url, payload)
        res = self.client.post(self.list_url, payload, format="multipart")
        print("OUTPUT (Create Product):", res.status_code, res.data)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ProductCatalog.objects.filter(productName="Muối i-ốt").exists())

    def test_product_detail_put_delete(self):
        """PUT và DELETE trên /products/<pk>/"""
        update_payload = {"discount": 5}
        print("INPUT (Update Product): PUT", self.detail_url, update_payload)
        res_put = self.client.put(self.detail_url, update_payload, format="multipart")
        print("OUTPUT (Update Product):", res_put.status_code, res_put.data)

        self.assertEqual(res_put.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.discount, 5)

        print("INPUT (Delete Product): DELETE", self.detail_url)
        res_del = self.client.delete(self.detail_url)
        print("OUTPUT (Delete Product):", res_del.status_code)

        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ProductCatalog.objects.filter(productID=self.product.productID).exists())

    def test_product_price_endpoint(self):
        """GET /products/<pk>/price/ trả về thông tin giá"""
        print("INPUT (Product Price): GET", self.price_url)
        res = self.client.get(self.price_url)
        print("OUTPUT (Product Price):", res.status_code, res.data)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["productID"], self.product.productID)
        self.assertIn("discount_amount", res.data)

    def test_search_requires_auth_and_returns_results(self):
        """/products/search/ yêu cầu auth và trả kết quả đúng"""
        # Chưa đăng nhập
        print("INPUT (Search Without Auth): GET", self.search_url, {"q": "Gạo"})
        res_unauth = self.client.get(self.search_url, {"q": "Gạo"})
        print("OUTPUT (Search Without Auth):", res_unauth.status_code)

        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # Đăng nhập rồi tìm kiếm
        self.client.force_authenticate(user=self.user)
        print("INPUT (Search With Auth): GET", self.search_url, {"q": "Gạo"})
        res = self.client.get(self.search_url, {"q": "Gạo"})
        print("OUTPUT (Search With Auth):", res.status_code, res.data)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(any(p["productID"] == self.product.productID for p in res.data))
