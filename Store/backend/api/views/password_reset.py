import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from ..models.user import User
from ..models.password_otp import PasswordResetOTP
from django.contrib.auth import get_user_model

User = get_user_model()

class PasswordResetRequestView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'message': 'Email là bắt buộc.'}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Email không tồn tại.'}, status=400)
        otp = f"{random.randint(100000, 999999)}"
        PasswordResetOTP.objects.create(email=email, otp=otp)
        send_mail(
            'Mã OTP đặt lại mật khẩu',
            f'Mã OTP của bạn là: {otp}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return Response({'message': 'Đã gửi mã OTP về email.'})
    
class PasswordResetConfirmView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        if not all([email, otp, new_password]):
            return Response({'message': 'Thiếu thông tin.'}, status=400)
        try:
            otp_obj = PasswordResetOTP.objects.filter(email=email, otp=otp, is_used=False).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            return Response({'message': 'OTP không đúng hoặc đã sử dụng.'}, status=400)
        if otp_obj.is_expired():
            return Response({'message': 'OTP đã hết hạn.'}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'User không tồn tại.'}, status=400)
        user.set_password(new_password)
        user.save()
        otp_obj.is_used = True
        otp_obj.save()
        return Response({'message': 'Đặt lại mật khẩu thành công.'})