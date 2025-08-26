from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from datetime import date, timedelta
from ..models.fridge import Fridge
from ..models.add_to_fridge import AddToFridge
from ..models.group import Group
from ..serializers.fridge import AddToFridgeSerializer
from django.db.models import Sum
from ..models.product_catalog import ProductCatalog
from ..models.categories import Categories

class FridgeNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get_group(self, request):
        group_id = request.query_params.get('group_id')
        user = request.user
        if group_id:
            group = get_object_or_404(Group, pk=group_id, members=user)
        else:
            # Lấy nhóm đầu tiên user tham gia nếu không truyền group_id
            group = user.joined_groups.first()
            if not group:
                return None
        return group

    def get(self, request):
        """Lấy thông báo thực phẩm sắp hết hạn trong vòng 3 ngày và đã hết hạn"""
        group = self.get_group(request)
        if not group:
            return Response("User không thuộc nhóm nào", status=status.HTTP_400_BAD_REQUEST)

        fridge, _ = Fridge.objects.get_or_create(group=group)
        today = date.today()
        three_days_later = today + timedelta(days=3)
        
        # Sản phẩm đã hết hạn
        expired_items = AddToFridge.objects.filter(
            fridge=fridge,
            expiredDate__lt=today
        ).select_related('product', 'product__category').order_by('expiredDate')

        # Sản phẩm sắp hết hạn
        expiring_items = AddToFridge.objects.filter(
            fridge=fridge,
            expiredDate__gte=today,
            expiredDate__lte=three_days_later
        ).select_related('product', 'product__category').order_by('expiredDate')

        # Serialize
        expired_serializer = AddToFridgeSerializer(expired_items, many=True)
        expired_data = expired_serializer.data
        for item in expired_data:
            item['days_remaining'] = (date.fromisoformat(item['expiredDate']) - today).days
            item['urgency'] = 'expired'
            item['urgency_text'] = 'Đã hết hạn'

        expiring_serializer = AddToFridgeSerializer(expiring_items, many=True)
        expiring_data = expiring_serializer.data
        for item in expiring_data:
            expired_date = date.fromisoformat(item['expiredDate'])
            days_remaining = (expired_date - today).days
            item['days_remaining'] = days_remaining
            if days_remaining == 0:
                item['urgency'] = 'critical'
                item['urgency_text'] = 'Hết hạn hôm nay'
            elif days_remaining == 1:
                item['urgency'] = 'high'
                item['urgency_text'] = 'Hết hạn ngày mai'
            elif days_remaining <= 3:
                item['urgency'] = 'medium'
                item['urgency_text'] = f'Hết hạn trong {days_remaining} ngày'

        all_items = list(expired_data) + list(expiring_data)

        return Response({
            'total_expiring': len(all_items),
            'items': all_items
        })

class FridgeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    # Lấy ra nhóm ứng với tủ lạnh
    def get_group(self, request):
        group_id = request.query_params.get('group_id')
        user = request.user
        if group_id:
            group = get_object_or_404(Group, pk=group_id, members=user)
        else:
            # Lấy nhóm đầu tiên user tham gia nếu không truyền group_id
            group = user.joined_groups.first()
            if not group:
                return None
        return group
    
    # Tính toán thống kê
    def get_stats(self, fridge):
        today = date.today()
        tomorrow = today + timedelta(days=1)

        items = AddToFridge.objects.filter(fridge=fridge)

        total_products = items.count()
        expired_products = items.filter(expiredDate__lt=today).count()
        expiring_soon_products =items.filter(
        expiredDate__gte=today, expiredDate__lte=tomorrow).count()

        popular_categories_qs = (
            items.values('product__category__categoryName')
            .annotate(total_quantity=Sum('quantity'))
            .order_by('-total_quantity')[:5]
        )

        popular_categories = [
            {
                "categoryName": c['product__category__categoryName'] or "Chưa phân loại",
                "totalQuantity": c['total_quantity']
            }
            for c in popular_categories_qs
        ]

        return {
            "total_products": total_products,
            "expired_products": expired_products,
            "expiring_soon_products": expiring_soon_products,
            "popular_categories": popular_categories,
        }

    # GET: Lấy danh sách (nếu không có id) hoặc chi tiết một mục (nếu có id)
    def get(self, request, id=None):
        group = self.get_group(request)
        if not group:
            return Response("User không thuộc nhóm nào", status=status.HTTP_400_BAD_REQUEST)

        fridge, _ = Fridge.objects.get_or_create(group=group)
        
        if id:
            # Lấy chi tiết một mục
            item = get_object_or_404(AddToFridge, id=id, fridge=fridge)
            serializer = AddToFridgeSerializer(item)
            data = serializer.data
            # Kiểm tra isExpiringSoon
            today = date.today()
            soon = today + timedelta(days=1)
            expired_date = data.get('expiredDate')
            data['isExpiringSoon'] = expired_date and date.fromisoformat(expired_date) <= soon
            return Response(data)
        else:
            # Lấy danh sách tất cả sản phẩm
            items = AddToFridge.objects.filter(fridge=fridge).select_related('product', 'product__category')
            serializer = AddToFridgeSerializer(items, many=True)
            today = date.today()
            soon = today + timedelta(days=1)
            data = serializer.data
            for item in data:
                expired_date = item.get('expiredDate')
                item['isExpiringSoon'] = expired_date and date.fromisoformat(expired_date) <= soon
            stats = self.get_stats(fridge)
            return Response({"items": data, "stats": stats})

    # POST: Thêm sản phẩm (chỉ trên /fridge/)
    def post(self, request, id=None):
        if id:
            return Response("POST method not allowed on specific item", status=status.HTTP_405_METHOD_NOT_ALLOWED)

        group = self.get_group(request)
        if not group:
            return Response("User không thuộc nhóm nào", status=status.HTTP_400_BAD_REQUEST)

        fridge, _ = Fridge.objects.get_or_create(group=group)

        # Lấy dữ liệu từ request
        product_name = request.data.get("productName", "").strip()
        expired_str = request.data.get("expiredDate")
        quantity = request.data.get("quantity")
        location = request.data.get("location")
        unit = request.data.get("unit")
        category_id = request.data.get("category_id")  # Nhận category_id từ frontend
        product_id = request.data.get("product_id")  # Sử dụng product_id thay vì productID

        if not product_name or not expired_str or not quantity:
            return Response("Thiếu thông tin bắt buộc (Tên sản phẩm, Ngày hết hạn, Số lượng)", status=400)

        # Validate và parse expired_date
        try:
            expired_date = date.fromisoformat(expired_str)
        except ValueError:
            return Response("Định dạng ngày hết hạn không hợp lệ. Sử dụng YYYY-MM-DD.", status=400)

        today = date.today()
        if expired_date < today:
            return Response("Ngày hết hạn phải từ hôm nay trở đi", status=400)

        product_obj = None
        
        if product_id:
            # Người dùng chọn từ autocomplete, tìm sản phẩm theo product_id
            try:
                product_obj = ProductCatalog.objects.get(productID=product_id)
                if AddToFridge.objects.filter(fridge=fridge, product=product_obj).exists():
                    return Response("Sản phẩm này đã có trong tủ lạnh của bạn.", status=400)
            except ProductCatalog.DoesNotExist:
                return Response("Sản phẩm được chọn từ catalog không tồn tại.", status=400)
        else:
            # Người dùng tự nhập, tìm sản phẩm trong catalog theo tên
            product_qs = ProductCatalog.objects.filter(productName__iexact=product_name)
            if product_qs.exists():
                product_obj = product_qs.first()
                if AddToFridge.objects.filter(fridge=fridge, product=product_obj).exists():
                    return Response("Sản phẩm này đã có trong tủ lạnh của bạn.", status=400)
            else:
                # Cần tạo sản phẩm mới trong ProductCatalog
                if not unit:
                    return Response("Đơn vị tính là bắt buộc khi tạo sản phẩm mới.", status=400)
                
                # Tìm hoặc tạo category
                category_obj = None
                if category_id:
                    try:
                        category_obj = Categories.objects.get(categoryID=category_id)
                    except Categories.DoesNotExist:
                        return Response("Danh mục không tồn tại.", status=400)

                # Tính shelf life từ ngày hết hạn (cho sản phẩm mới)
                shelf_life = (expired_date - today).days
                if shelf_life <= 0:
                    shelf_life = 1  # Tối thiểu 1 ngày

                # Tạo sản phẩm mới trong ProductCatalog
                product_obj = ProductCatalog.objects.create(
                    productName=product_name,
                    original_price=0,
                    price=0,
                    discount=0,
                    unit=unit,
                    shelfLife=shelf_life,
                    isCustom=True,
                    category=category_obj,
                )

        # Lưu vào AddToFridge
        add_data = {
            "product": product_obj.productID,
            "quantity": quantity,
            "expiredDate": expired_date,
            "location": location or "cool",
        }

        serializer = AddToFridgeSerializer(data=add_data)
        if serializer.is_valid():
            serializer.save(fridge=fridge)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # PATCH: Cập nhật sản phẩm (chỉ trên /fridge/<id>/)
    def patch(self, request, id=None):
        if not id:
            return Response("ID sản phẩm không được cung cấp", status=status.HTTP_400_BAD_REQUEST)

        group = self.get_group(request)
        if not group:
            return Response("User không thuộc nhóm nào", status=status.HTTP_400_BAD_REQUEST)

        fridge, _ = Fridge.objects.get_or_create(group=group)
        item = get_object_or_404(AddToFridge, id=id, fridge=fridge)
        
        # Validate expiredDate nếu có trong request
        if 'expiredDate' in request.data:
            try:
                expired_date = date.fromisoformat(request.data['expiredDate'])
                if expired_date < date.today():
                    return Response("Ngày hết hạn phải từ hôm nay trở đi", status=400)
            except ValueError:
                return Response("Định dạng ngày hết hạn không hợp lệ", status=400)
        
        # Handle category_id update
        if 'category_id' in request.data:
            category_id = request.data['category_id']
            try:
                category_obj = Categories.objects.get(categoryID=category_id)
                # Update the product's category
                item.product.category = category_obj
                item.product.save()
            except Categories.DoesNotExist:
                return Response("Danh mục không tồn tại.", status=400)

        serializer = AddToFridgeSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE: Xóa sản phẩm (chỉ trên /fridge/<id>/)
    def delete(self, request, id=None):
        if not id:
            return Response("ID sản phẩm không được cung cấp", status=status.HTTP_400_BAD_REQUEST)

        group = self.get_group(request)
        if not group:
            return Response("User không thuộc nhóm nào", status=status.HTTP_400_BAD_REQUEST)

        fridge, _ = Fridge.objects.get_or_create(group=group)
        item = get_object_or_404(AddToFridge, id=id, fridge=fridge)
        item.delete()
        return Response("Sản phẩm đã được xóa khỏi tủ lạnh", status=status.HTTP_204_NO_CONTENT)