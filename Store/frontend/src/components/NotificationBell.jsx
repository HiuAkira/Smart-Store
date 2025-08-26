import React, { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, Clock, Calendar } from "lucide-react";
import api from "../config/api";
import { setupNotificationAutoRefresh } from "../utils/notificationUtils";

// Export utility function để backwards compatibility
export const triggerNotificationRefresh = () => {
  const event = new CustomEvent("fridgeUpdated");
  window.dispatchEvent(event);
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [groupId, setGroupId] = useState(null);

  useEffect(() => {
    const storedGroupId = localStorage.getItem("selectedGroup");
    if (storedGroupId) setGroupId(storedGroupId);
  }, []);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = groupId ? { group_id: groupId } : {};
      const response = await api.get("/api/fridge/notifications/", { params });
      const items = response.data.items || response.data || [];
      const total =
        response.data.total_expiring || response.data.total || items.length;

      setNotifications(items);
      setTotalCount(total);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Không reset về 0 khi có lỗi, giữ nguyên state cũ
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when component mounts
  useEffect(() => {
    if (groupId) {
      fetchNotifications();

      // Set up interval to refresh notifications every 2 minutes
      const interval = setInterval(fetchNotifications, 2 * 60 * 1000);

      // Setup auto-refresh cho các events
      const cleanupAutoRefresh =
        setupNotificationAutoRefresh(fetchNotifications);

      // Tự động refresh vào 00:00 hàng ngày để cập nhật urgency
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // 00:00 ngày mai
      const msUntilMidnight = midnight.getTime() - now.getTime();

      const midnightTimeout = setTimeout(() => {
        fetchNotifications();

        // Sau khi đã refresh lần đầu vào 00:00, thiết lập interval 24h
        const dailyInterval = setInterval(() => {
          console.log("Daily refresh - updating notifications urgency...");
          fetchNotifications();
        }, 24 * 60 * 60 * 1000); // 24 giờ

        return () => clearInterval(dailyInterval);
      }, msUntilMidnight);

      return () => {
        clearInterval(interval);
        clearTimeout(midnightTimeout);
        cleanupAutoRefresh();
      };
    }
  }, [groupId]);

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchNotifications();
  };

  // Get urgency icon and color
  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case "critical":
        return {
          icon: <AlertTriangle size={16} className="text-red-500" />,
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          borderColor: "border-red-200",
        };
      case "high":
        return {
          icon: <Clock size={16} className="text-orange-500" />,
          bgColor: "bg-orange-50",
          textColor: "text-orange-700",
          borderColor: "border-orange-200",
        };
      case "medium":
        return {
          icon: <Calendar size={16} className="text-yellow-500" />,
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-700",
          borderColor: "border-yellow-200",
        };
      default:
        return {
          icon: <Clock size={16} className="text-gray-500" />,
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
        };
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-white hover:bg-green-600 rounded-lg transition-colors"
        title={`Thông báo (${totalCount || notifications.length})`}
      >
        <Bell size={20} />
        {(totalCount > 0 || notifications.length > 0) && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {totalCount > 99
              ? "99+"
              : totalCount > 0
              ? totalCount
              : notifications.length}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-2xl border z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              Thông báo thực phẩm sắp hết hạn
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                title="Làm mới thông báo"
              >
                🔄
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                <p className="text-sm text-gray-600 mt-2">
                  Đang tải thông báo...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-green-500 text-4xl mb-2">✅</div>
                <p className="text-sm text-gray-600">
                  Không có thực phẩm nào sắp hết hạn trong 3 ngày tới
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  API: {totalCount} total | State: {notifications.length} items
                </p>
                <p className="text-xs text-gray-400">
                  Làm mới lần cuối: {new Date().toLocaleTimeString("vi-VN")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((item) => {
                  const style = getUrgencyStyle(item.urgency);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 hover:bg-gray-50 transition-colors ${style.bgColor} ${style.borderColor} border-l-4`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{style.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {item.product_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} {item.product_unit} •{" "}
                            {item.location === "cool" ? "Tủ lạnh" : "Ngăn đông"}
                          </p>
                          <p
                            className={`text-sm font-medium ${style.textColor}`}
                          >
                            {item.expiredDate &&
                            new Date(item.expiredDate) < new Date()
                              ? "⚠ Đã hết hạn!"
                              : item.urgency_text}
                          </p>
                          {item.product_category_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              Danh mục: {item.product_category_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowNotifications(false);
                  window.location.href = "/fridge";
                }}
                className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Xem tất cả trong tủ lạnh →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
