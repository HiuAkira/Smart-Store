import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import Header from "./Header";

const NavItem = ({ to, icon, label, badge, collapsed }) => {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
        isActive
          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105"
          : "text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:shadow-md hover:scale-102"
      } ${collapsed ? "justify-center px-2" : ""}`}
      style={{ minHeight: 48 }}
    >
      <div
        className={`flex items-center gap-3 ${
          collapsed ? "justify-center w-full" : ""
        }`}
      >
        <span
          className={`text-xl transition-all duration-300 ${
            isActive ? "scale-110" : "group-hover:scale-110"
          }`}
        >
          {icon}
        </span>
        {!collapsed && (
          <span
            className={`font-medium transition-all duration-300 ${
              isActive ? "font-semibold" : ""
            }`}
          >
            {label}
          </span>
        )}
      </div>

      {badge && !collapsed && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}

      {isActive && !collapsed && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      )}
    </Link>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Kiểm tra quyền admin từ localStorage
    const checkAdminStatus = () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          setIsAdmin(userData.role === "admin");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  const mainMenuItems = [
    { to: "/", icon: "🏠", label: "Trang Chủ" },
    { to: "/shopping-list", icon: "🛍️", label: "Danh Sách Mua Sắm" },
    { to: "/store", icon: "🏪", label: "Cửa Hàng Thực Phẩm" },
    { to: "/fridge", icon: "❄️", label: "Quản Lý Tủ Lạnh" },
    { to: "/recipes", icon: "👨‍🍳", label: "Công Thức Nấu Ăn" },
    { to: "/meal-planning", icon: "📅", label: "Lập Kế Hoạch Bữa Ăn" },
    { to: "/statistics", icon: "📊", label: "Thống Kê" },
  ];

  const adminMenuItems = [
    { to: "/account-management", icon: "👥", label: "Quản Lý Tài Khoản" },
    { to: "/data-management", icon: "📦", label: "Quản Lý Danh Mục" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header spanning full width */}
      <Header />

      {/* Sidebar and Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div
          className={`transition-all duration-300 bg-gradient-to-b from-white to-gray-50 shadow-xl border-r border-gray-200 flex flex-col ${
            collapsed ? "w-20" : "w-72"
          }`}
          onMouseEnter={() => setCollapsed(false)}
          onMouseLeave={() => setCollapsed(true)}
        >
          {/* Navigation */}
          <div className="flex-1 px-2 py-4 overflow-y-auto">
            <div>
              {/* Chức Năng Chính */}
              {!collapsed && (
                <div className="flex items-center gap-2 px-4 mb-4">
                  <div className="w-6 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Chức Năng Chính
                  </span>
                </div>
              )}
              <nav className="space-y-2">
                {mainMenuItems.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    badge={item.badge}
                    collapsed={collapsed}
                  />
                ))}
              </nav>
              {/* Quản Trị */}
              {isAdmin && (
                <>
                  {!collapsed && (
                    <div className="flex items-center gap-2 px-4 mt-8 mb-4">
                      <div className="w-6 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Quản Trị
                      </span>
                    </div>
                  )}
                  <nav className="space-y-2">
                    {adminMenuItems.map((item) => (
                      <NavItem
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        label={item.label}
                        badge={item.badge}
                        collapsed={collapsed}
                      />
                    ))}
                  </nav>
                </>
              )}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <NavItem
              to="/profile"
              icon="👤"
              label="Hồ Sơ Cá Nhân"
              collapsed={collapsed}
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Sidebar;
