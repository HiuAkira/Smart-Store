from django.db import models
from .user import User
from .group import Group

class In(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'group')

    def __str__(self):
        return f'{self.user.name} in {self.group.groupName}'
