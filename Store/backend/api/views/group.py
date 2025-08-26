from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models.group import Group
from ..models.user import User
from ..models.in_model import In
from ..serializers.group import GroupSerializer

class GroupListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Lấy danh sách nhóm mà user là thành viên
        user_groups = Group.objects.filter(members=request.user)
        serializer = GroupSerializer(user_groups, many=True)
        return Response(serializer.data)

class CreateGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        data['createdBy'] = request.user.id
        
        serializer = GroupSerializer(data=data)
        if serializer.is_valid():
            group = serializer.save()
            
            # Thêm người tạo vào nhóm
            In.objects.create(user=request.user, group=group)
            
            # Thêm các thành viên khác nếu có (loại trừ người tạo để tránh trùng lặp)
            member_ids = request.data.get('members', [])
            for member_id in member_ids:
                # Bỏ qua nếu là người tạo nhóm (đã được thêm ở trên)
                if member_id == request.user.id:
                    continue
                    
                try:
                    user = User.objects.get(id=member_id)
                    # Kiểm tra xem user đã tồn tại trong nhóm chưa
                    if not In.objects.filter(user=user, group=group).exists():
                        In.objects.create(user=user, group=group)
                except User.DoesNotExist:
                    continue
            
            # Refresh group để lấy thông tin members mới nhất
            group.refresh_from_db()
            response_data = GroupSerializer(group).data
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class JoinGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        try:
            group = Group.objects.get(groupID=group_id)
            
            # Kiểm tra xem user đã là thành viên chưa
            if In.objects.filter(user=request.user, group=group).exists():
                return Response(
                    {"message": "Bạn đã là thành viên của nhóm này"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Thêm user vào nhóm
            In.objects.create(user=request.user, group=group)
            return Response(
                {"message": "Tham gia nhóm thành công"},
                status=status.HTTP_200_OK
            )
        except Group.DoesNotExist:
            return Response(
                {"message": "Nhóm không tồn tại"},
                status=status.HTTP_404_NOT_FOUND
            ) 