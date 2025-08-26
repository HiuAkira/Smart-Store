import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Shield,
  Mail,
  Calendar,
  Filter,
} from "lucide-react";
import api from "../config/api";

const AccountManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy danh sách người dùng
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/api/users/");
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        setError("Không thể tải danh sách người dùng");
        setLoading(false);
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.is_active === (statusFilter === "active");

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleUserStatus = async (userId) => {
    try {
      const newStatus = !users.find((u) => u.id === userId).is_active;

      const response = await api.patch(`/api/users/${userId}/status/`, {
        is_active: newStatus,
      });

      if (response.data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, is_active: newStatus } : u
          )
        );
        alert(response.data.message);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật trạng thái người dùng"
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      return;
    }

    try {
      const userName = users.find((u) => u.id === userId).name;

      const response = await api.delete(`/api/users/${userId}/`);

      if (response.data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        alert(`Đã xóa tài khoản ${userName}`);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert(
        error.response?.data?.message || "Có lỗi xảy ra khi xóa người dùng"
      );
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const userName = users.find((u) => u.id === userId).name;

      const response = await api.patch(`/api/users/${userId}/role/`, {
        role: newRole,
      });

      if (response.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        alert(
          `Đã thay đổi vai trò của ${userName} thành ${
            newRole === "admin"
              ? "Quản trị viên"
              : newRole === "housekeeper"
              ? "Nội trợ"
              : "Thành viên"
          }`
        );
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi thay đổi vai trò người dùng"
      );
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "housekeeper":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const toBoolean = (val) => {
    if (val === undefined || val === null) return true; // Mặc định là hoạt động
    return (
      val === true ||
      val === 1 ||
      val === "true" ||
      val === "True" ||
      val === "1"
    );
  };

  const getStatusColor = (status) => {
    return toBoolean(status)
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Tài Khoản</h1>
          <p className="text-gray-500 mt-2">
            Quản lý người dùng và phân quyền trong hệ thống
          </p>
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
          onClick={() => {}}
        >
          <Plus className="h-4 w-4" />
          Thêm Người Dùng
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-500">
              Tổng Người Dùng
            </h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{users.length}</div>
          <p className="text-xs text-gray-500 mt-1">Tất cả người dùng</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-500">Quản Trị Viên</h3>
            <Shield className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">
            {users.filter((u) => u.role === "admin").length}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(
              (users.filter((u) => u.role === "admin").length / users.length) *
                100
            )}
            % tổng số
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-500">
              Đang Hoạt Động
            </h3>
            <UserCheck className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">
            {users.filter((u) => u.is_active).length}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(
              (users.filter((u) => u.is_active).length / users.length) * 100
            )}
            % tổng số
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-500">Nội Trợ</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">
            {users.filter((u) => u.role === "housekeeper").length}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(
              (users.filter((u) => u.role === "housekeeper").length /
                users.length) *
                100
            )}
            % tổng số
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ Lọc và Tìm Kiếm
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vai trò
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="housekeeper">Nội trợ</option>
              <option value="member">Thành viên</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              &nbsp;
            </label>
            <button
              className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Danh Sách Người Dùng</h3>
          <p className="text-sm text-gray-500">
            Hiển thị {filteredUsers.length} trong tổng số {users.length} người
            dùng
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Người dùng</th>
                <th className="text-left py-3 px-4">Vai trò</th>
                <th className="text-left py-3 px-4">Trạng thái</th>
                <th className="text-left py-3 px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-800">
                          {user.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role === "admin"
                        ? "Quản trị viên"
                        : user.role === "housekeeper"
                        ? "Nội trợ"
                        : "Thành viên"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${getStatusColor(
                        user.is_active
                      )}`}
                    >
                      {toBoolean(user.is_active)
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <select
                        className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={user.role}
                        onChange={(e) =>
                          handleChangeRole(user.id, e.target.value)
                        }
                      >
                        <option value="member">Thành viên</option>
                        <option value="housekeeper">Nội trợ</option>
                        <option value="admin">Quản trị viên</option>
                      </select>

                      <button
                        className="p-1 border rounded hover:bg-gray-50"
                        onClick={() => handleToggleUserStatus(user.id)}
                      >
                        {user.is_active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        className="p-1 border rounded hover:bg-gray-50"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;
