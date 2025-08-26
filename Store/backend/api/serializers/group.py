from rest_framework import serializers
from ..models.group import Group
from ..models.user import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'username', 'role', 'phone', 'dateOfBirth', 'address', 'bio']

class GroupSerializer(serializers.ModelSerializer):
    createdBy = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ['groupID', 'groupName', 'createdBy', 'createdAt', 
                 'updatedAt', 'description', 'members', 'member_count']
        read_only_fields = ['createdBy', 'createdAt', 'updatedAt']

    def get_member_count(self, obj):
        return obj.members.count() 