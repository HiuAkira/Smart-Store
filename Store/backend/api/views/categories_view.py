from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from ..models.categories import Categories
from ..serializers.categories_serializer import CategoriesSerializer

class CategoriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Categories.objects.all()
        serializer = CategoriesSerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategoriesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Danh mục đã được thêm thành công',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'message': 'Có lỗi xảy ra khi thêm danh mục',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class CategoriesDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Categories.objects.get(pk=pk)
        except Categories.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({
                'message': 'Không tìm thấy danh mục'
            }, status=status.HTTP_404_NOT_FOUND)
        serializer = CategoriesSerializer(category)
        return Response(serializer.data)

    def put(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({
                'message': 'Không tìm thấy danh mục'
            }, status=status.HTTP_404_NOT_FOUND)
        serializer = CategoriesSerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Danh mục đã được cập nhật thành công',
                'data': serializer.data
            })
        return Response({
            'message': 'Có lỗi xảy ra khi cập nhật danh mục',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({
                'message': 'Không tìm thấy danh mục'
            }, status=status.HTTP_404_NOT_FOUND)
        serializer = CategoriesSerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Danh mục đã được cập nhật thành công',
                'data': serializer.data
            })
        return Response({
            'message': 'Có lỗi xảy ra khi cập nhật danh mục',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({
                'message': 'Không tìm thấy danh mục'
            }, status=status.HTTP_404_NOT_FOUND)
        category.delete()
        # Thay đổi ở đây: trả về message thay vì status 204
        # vì status 204 không có body, sẽ gây lỗi nếu client cố đọc message
        return Response({
            'message': 'Danh mục đã được xóa thành công'
        }, status=status.HTTP_200_OK)