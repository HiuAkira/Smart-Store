from django.db import models
from .group import Group
from .user import User

class ShoppingList(models.Model):
    class ListType(models.TextChoices):
        DAY = 'day', 'Day'
        WEEK = 'week', 'Week'
    
    listID = models.AutoField(primary_key=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    listName = models.CharField(max_length=255)
    date = models.DateField()
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=ListType.choices)

    def __str__(self):
        return self.listName
