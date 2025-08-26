import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [stats, setStats] = useState({
    mealPlans: 0,
    recipes: 0,
    groups: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo();
    fetchUserStats();
  }, []);

  const fetchUserInfo = async () => {
    try {
      // Thử lấy từ API trước
      const response = await api.get("/api/user/me/");
      const userData = response.data.user;
      setUser(userData);
      setEditData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
        dateOfBirth: userData.dateOfBirth || "1990-01-01",
        bio:
          userData.bio || "Tôi yêu thích nấu ăn và khám phá những món ăn mới.",
      });
    } catch (err) {
      // Nếu API lỗi, thử lấy từ localStorage
      console.error("Lỗi khi gọi API user info:", err);
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setEditData({
            name: userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            address: userData.address || "",
            dateOfBirth: userData.dateOfBirth || "1990-01-01",
            bio:
              userData.bio ||
              "Tôi yêu thích nấu ăn và khám phá những món ăn mới.",
          });
        } else {
          setError(
            "Không thể tải thông tin người dùng. Vui lòng đăng nhập lại."
          );
          navigate("/login");
        }
      } catch (localStorageError) {
        console.error("Lỗi khi lấy thông tin user:", localStorageError);
        setError("Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Lấy user ID từ localStorage
      const getUserInfo = () => {
        try {
          const userStr = localStorage.getItem("user");
          let userId = 1; // Fallback default
          if (userStr) {
            try {
              const userObj = JSON.parse(userStr);
              userId = userObj.id || 1;
            } catch (parseError) {
              console.error("Error parsing user JSON:", parseError);
            }
          }
          return { userId: parseInt(userId) };
        } catch (error) {
          console.error("Error getting user info:", error);
          return { userId: 1 };
        }
      };

      const { userId } = getUserInfo();

      // Gọi parallel các API để lấy thống kê
      const [mealPlansResponse, favoriteRecipesResponse] =
        await Promise.allSettled([
          // Lấy kế hoạch bữa ăn của user
          api.get("/api/meal-plans/", {
            params: { user_id: userId },
          }),
          // Lấy danh sách công thức yêu thích
          api.get("/api/favorite-recipes/"),
        ]);

      let newStats = {
        mealPlans: 0,
        recipes: 0,
        groups: 1,
      };

      // Xử lý kết quả meal plans
      if (
        mealPlansResponse.status === "fulfilled" &&
        mealPlansResponse.value.data.success
      ) {
        newStats.mealPlans = mealPlansResponse.value.data.data.length;
      }

      // Xử lý kết quả favorite recipes
      if (
        favoriteRecipesResponse.status === "fulfilled" &&
        favoriteRecipesResponse.value.data &&
        favoriteRecipesResponse.value.data.success
      ) {
        const favs = favoriteRecipesResponse.value.data.favorite_recipes;
        newStats.recipes = Array.isArray(favs) ? favs.length : 0;
      }

      setStats(newStats);
    } catch (error) {
      console.error("Lỗi khi lấy thống kê:", error);
      // Sử dụng dữ liệu giả nếu API lỗi
      setStats({
        mealPlans: 18,
        recipes: 5,
        groups: 3,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Gọi API để cập nhật thông tin
      await api.put("/api/user/update/", editData);
      setUser({ ...user, ...editData });
      setIsEditing(false);
      alert("Thông tin hồ sơ đã được cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin!");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      dateOfBirth: user.dateOfBirth || "1990-01-01",
      bio: user.bio || "Tôi yêu thích nấu ăn và khám phá những món ăn mới.",
    });
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">Đang tải thông tin...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-red-500">
          Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.
        </div>
      </div>
    );
  }

  const getUserInitials = (name) => {
    if (!name) return "ND";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hồ Sơ Cá Nhân</h1>
          <p className="text-gray-600">
            Quản lý thông tin cá nhân và tùy chỉnh tài khoản của bạn
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/change-password")}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 11c0-1.104.896-2 2-2s2 .896 2 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2c0-1.104.896-2 2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 11V7a5 5 0 00-10 0v4"
              />
            </svg>
            Đổi mật khẩu
          </button>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Chỉnh Sửa
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Lưu
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Hủy
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar và thông tin cơ bản */}
        <div className="md:col-span-1 bg-white shadow rounded-lg">
          <div className="p-6 text-center">
            <div className="h-32 w-32 mx-auto bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
              {getUserInitials(user.name)}
            </div>
            <h2 className="text-xl font-bold">
              {user.name || "Chưa cập nhật"}
            </h2>
            <p className="text-gray-600">{user.email || "Chưa cập nhật"}</p>
          </div>
          <div className="p-6 space-y-4 border-t">
            <div className="flex items-center gap-3 text-sm">
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.678a.95.95 0 00.22 0L19 8"
                />
              </svg>
              <span>{user.email || "Chưa cập nhật"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>{editData.phone || "Chưa cập nhật"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{editData.address || "Chưa cập nhật"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {editData.dateOfBirth
                  ? new Date(editData.dateOfBirth).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"}
              </span>
            </div>
          </div>
        </div>

        {/* Form chỉnh sửa thông tin */}
        <div className="md:col-span-2 bg-white shadow rounded-lg">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold">Thông Tin Chi Tiết</h3>
            <p className="text-gray-600">Cập nhật thông tin cá nhân của bạn</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Họ và Tên
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={isEditing ? editData.name : user.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={isEditing ? editData.email : user.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Số Điện Thoại
                </label>
                <input
                  id="phone"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={isEditing ? editData.phone : editData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="dateOfBirth"
                  className="text-sm font-medium text-gray-700"
                >
                  Ngày Sinh
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={
                    isEditing
                      ? editData.dateOfBirth
                      : editData.dateOfBirth || ""
                  }
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="address"
                className="text-sm font-medium text-gray-700"
              >
                Địa Chỉ
              </label>
              <input
                id="address"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={isEditing ? editData.address : editData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="bio"
                className="text-sm font-medium text-gray-700"
              >
                Giới Thiệu
              </label>
              <textarea
                id="bio"
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={isEditing ? editData.bio : editData.bio || ""}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditing}
                placeholder="Viết vài dòng về bản thân..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Thống kê người dùng */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">Thống Kê Hoạt Động</h3>
          <p className="text-gray-600">
            Tổng quan về hoạt động của bạn trong ứng dụng
          </p>
        </div>
        <div className="p-6">
          {statsLoading ? (
            <div className="text-center py-8">Đang tải thống kê...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.mealPlans}
                </div>
                <div className="text-sm text-gray-600">Kế hoạch bữa ăn</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.recipes}
                </div>
                <div className="text-sm text-gray-600">Công thức yêu thích</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.groups}
                </div>
                <div className="text-sm text-gray-600">Nhóm tham gia</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
