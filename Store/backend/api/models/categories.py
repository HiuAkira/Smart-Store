from django.db import models

class Categories(models.Model):
    categoryID = models.AutoField(primary_key=True)
    categoryName = models.CharField(max_length=255)

    def __str__(self):
        return self.categoryName
