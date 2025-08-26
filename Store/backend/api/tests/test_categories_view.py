import pytest
from rest_framework.test import APIClient
from rest_framework import status
from ..models.categories import Categories

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_category():
    category = Categories.objects.create(categoryName='Electronics')
    return category

class TestCategoriesView:

    def test_get_all_categories(self, api_client, create_category):
        url = "/api/categories/"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert response.data[0]['categoryName'] == create_category.categoryName

    def test_create_category_success(self, api_client):
        url = "/api/categories/"
        data = {'categoryName': 'Books'}
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Categories.objects.count() == 1
        assert Categories.objects.get().categoryName == 'Books'

    def test_create_category_invalid_data(self, api_client):
        url = "/api/categories/"
        data = {}
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Categories.objects.count() == 0

class TestCategoriesDetailView:

    def test_get_category_detail_success(self, api_client, create_category):
        url = f"/api/categories/{create_category.categoryID}/"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['categoryName'] == create_category.categoryName

    def test_get_category_detail_not_found(self, api_client):
        url = "/api/categories/999/"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_category_success(self, api_client, create_category):
        url = f"/api/categories/{create_category.categoryID}/"
        data = {'categoryName': 'Updated Electronics'}
        response = api_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        create_category.refresh_from_db()
        assert create_category.categoryName == 'Updated Electronics'

    def test_update_category_invalid_data(self, api_client, create_category):
        url = f"/api/categories/{create_category.categoryID}/"
        data = {'categoryName': ''}
        response = api_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_category_success(self, api_client, create_category):
        assert Categories.objects.count() == 1
        url = f"/api/categories/{create_category.categoryID}/"
        response = api_client.delete(url)

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]
        assert Categories.objects.count() == 0

    def test_delete_category_not_found(self, api_client):
        url = "/api/categories/999/"
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND