from django.db import models
from django.utils import timezone
from .categories import Categories

class ProductCatalog(models.Model):
    productID = models.AutoField(primary_key=True)
    productName = models.CharField(max_length=255)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Giá gốc
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Giá sau khi áp dụng discount
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Giảm giá (%)
    unit = models.CharField(max_length=50)
    shelfLife = models.IntegerField()  # Shelf life in days
    isCustom = models.BooleanField(default=False)
    category = models.ForeignKey(Categories, on_delete=models.SET_NULL, null=True, blank=True)
    image = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Tự động tính giá sau discount khi lưu
        if self.discount > 0:
            self.price = self.original_price * (1 - self.discount / 100)
        else:
            self.price = self.original_price
        super().save(*args, **kwargs)

    @property
    def discount_amount(self):
        """Tính số tiền được giảm"""
        return self.original_price - self.price

    @property
    def discount_percentage(self):
        """Tính phần trăm giảm giá"""
        if self.original_price > 0:
            return ((self.original_price - self.price) / self.original_price) * 100
        return 0

    def __str__(self):
        return self.productName
