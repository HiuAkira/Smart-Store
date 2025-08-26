import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Typography,
  Space,
  Avatar,
  Spin,
  Alert,
  Modal,
  Form,
  message,
  Divider,
  List,
  Tag,
} from "antd";
import {
  PlusOutlined,
  ArrowRightOutlined,
  UserOutlined,
  SearchOutlined,
  MailOutlined,
  TeamOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../config/api";

const { Title, Text, Paragraph } = Typography;

const SelectGroup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highlightId, setHighlightId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();

  // States for user management in create group modal
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchText, setUserSearchText] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
    if (location.state && location.state.newGroupId) {
      setHighlightId(location.state.newGroupId);
      setShowSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchGroups = async () => {
    try {
      const response = await api.get("/api/groups/");
      setGroups(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setError("Không thể tải danh sách nhóm");
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (users.length > 0) return; // Đã tải rồi thì không tải lại

    setUsersLoading(true);
    try {
      const response = await api.get("/api/users/");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSelectGroup = (groupId, groupName) => {
    localStorage.setItem("selectedGroup", groupId);
    message.success(`Đã tham gia nhóm ${groupName} thành công!`);
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  const handleCreateGroup = async (values) => {
    setCreateLoading(true);
    try {
      const response = await api.post("/api/groups/create/", {
        groupName: values.groupName,
        description: values.description,
        members: selectedUsers.map((user) => user.id),
      });

      if (response.status === 201) {
        message.success(`Nhóm "${values.groupName}" đã được tạo thành công!`);
        setShowCreateModal(false);
        form.resetFields();
        setSelectedUsers([]);
        setUserSearchText("");
        fetchGroups(); // Refresh danh sách nhóm

        // Highlight nhóm mới tạo
        setHighlightId(response.data.groupID);
        localStorage.setItem("selectedGroup", response.data.groupID);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      message.error("Có lỗi xảy ra khi tạo nhóm. Vui lòng thử lại.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddUser = (user) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    fetchUsers(); // Tải danh sách users khi mở modal
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    form.resetFields();
    setSelectedUsers([]);
    setUserSearchText("");
  };

  const filteredGroups = groups.filter((group) =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(
    (user) =>
      (user.name.toLowerCase().includes(userSearchText.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchText.toLowerCase())) &&
      !selectedUsers.some((selectedUser) => selectedUser.id === user.id)
  );

  const getGroupAvatar = (groupName) => {
    const words = groupName.split(" ");
    if (words.length >= 2) {
      return words[0][0] + words[1][0];
    }
    return groupName.substring(0, 2);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <Alert message="Lỗi" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "32px 16px",
      }}
    >
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={1} style={{ color: "#1e293b", marginBottom: 16 }}>
            Chọn Nhóm
          </Title>
          <Paragraph
            style={{
              fontSize: 16,
              color: "#64748b",
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            Tham gia vào một nhóm hiện có hoặc tạo nhóm mới để bắt đầu cộng tác
            với đội ngũ của bạn
          </Paragraph>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <Alert
            message="Tạo nhóm thành công!"
            description="Hãy chọn nhóm để bắt đầu."
            type="success"
            showIcon
            closable
            style={{ marginBottom: 24 }}
            onClose={() => setShowSuccess(false)}
          />
        )}

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Search */}
          <Card>
            <Input
              placeholder="Tìm kiếm nhóm..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Card>

          {/* Create New Group */}
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Title
                level={4}
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <PlusOutlined style={{ color: "#1890ff" }} />
                Tạo Nhóm Mới
              </Title>
              <Text type="secondary">
                Tạo một không gian làm việc mới cho đội ngũ của bạn
              </Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              size="large"
              style={{ borderRadius: 8 }}
              block
            >
              Tạo nhóm mới
            </Button>
          </Card>

          {/* Available Groups */}
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Title
                level={4}
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <TeamOutlined style={{ color: "#1890ff" }} />
                Nhóm Có Sẵn
              </Title>
              <Text type="secondary">Các nhóm mà bạn có thể tham gia</Text>
            </div>

            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {filteredGroups.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Text type="secondary">
                    {searchTerm
                      ? "Không tìm thấy nhóm nào"
                      : "Chưa có nhóm nào"}
                  </Text>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div
                    key={group.groupID}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 16,
                      border:
                        highlightId === group.groupID
                          ? "2px solid #52c41a"
                          : "1px solid #f0f0f0",
                      borderRadius: 8,
                      backgroundColor:
                        highlightId === group.groupID ? "#f6ffed" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (highlightId !== group.groupID) {
                        e.currentTarget.style.backgroundColor = "#fafafa";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (highlightId !== group.groupID) {
                        e.currentTarget.style.backgroundColor = "#fff";
                      }
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <Avatar
                        size={48}
                        style={{
                          backgroundColor: "#1890ff",
                          fontSize: 16,
                          fontWeight: 600,
                        }}
                      >
                        {getGroupAvatar(group.groupName)}
                      </Avatar>
                      <div>
                        <Title
                          level={5}
                          style={{ margin: 0, color: "#1e293b" }}
                        >
                          {group.groupName}
                        </Title>
                        <Text
                          type="secondary"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <UserOutlined style={{ fontSize: 12 }} />
                          {group.member_count || 0} thành viên
                        </Text>
                      </div>
                    </div>
                    <Button
                      type="primary"
                      icon={<ArrowRightOutlined />}
                      onClick={() =>
                        handleSelectGroup(group.groupID, group.groupName)
                      }
                      style={{ borderRadius: 6 }}
                    >
                      Tham gia
                    </Button>
                  </div>
                ))
              )}
            </Space>
          </Card>

          {/* Footer */}
          <div style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Không tìm thấy nhóm của bạn?{" "}
              <Button type="link" style={{ padding: 0, fontSize: 14 }}>
                Thử email khác
              </Button>
            </Text>
          </div>
        </Space>
      </div>

      {/* Create Group Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            <span>Tạo Nhóm Mới</span>
          </Space>
        }
        open={showCreateModal}
        onCancel={handleCloseCreateModal}
        footer={null}
        width={600}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateGroup}
          size="large"
        >
          <Form.Item
            name="groupName"
            label="Tên nhóm"
            rules={[
              { required: true, message: "Vui lòng nhập tên nhóm" },
              { min: 2, message: "Tên nhóm phải có ít nhất 2 ký tự" },
            ]}
          >
            <Input placeholder="Nhập tên nhóm..." style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả (tùy chọn)">
            <Input.TextArea
              placeholder="Mô tả về nhóm..."
              rows={3}
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item label="Tìm thành viên">
            <Input
              placeholder="Tìm kiếm người dùng..."
              prefix={<SearchOutlined />}
              value={userSearchText}
              onChange={(e) => setUserSearchText(e.target.value)}
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          {userSearchText && (
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ marginBottom: 8, display: "block" }}>
                Kết quả tìm kiếm:
              </Text>
              {usersLoading ? (
                <Spin />
              ) : (
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    border: "1px solid #f0f0f0",
                    borderRadius: 6,
                  }}
                >
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: 16, textAlign: "center" }}>
                      <Text type="secondary">
                        Không tìm thấy người dùng nào
                      </Text>
                    </div>
                  ) : (
                    <List
                      dataSource={filteredUsers}
                      renderItem={(user) => (
                        <List.Item
                          style={{ padding: "8px 16px", cursor: "pointer" }}
                          onClick={() => handleAddUser(user)}
                          actions={[
                            <Button
                              type="link"
                              size="small"
                              icon={<PlusOutlined />}
                            >
                              Thêm
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} />}
                            title={user.name}
                            description={user.email}
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {selectedUsers.length > 0 && (
            <Form.Item label="Thành viên đã chọn">
              <div
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: 6,
                  padding: 8,
                }}
              >
                <Space wrap>
                  {selectedUsers.map((user) => (
                    <Tag
                      key={user.id}
                      closable
                      onClose={() => handleRemoveUser(user.id)}
                      style={{ marginBottom: 4 }}
                    >
                      <UserOutlined style={{ marginRight: 4 }} />
                      {user.name}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCloseCreateModal}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createLoading}
                style={{ borderRadius: 6 }}
              >
                {createLoading ? "Đang tạo..." : "Tạo Nhóm"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SelectGroup;
