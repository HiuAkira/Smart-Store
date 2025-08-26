from django.db import models
from .fridge import Fridge
from .product_catalog import ProductCatalog

class AddToFridge(models.Model):
    class LocationType(models.TextChoices):
        COOL = 'cool', 'Ngăn lạnh'
        FREEZE = 'freeze', 'Ngăn đông'

    fridge = models.ForeignKey(Fridge, on_delete=models.CASCADE)
    product = models.ForeignKey(ProductCatalog, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    dateAdded = models.DateTimeField(auto_now_add=True)
    location = models.CharField(
        max_length=10,
        choices=LocationType.choices,
        default=LocationType.COOL
    )
    expiredDate = models.DateField()

    class Meta:
        unique_together = ('fridge', 'product')
