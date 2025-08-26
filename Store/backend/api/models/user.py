from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=20, choices=[
        ('admin', 'Admin'),
        ('housekeeper', 'Nội trợ'),
        ('member', 'Thành viên')
    ], default='member')
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    
    # Thêm các trường mới cho profile
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Số điện thoại")
    dateOfBirth = models.DateField(blank=True, null=True, verbose_name="Ngày sinh")
    address = models.TextField(blank=True, null=True, verbose_name="Địa chỉ")
    bio = models.TextField(blank=True, null=True, verbose_name="Giới thiệu")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

