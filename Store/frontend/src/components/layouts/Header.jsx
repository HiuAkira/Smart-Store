import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import { ACCESS_TOKEN } from "../../config/constants";
import NotificationBell from "../NotificationBell";

const Header = () => {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem(ACCESS_TOKEN));
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Lấy thông tin user
    const getUserInfo = async () => {
      try {
        const response = await api.get("/api/user/me/");
        setUserInfo(response.data.user);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
      }
    };

    if (isLoggedIn) {
      getUserInfo();
    }
  }, [isLoggedIn]);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 shadow-lg border-b border-green-200">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
          <span className="text-2xl">🍽️</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Smart Meal</h1>
          <p className="text-green-100 text-xs">Quản lý thông minh</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {isLoggedIn && (
          <>
            {/* Notifications - Replaced with NotificationBell */}
            <NotificationBell />

            {/* User Profile */}
            <div className="flex items-center gap-3 ml-2">
              <div className="hidden sm:block text-right">
                <p className="text-white font-medium text-sm">
                  {userInfo?.name || "Người dùng"}
                </p>
                <p className="text-green-100 text-xs">{userInfo?.email}</p>
              </div>
              <button
                onClick={() => navigate("/profile")}
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-semibold hover:bg-opacity-30 transition-all duration-200 border-2 border-white border-opacity-30"
              >
                {getUserInitials(userInfo?.name)}
              </button>
            </div>

            {/* Logout */}
            <button
              className="ml-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
              onClick={handleLogout}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </>
        )}

        {!isLoggedIn && (
          <button
            className="px-6 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold"
            onClick={handleLogin}
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
