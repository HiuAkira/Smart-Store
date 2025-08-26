from django.db import models
from .shopping_list import ShoppingList
from .product_catalog import ProductCatalog

class AddToList(models.Model):
    class ListStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PURCHASED = 'purchased', 'Purchased'

    list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE)
    product = models.ForeignKey(ProductCatalog, on_delete=models.CASCADE)
    quantity = models.FloatField()
    status = models.CharField(max_length=10, choices=ListStatus.choices)

    class Meta:
        unique_together = ('list', 'product')

    def __str__(self):
        return f'{self.product.productName} - {self.status}'
