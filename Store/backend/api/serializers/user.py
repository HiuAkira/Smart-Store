from rest_framework import serializers
from ..models.user import User
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

def validate_email(value):
    if User.objects.filter(email=value).exists():
        raise serializers.ValidationError("Email này đã được sử dụng")
    return value

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=[('housekeeper', 'Nội trợ'), ('member', 'Thành viên')],
        default='member'
    )

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['username'] = validated_data['email']  # nếu bạn cần field username
        user = User(**validated_data)
        user.set_password(password)  # ✅ hash password
        user.save()
        return user


class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'password']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Email không tồn tại.'})

        # ✅ Sử dụng check_password để kiểm tra hash password
        if not user.check_password(password):
            raise serializers.ValidationError({'password': 'Mật khẩu không đúng.'})

        # Gọi validate của SimpleJWT với attrs gốc (đã chứa email, password)
        data = super().validate(attrs)
        return data






