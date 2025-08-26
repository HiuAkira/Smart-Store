from django.db import models

class Recipe(models.Model):
    recipeID = models.AutoField(primary_key=True)
    recipeName = models.CharField(max_length=255)
    description = models.TextField()
    instruction = models.TextField()
    isCustom = models.BooleanField(default=False)
    image = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return self.recipeName
