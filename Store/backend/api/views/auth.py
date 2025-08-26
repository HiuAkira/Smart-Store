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

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Đăng ký thành công',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'role': user.role
                }
            }, status=status.HTTP_201_CREATED)
        return Response({
            'message': 'Đăng ký thất bại',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Email không tồn tại.'})

        if not user.check_password(password):  # ✅ kiểm tra hash password
            raise serializers.ValidationError({'password': 'Mật khẩu không đúng.'})

        # Trick cho SimpleJWT: truyền username = email
        data = super().validate({self.username_field: email, 'password': password})
        
        # Thêm thông tin user vào response
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'username': user.username,
            'phone': user.phone,
            'dateOfBirth': user.dateOfBirth,
            'address': user.address,
            'bio': user.bio
        }
        
        return data


class CustomTokenObtainPairView(SimpleJWTTokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer