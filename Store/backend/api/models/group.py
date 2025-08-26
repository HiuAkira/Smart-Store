from django.db import models
from django.utils import timezone
from .user import User

class Group(models.Model):
    groupID = models.AutoField(primary_key=True)
    groupName = models.CharField(max_length=255)
    createdBy = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups',null=True, blank=True)
    createdAt = models.DateTimeField(default=timezone.now)  # Thời gian tạo nhóm
    updatedAt = models.DateTimeField(auto_now=True)  # Thời gian cập nhật gần nhất
    description = models.TextField(blank=True, null=True)  # Mô tả nhóm
    members = models.ManyToManyField(User, through='In', related_name='joined_groups')  # Danh sách thành viên

    def __str__(self):
        return self.groupName

    class Meta:
        ordering = ['-createdAt']  # Sắp xếp theo thời gian tạo mới nhất
