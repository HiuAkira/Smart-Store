from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date
from django.contrib.auth import get_user_model

from api.models.group import Group
from api.models.recipe import Recipe
from api.models.meal_plan import MealPlan
from api.models.have import Have
from api.models.in_model import In

User = get_user_model()


class MealPlanAPITests(APITestCase):
    def setUp(self):
        # Users
        self.user = User.objects.create_user(username="u1", email="u1@example.com", password="pass")
        self.other_user = User.objects.create_user(username="u2", email="u2@example.com", password="pass")

        # Group & membership
        self.group = Group.objects.create(groupName="Gia đình Test")
        In.objects.create(user=self.user, group=self.group)

        # URLs
        self.base_url = reverse("meal-plan-list")  # /meal-plans/

        # Sample recipe
        self.recipe = Recipe.objects.create(recipeName="Canh chua", description="Ngon", instruction="Nấu", isCustom=False)

    def test_create_basic_meal_plan(self):
        """POST /meal-plans/ với planned_meals rỗng -> tạo 1 meal plan"""
        payload = {
            "plan_name": "Kế hoạch 1",
            "start_date": date.today().isoformat(),
            "description": "Test plan",
            "planned_meals": [],
            "group": self.group.groupID,
            "user": self.user.id,
        }
        print("INPUT (Create Meal Plan):", payload)
        response = self.client.post(self.base_url, payload, format="json")
        print("OUTPUT (Create Meal Plan):", response.status_code, response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MealPlan.objects.count(), 1)
        plan = MealPlan.objects.first()
        self.assertEqual(plan.plan_name, payload["plan_name"])

    def test_get_meal_plan_list_filter_group(self):
        """GET /meal-plans/?group_id= chỉ trả về kế hoạch thuộc group"""
        other_group = Group.objects.create(groupName="Group 2")
        MealPlan.objects.create(plan_name="A", start_date=date.today(), mealType="breakfast", day_of_week=0, group=self.group, user=self.user)
        MealPlan.objects.create(plan_name="B", start_date=date.today(), mealType="lunch", day_of_week=0, group=other_group, user=self.user)

        url = f"{self.base_url}?group_id={self.group.groupID}"
        print("INPUT (List Meal Plans by Group): GET", url)
        response = self.client.get(self.base_url, {"group_id": self.group.groupID})
        print("OUTPUT (List Meal Plans):", response.status_code, response.data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {p["plan_name"] for p in response.data["data"]}
        self.assertIn("A", returned_ids)
        self.assertNotIn("B", returned_ids)

    def test_meal_plan_detail_update_delete(self):
        """Kiểm tra GET, PUT, DELETE trên /meal-plans/<pk>/"""
        plan = MealPlan.objects.create(plan_name="Plan D", start_date=date.today(), mealType="dinner", day_of_week=0, group=self.group, user=self.user)
        detail_url = reverse("meal-plan-detail", kwargs={"pk": plan.planID})

        # GET
        print("INPUT (Get Meal Plan Detail): GET", detail_url)
        res = self.client.get(detail_url)
        print("OUTPUT (Get Meal Plan):", res.status_code, res.data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["plan_name"], "Plan D")

        # PUT update description
        update_payload = {"description": "Updated"}
        print("INPUT (Update Meal Plan): PUT", detail_url, update_payload)
        res = self.client.put(detail_url, update_payload, format="json")
        print("OUTPUT (Update Meal Plan):", res.status_code, res.data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        plan.refresh_from_db()
        self.assertEqual(plan.description, "Updated")

        # DELETE
        print("INPUT (Delete Meal Plan): DELETE", detail_url)
        res = self.client.delete(detail_url)
        print("OUTPUT (Delete Meal Plan):", res.status_code)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(MealPlan.objects.filter(planID=plan.planID).exists())

    def test_add_recipe_to_meal_plan(self):
        """POST /meal-plans/<pk>/recipes/ thêm recipe"""
        plan = MealPlan.objects.create(plan_name="Plan R", start_date=date.today(), mealType="breakfast", day_of_week=0, group=self.group, user=self.user)
        recipes_url = reverse("meal-plan-recipes", kwargs={"pk": plan.planID})
        payload = {"recipe_id": self.recipe.recipeID}

        print("INPUT (Add Recipe to Meal Plan): POST", recipes_url, payload)
        res = self.client.post(recipes_url, payload, format="json")
        print("OUTPUT (Add Recipe):", res.status_code, res.data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(Have.objects.filter(plan=plan, recipe=self.recipe).exists())

        # Duplicate add
        print("INPUT (Duplicate Add Recipe): POST", recipes_url, payload)
        res_dup = self.client.post(recipes_url, payload, format="json")
        print("OUTPUT (Duplicate Add Recipe):", res_dup.status_code, res_dup.data)
        self.assertEqual(res_dup.status_code, status.HTTP_200_OK)
        self.assertFalse(res_dup.data.get("success", True))
        