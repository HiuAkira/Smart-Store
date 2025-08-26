import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const CreateGroup = () => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/api/users/");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Không thể tải danh sách người dùng");
    }
  };

  const handleAddUser = (user) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };
  const handleRemoveUser = (id) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== id));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Vui lòng nhập tên nhóm");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/groups/create/", {
        groupName,
        description,
        members: selectedUsers.map((user) => user.id),
      });

      localStorage.setItem("selectedGroup", response.data.groupID);
      navigate("/select-group", {
        state: { newGroupId: response.data.groupID },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tạo nhóm");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Tạo Nhóm Mới</h2>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên nhóm
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border rounded px-4 py-2"
              placeholder="Nhập tên nhóm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-4 py-2"
              placeholder="Nhập mô tả nhóm"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm thành viên
            </label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full border rounded px-4 py-2"
              placeholder="Tìm kiếm người dùng"
            />
          </div>

          {searchText && (
            <div className="max-h-40 overflow-y-auto border rounded">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAddUser(user)}
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <button className="text-green-600">+ Thêm</button>
                </div>
              ))}
            </div>
          )}

          {selectedUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thành viên đã chọn
              </label>
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center px-4 py-2 border rounded"
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCreateGroup}
            disabled={loading}
            className={`w-full py-2 rounded text-white font-medium ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {loading ? "Đang tạo..." : "Tạo Nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;
