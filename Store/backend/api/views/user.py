from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.views import TokenObtainPairView as SimpleJWTTokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from ..models.user import User
from ..serializers.user import RegisterSerializer, CustomTokenObtainPairSerializer
from ..serializers.group import UserSerializer
from ..models.in_model import In

class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserMeView(APIView):
    """API để lấy thông tin user hiện tại"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'username': user.username,
                'role': user.role,
                'phone': user.phone,
                'dateOfBirth': user.dateOfBirth,
                'address': user.address,
                'bio': user.bio
            }
        }, status=status.HTTP_200_OK)


class UserUpdateView(APIView):
    """API để cập nhật thông tin user"""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data

        # Cập nhật các trường được phép
        allowed_fields = ['name', 'phone', 'dateOfBirth', 'address', 'bio']
        
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])

        # Xử lý email riêng (cần kiểm tra unique)
        if 'email' in data and data['email'] != user.email:
            if User.objects.filter(email=data['email']).exists():
                return Response({
                    'success': False,
                    'message': 'Email đã được sử dụng bởi tài khoản khác'
                }, status=status.HTTP_400_BAD_REQUEST)
            user.email = data['email']

        try:
            user.save()
            return Response({
                'success': True,
                'message': 'Cập nhật thông tin thành công',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'username': user.username,
                    'role': user.role,
                    'phone': user.phone,
                    'dateOfBirth': user.dateOfBirth,
                    'address': user.address,
                    'bio': user.bio
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Có lỗi xảy ra: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserDetailView(APIView):
    """API để quản lý chi tiết người dùng"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            serializer = UserSerializer(user)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Không tìm thấy người dùng'
            }, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            data = request.data

            # Cập nhật các trường được phép
            allowed_fields = ['name', 'email', 'role', 'is_active', 'phone', 'dateOfBirth', 'address', 'bio']
            
            for field in allowed_fields:
                if field in data:
                    setattr(user, field, data[field])

            # Xử lý email riêng (cần kiểm tra unique)
            if 'email' in data and data['email'] != user.email:
                if User.objects.filter(email=data['email']).exists():
                    return Response({
                        'success': False,
                        'message': 'Email đã được sử dụng bởi tài khoản khác'
                    }, status=status.HTTP_400_BAD_REQUEST)

            try:
                user.save()
                serializer = UserSerializer(user)
                return Response({
                    'success': True,
                    'message': 'Cập nhật thông tin thành công',
                    'data': serializer.data
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({
                    'success': False,
                    'message': f'Có lỗi xảy ra: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Không tìm thấy người dùng'
            }, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            # Không cho phép xóa tài khoản admin
            if user.role == 'admin':
                return Response({
                    'success': False,
                    'message': 'Không thể xóa tài khoản admin'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Không cho phép xóa chính mình
            if user.id == request.user.id:
                return Response({
                    'success': False,
                    'message': 'Không thể xóa tài khoản của chính mình'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Xóa membership trước khi xóa user để tránh lỗi liên quan ManyToMany through 'In'
            In.objects.filter(user=user).delete()

            user.delete()
            return Response({
                'success': True,
                'message': 'Xóa người dùng thành công'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Không tìm thấy người dùng'
            }, status=status.HTTP_404_NOT_FOUND)

class UserStatusView(APIView):
    """API để cập nhật trạng thái người dùng"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            # Không cho phép vô hiệu hóa tài khoản admin
            if user.role == 'admin' and not request.data.get('is_active', True):
                return Response({
                    'success': False,
                    'message': 'Không thể vô hiệu hóa tài khoản admin'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Không cho phép vô hiệu hóa chính mình
            if user.id == request.user.id:
                return Response({
                    'success': False,
                    'message': 'Không thể vô hiệu hóa tài khoản của chính mình'
                }, status=status.HTTP_400_BAD_REQUEST)

            user.is_active = request.data.get('is_active', True)
            user.save()

            return Response({
                'success': True,
                'message': f'Đã {"kích hoạt" if user.is_active else "vô hiệu hóa"} tài khoản thành công',
                'data': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'is_active': user.is_active
                }
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Không tìm thấy người dùng'
            }, status=status.HTTP_404_NOT_FOUND)

class UserRoleView(APIView):
    """API để cập nhật vai trò người dùng"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            new_role = request.data.get('role')

            if not new_role or new_role not in ['admin', 'housekeeper', 'member']:
                return Response({
                    'success': False,
                    'message': 'Vai trò không hợp lệ'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Không cho phép thay đổi vai trò của chính mình
            if user.id == request.user.id:
                return Response({
                    'success': False,
                    'message': 'Không thể thay đổi vai trò của chính mình'
                }, status=status.HTTP_400_BAD_REQUEST)

            user.role = new_role
            user.save()

            return Response({
                'success': True,
                'message': 'Cập nhật vai trò thành công',
                'data': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role
                }
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Không tìm thấy người dùng'
            }, status=status.HTTP_404_NOT_FOUND)
