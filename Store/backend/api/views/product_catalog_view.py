from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from ..models.product_catalog import ProductCatalog
from ..serializers.product_catalog_serializer import ProductCatalogSerializer
import cloudinary.uploader
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q


class ProductCatalogView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def get(self, request):
        category_id = request.query_params.get('category', None)
        products = ProductCatalog.objects.all()

        if category_id:
            try:
                products = products.filter(category_id=int(category_id))
            except ValueError:
                pass  # Nếu category_id không phải số, bỏ qua filter
        serializer = ProductCatalogSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Xử lý upload ảnh
        image = request.FILES.get('image')
        if image:
            result = cloudinary.uploader.upload(image)
            request.data['image'] = result['secure_url']

        serializer = ProductCatalogSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return Response({
                'message': 'Tạo sản phẩm thành công', 
                'data': ProductCatalogSerializer(product).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'message': 'Có lỗi xảy ra khi tạo sản phẩm',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class ProductCatalogDetailView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return ProductCatalog.objects.get(pk=pk)
        except ProductCatalog.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({
                'message': 'Không tìm thấy sản phẩm'
            }, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductCatalogSerializer(product)
        return Response(serializer.data)

    def put(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({
                'message': 'Không tìm thấy sản phẩm'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Xử lý upload ảnh nếu có
        image = request.FILES.get('image')
        if image:
            result = cloudinary.uploader.upload(image)
            request.data['image'] = result['secure_url']
            
        serializer = ProductCatalogSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            updated_product = serializer.save()
            return Response({
                'message': 'Sản phẩm đã được cập nhật thành công',
                'data': ProductCatalogSerializer(updated_product).data
            })
        return Response({
            'message': 'Có lỗi xảy ra khi cập nhật sản phẩm',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({
                'message': 'Không tìm thấy sản phẩm'
            }, status=status.HTTP_404_NOT_FOUND)
        product.delete()
        return Response({
            'message': 'Sản phẩm đã được xóa thành công'
        }, status=status.HTTP_204_NO_CONTENT)


class ProductPriceView(APIView):
    """View để lấy thông tin chi tiết về giá sản phẩm"""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            product = ProductCatalog.objects.get(pk=pk)
            return Response({
                'productID': product.productID,
                'productName': product.productName,
                'original_price': product.original_price,
                'price': product.price,
                'discount': product.discount,
                'discount_amount': product.discount_amount,
                'discount_percentage': product.discount_percentage,
                'savings': {
                    'amount': product.discount_amount,
                    'percentage': round(product.discount_percentage, 2)
                }
            })
        except ProductCatalog.DoesNotExist:
            return Response({
                'message': 'Không tìm thấy sản phẩm'
            }, status=status.HTTP_404_NOT_FOUND)
        
#Tìm kiếm 
class ProductCatalogSearchView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        query = request.query_params.get("q", "")
        if not query:
            return Response([])

        products = ProductCatalog.objects.filter(Q(productName__icontains=query), isCustom=False).select_related('category').order_by('productName')[:10]
        results = []
        for product in products:
            results.append({
                'productID': product.productID,
                'productName': product.productName,
                'unit': product.unit,
                'shelfLife': product.shelfLife,
                'isCustom': product.isCustom,
                'categoryName': product.category.categoryName if product.category else None,
                'categoryID': product.category.categoryID,
                'image': product.image,
            })

        return Response(results)
    