from rest_framework import serializers
from ..models.meal_plan import MealPlan
from ..models.have import Have
from .recipe_serializers import RecipeSerializer

class MealPlanSerializer(serializers.ModelSerializer):
    recipes = serializers.SerializerMethodField()
    
    class Meta:
        model = MealPlan
        fields = ['planID', 'plan_name', 'start_date', 'description', 'mealType', 'day_of_week', 'group', 'user', 'recipes', 'created_at', 'updated_at']
        read_only_fields = ['planID', 'created_at', 'updated_at']
    
    def get_recipes(self, obj):
        have_relations = Have.objects.filter(plan=obj)
        recipes = [relation.recipe for relation in have_relations]
        return RecipeSerializer(recipes, many=True).data

class MealPlanDetailSerializer(serializers.ModelSerializer):
    recipes = serializers.SerializerMethodField()
    
    class Meta:
        model = MealPlan
        fields = ['planID', 'plan_name', 'start_date', 'description', 'mealType', 'day_of_week', 'group', 'user', 'recipes', 'created_at', 'updated_at']
        read_only_fields = ['planID', 'created_at', 'updated_at']
    
    def get_recipes(self, obj):
        have_relations = Have.objects.filter(plan=obj)
        recipes = [relation.recipe for relation in have_relations]
        return RecipeSerializer(recipes, many=True).data

class MealPlanCreateSerializer(serializers.Serializer):
    plan_name = serializers.CharField(max_length=255)
    start_date = serializers.DateField()
    description = serializers.CharField(required=False, allow_blank=True)
    planned_meals = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )
    group = serializers.IntegerField()
    user = serializers.IntegerField()
    meal_type = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        print(f"=== MealPlanCreateSerializer.create() ===")
        print(f"validated_data: {validated_data}")
        
        planned_meals = validated_data.pop('planned_meals', [])
        meal_type = validated_data.pop('meal_type', 'breakfast')  # Default to breakfast
        meal_plans = []
        
        print(f"planned_meals: {planned_meals}")
        print(f"meal_type: {meal_type}")
        
        # Nếu không có planned_meals, tạo một meal plan cơ bản
        if not planned_meals:
            print("No planned meals provided, creating a basic meal plan")
            
            # Tính toán day_of_week dựa trên start_date
            start_date = validated_data['start_date']
            day_of_week = start_date.weekday()
            print(f"start_date: {start_date}, calculated day_of_week: {day_of_week}")
            
            meal_plan = MealPlan.objects.create(
                plan_name=validated_data['plan_name'],
                start_date=validated_data['start_date'],
                description=validated_data.get('description', ''),
                mealType=meal_type,
                day_of_week=day_of_week,
                group_id=validated_data['group'],
                user_id=validated_data['user']
            )
            print(f"Created basic meal plan: {meal_plan}")
            meal_plans.append(meal_plan)
        else:
            # Tạo meal plan cho từng planned_meal
            for meal_data in planned_meals:
                print(f"Creating meal plan for: {meal_data}")
                
                # Tính toán day_of_week dựa trên start_date
                start_date = validated_data['start_date']
                day_of_week = start_date.weekday()
                
                print(f"start_date: {start_date}")
                print(f"frontend day parameter: {meal_data['day']}")
                print(f"calculated day_of_week from start_date: {day_of_week}")
                
                meal_plan = MealPlan.objects.create(
                    plan_name=validated_data['plan_name'],
                    start_date=validated_data['start_date'],
                    description=validated_data.get('description', ''),
                    mealType=meal_data.get('meal', meal_type),
                    day_of_week=day_of_week,
                    group_id=validated_data['group'],
                    user_id=validated_data['user']
                )
                print(f"Created meal plan: {meal_plan}")
                meal_plans.append(meal_plan)
                
                # Nếu có recipe_id, tạo relation trong Have table
                recipe_id = meal_data.get('recipe_id')
                if recipe_id:
                    try:
                        from ..models.recipe import Recipe
                        recipe = Recipe.objects.get(recipeID=recipe_id)
                        Have.objects.create(plan=meal_plan, recipe=recipe)
                        print(f"Created Have relation: meal_plan={meal_plan.planID}, recipe={recipe_id}")
                    except Recipe.DoesNotExist:
                        print(f"Warning: Recipe {recipe_id} not found")
        
        print(f"Total created: {len(meal_plans)} meal plans")
        return meal_plans

class MealPlanWeeklySerializer(serializers.Serializer):
    """Serializer để trả về kế hoạch bữa ăn theo tuần"""
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    meals_by_day = serializers.DictField()
    ingredients_summary = serializers.DictField()