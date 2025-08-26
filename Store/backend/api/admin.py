from django.contrib import admin
from django.utils import timezone
from .models.user import User
from .models.group import Group
from .models.fridge import Fridge
from .models.categories import Categories
from .models.product_catalog import ProductCatalog
from .models.shopping_list import ShoppingList
from .models.add_to_list import AddToList
from .models.recipe import Recipe
from .models.add_to_fridge import AddToFridge
from .models.meal_plan import MealPlan
from .models.have import Have
from .models.in_model import In
from .models.ingredient import Ingredient
from .models.favorite_recipe import FavoriteRecipe

# Đăng ký User model
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'name', 'username', 'role', 'phone', 'is_active', 'date_joined')
    list_display_links = ('id', 'email', 'name')
    search_fields = ('email', 'name', 'username', 'phone')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    ordering = ('-date_joined',)
    readonly_fields = ('id', 'date_joined', 'last_login')
    
    fieldsets = (
        ('Thông tin đăng nhập', {
            'fields': ('email', 'username', 'password')
        }),
        ('Thông tin cá nhân', {
            'fields': ('name', 'phone', 'dateOfBirth', 'address', 'bio')
        }),
        ('Phân quyền', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Thông tin hệ thống', {
            'fields': ('id', 'date_joined', 'last_login'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Thông tin đăng nhập', {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
        ('Thông tin cá nhân', {
            'classes': ('wide',),
            'fields': ('name', 'phone', 'dateOfBirth', 'address', 'bio'),
        }),
        ('Phân quyền', {
            'classes': ('wide',),
            'fields': ('role', 'is_active', 'is_staff'),
        }),
    )
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related()
    
    def save_model(self, request, obj, form, change):
        if not change:  # Nếu là tạo mới user
            if 'password1' in form.cleaned_data:
                obj.set_password(form.cleaned_data['password1'])
        super().save_model(request, obj, form, change)

# Đăng ký Group model
@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('groupID', 'groupName', 'createdBy', 'createdAt')
    search_fields = ('groupName',)
    list_filter = ('createdAt',)

# Đăng ký Fridge model
@admin.register(Fridge)
class FridgeAdmin(admin.ModelAdmin):
    list_display = ('fridgeID', 'group_name')

    def group_name(self, obj):
        return obj.group.groupName

# Đăng ký Categories model
@admin.register(Categories)
class CategoriesAdmin(admin.ModelAdmin):
    list_display = ('categoryID', 'categoryName')
    search_fields = ('categoryName',)

# Đăng ký ProductCatalog model
@admin.register(ProductCatalog)
class ProductCatalogAdmin(admin.ModelAdmin):
    list_display = ('productID', 'productName', 'price', 'unit', 'shelfLife', 'isCustom', 'category')
    search_fields = ('productName',)
    list_filter = ('category', 'isCustom')

# Đăng ký ShoppingList model
@admin.register(ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    list_display = ('listID', 'listName', 'createdAt', 'type', 'group', 'user')
    search_fields = ('listName', 'type')
    list_filter = ('type',)

# Đăng ký AddToList model
@admin.register(AddToList)
class AddToListAdmin(admin.ModelAdmin):
    list_display = ('list', 'product', 'quantity', 'status')
    list_filter = ('status',)

# Đăng ký Recipe model
@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('recipeID', 'recipeName', 'isCustom')
    search_fields = ('recipeName',)

# Đăng ký IsIngredient model
#@admin.register(IsIngredient)
#class IsIngredientAdmin(admin.ModelAdmin):
#    list_display = ('product', 'recipe')

#Thay cho Ingredient
@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display=('product', 'recipe')

# Đăng ký AddToFridge model
@admin.register(AddToFridge)
class AddToFridgeAdmin(admin.ModelAdmin):
    list_display = ('fridge', 'product', 'quantity', 'dateAdded', 'expiredDate', 'location')
    list_filter = ('fridge',)

# Đăng ký MealPlan model
@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = (
        'planID', 
        'plan_name', 
        'get_day_name', 
        'get_meal_type_display', 
        'start_date',
        'group_name', 
        'user_name', 
        'created_at'
    )
    list_filter = ('mealType', 'day_of_week', 'start_date', 'group', 'created_at')
    search_fields = ('plan_name', 'mealType', 'description', 'user__name', 'group__groupName')
    date_hierarchy = 'start_date'
    ordering = ('-created_at', 'start_date', 'day_of_week', 'mealType')
    readonly_fields = ('planID', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('plan_name', 'description', 'start_date')
        }),
        ('Chi tiết bữa ăn', {
            'fields': ('mealType', 'day_of_week')
        }),
        ('Phân quyền', {
            'fields': ('group', 'user')
        }),
        ('Thông tin hệ thống', {
            'fields': ('planID', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def group_name(self, obj):
        return obj.group.groupName if obj.group else 'Không có nhóm'
    group_name.short_description = 'Nhóm'
    group_name.admin_order_field = 'group__groupName'
    
    def user_name(self, obj):
        return obj.user.name if obj.user else 'Không có người dùng'
    user_name.short_description = 'Người tạo'
    user_name.admin_order_field = 'user__name'
    
    def get_meal_type_display(self, obj):
        meal_types = {
            'breakfast': 'Bữa sáng',
            'lunch': 'Bữa trưa', 
            'dinner': 'Bữa tối'
        }
        return meal_types.get(obj.mealType, obj.mealType)
    get_meal_type_display.short_description = 'Loại bữa ăn'
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('group', 'user')
    
    # Custom actions
    actions = ['duplicate_meal_plan', 'export_meal_plans']
    
    def duplicate_meal_plan(self, request, queryset):
        """Nhân bản kế hoạch bữa ăn"""
        duplicated_count = 0
        for meal_plan in queryset:
            new_plan = MealPlan(
                plan_name=f"{meal_plan.plan_name} (Copy)",
                start_date=meal_plan.start_date,
                description=meal_plan.description,
                mealType=meal_plan.mealType,
                day_of_week=meal_plan.day_of_week,
                group=meal_plan.group,
                user=meal_plan.user
            )
            new_plan.save()
            duplicated_count += 1
        
        self.message_user(request, f"Đã nhân bản {duplicated_count} kế hoạch bữa ăn.")
    duplicate_meal_plan.short_description = "Nhân bản kế hoạch đã chọn"
    
    def export_meal_plans(self, request, queryset):
        """Xuất danh sách kế hoạch bữa ăn"""
        # Này có thể implement sau để export CSV/Excel
        self.message_user(request, f"Đã chọn {queryset.count()} kế hoạch để xuất.")
    export_meal_plans.short_description = "Xuất kế hoạch đã chọn"
    
    # Thống kê nhanh
    def changelist_view(self, request, extra_context=None):
        # Thêm thống kê vào context
        extra_context = extra_context or {}
        
        total_plans = MealPlan.objects.count()
        today_plans = MealPlan.objects.filter(start_date=timezone.now().date()).count()
        
        extra_context['total_plans'] = total_plans
        extra_context['today_plans'] = today_plans
        
        return super().changelist_view(request, extra_context)

# Đăng ký Have model
@admin.register(Have)
class HaveAdmin(admin.ModelAdmin):
    list_display = ('plan', 'recipe')

# Đăng ký In model
@admin.register(In)
class InAdmin(admin.ModelAdmin):
    list_display = ('user', 'group')

# Đăng ký FavoriteRecipe model
@admin.register(FavoriteRecipe)
class FavoriteRecipeAdmin(admin.ModelAdmin):
    list_display = ('user', 'recipe', 'created_at')
    search_fields = ('user__email', 'user__name', 'recipe__recipeName')
    list_filter = ('created_at',)


