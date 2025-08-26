from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from ..models.shopping_list import ShoppingList
from ..models.add_to_list import AddToList
from ..serializers.shopping_serializers import ShoppingListSerializer, AddToListSerializer
from django.db.models import Sum, Count

class ShoppingListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Lấy danh sách shopping lists của group mà user đang tham gia"""
        user = request.user
        group_id = request.query_params.get('group_id')
        if not group_id:
            return Response({'message': 'Thiếu group_id'}, status=400)
        # (Tùy chọn) Kiểm tra user có thuộc group này không
        # from ..models.in_model import In
        # if not In.objects.filter(user=user, group_id=group_id).exists():
        #     return Response({'message': 'Bạn không thuộc group này'}, status=403)
        shopping_lists = ShoppingList.objects.filter(group=group_id).order_by('-createdAt')
        serializer = ShoppingListSerializer(shopping_lists, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Tạo shopping list mới"""
        data = request.data.copy()
        data['user'] = request.user.id
        
        serializer = ShoppingListSerializer(data=data)
        if serializer.is_valid():
            shopping_list = serializer.save()
            return Response({
                'message': 'Tạo danh sách mua sắm thành công',
                'data': ShoppingListSerializer(shopping_list).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'message': 'Có lỗi xảy ra khi tạo danh sách',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class ShoppingListDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, list_id):
        """Xem chi tiết shopping list và items"""
        shopping_list = get_object_or_404(ShoppingList, listID=list_id)
        # (Tùy chọn) Kiểm tra user có thuộc group này không:
        # from ..models.in_model import In
        # if not In.objects.filter(user=request.user, group=shopping_list.group).exists():
        #     return Response({'message': 'Bạn không thuộc group này'}, status=403)
        items = AddToList.objects.filter(list=shopping_list)
        # Tính toán thống kê
        total_items = items.count()
        purchased_items = items.filter(status='purchased').count()
        progress = (purchased_items / total_items * 100) if total_items > 0 else 0
        return Response({
            'list': ShoppingListSerializer(shopping_list).data,
            'items': AddToListSerializer(items, many=True).data,
            'stats': {
                'total_items': total_items,
                'purchased_items': purchased_items,
                'pending_items': total_items - purchased_items,
                'progress': round(progress, 2)
            }
        })
    
    def put(self, request, list_id):
        """Cập nhật shopping list"""
        shopping_list = get_object_or_404(ShoppingList, listID=list_id, user=request.user)
        serializer = ShoppingListSerializer(shopping_list, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Cập nhật danh sách thành công',
                'data': serializer.data
            })
        
        return Response({
            'message': 'Có lỗi xảy ra khi cập nhật',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, list_id):
        """Xóa shopping list"""
        shopping_list = get_object_or_404(ShoppingList, listID=list_id, user=request.user)
        shopping_list.delete()
        return Response({
            'message': 'Xóa danh sách thành công'
        }, status=status.HTTP_204_NO_CONTENT)

class AddToListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, list_id):
        """Thêm item vào shopping list"""
        shopping_list = get_object_or_404(ShoppingList, listID=list_id)
        data = request.data.copy()
        data['list'] = shopping_list.listID
        data['status'] = 'pending'  # Mặc định là pending
        serializer = AddToListSerializer(data=data)
        if serializer.is_valid():
            item = serializer.save()
            return Response({
                'message': 'Thêm sản phẩm thành công',
                'data': AddToListSerializer(item).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'message': 'Có lỗi xảy ra khi thêm sản phẩm',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class AddToListDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, list_id, item_id):
        """Cập nhật item trong shopping list (quantity, status)"""
        shopping_list = get_object_or_404(ShoppingList, listID=list_id)
        item = get_object_or_404(AddToList, id=item_id, list=shopping_list)
        serializer = AddToListSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Cập nhật sản phẩm thành công',
                'data': serializer.data
            })
        return Response({
            'message': 'Có lỗi xảy ra khi cập nhật',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, list_id, item_id):
        """Xóa item khỏi shopping list"""
        shopping_list = get_object_or_404(ShoppingList, listID=list_id)
        item = get_object_or_404(AddToList, id=item_id, list=shopping_list)
        item.delete()
        return Response({
            'message': 'Xóa sản phẩm thành công'
        }, status=status.HTTP_204_NO_CONTENT)

    # Hỗ trợ PATCH để phục vụ partial update (ví dụ chỉ cập nhật quantity)
    def patch(self, request, list_id, item_id):
        return self.put(request, list_id, item_id)

class ToggleItemStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, list_id, item_id):
        """Toggle status của item (pending <-> purchased)"""
        shopping_list = get_object_or_404(ShoppingList, listID=list_id)
        item = get_object_or_404(AddToList, id=item_id, list=shopping_list)
        # Toggle status
        item.status = 'purchased' if item.status == 'pending' else 'pending'
        item.save()
        return Response({
            'message': 'Cập nhật trạng thái thành công',
            'data': AddToListSerializer(item).data
        })

from django.db.models import Sum, F, FloatField, ExpressionWrapper

class PurchasedShoppingStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        group_id = request.query_params.get('group_id')
        if not group_id:
            return Response({'message': 'Thiếu group_id'}, status=400)
        purchased_items = AddToList.objects.filter(
            status='purchased',
            list__group_id=group_id
        )
        total_items = purchased_items.count()
        total_quantity = purchased_items.aggregate(total=Sum('quantity'))['total'] or 0
        # Tính tổng giá tiền: quantity * product.price
        total_price = purchased_items.aggregate(
            total=Sum(
                ExpressionWrapper(
                    F('quantity') * F('product__price'),
                    output_field=FloatField()
                )
            )
        )['total'] or 0 

        return Response({
            'total_items': total_items,
            'total_quantity': total_quantity,
            'total_price': total_price
        })

class PurchasedStatsByCategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        group_id = request.query_params.get('group_id')
        if not group_id:
            return Response({'message': 'Thiếu group_id'}, status=400)
        # Lọc các sản phẩm đã mua của group hiện tại
        purchased_items = AddToList.objects.filter(
            status='purchased',
            list__group_id=group_id
        )
        # Thống kê tổng số lượng theo từng danh mục
        stats = (
            purchased_items
            .values('product__category__categoryName')
            .annotate(total_quantity=Sum('quantity'))
            .order_by('-total_quantity')
        )
        # Định dạng dữ liệu trả về cho frontend
        data = [
            {
                'name': s['product__category__categoryName'] or 'Khác',
                'value': s['total_quantity'] or 0
            }
            for s in stats
        ]
        return Response(data)