from django.db import models
from ..models.group import Group

class Fridge(models.Model):
    fridgeID = models.AutoField(primary_key=True)
    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='fridge', null=True)
    
    def __str__(self):
        return self.group.groupName
