from rest_framework import serializers
from ..models.have import Have
from ..models.in_model import In

class HaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Have
        fields = ['planID', 'recipeID']

class InSerializer(serializers.ModelSerializer):
    class Meta:
        model = In
        fields = ['userID', 'groupID']