import React, { useState, useEffect } from "react";
import { Plus, ShoppingCart, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

const ShoppingList = () => {
  const navigate = useNavigate();

  // Lấy user từ localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userRole = user?.role || "member";

  // States
  const [lists, setLists] = useState([]);
  const [listStats, setListStats] = useState({}); // Lưu stats cho từng list
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all, active, completed

  // API: Fetch shopping lists
  const fetchShoppingLists = async () => {
    try {
      setIsLoading(true);
      setError("");
      const groupId = localStorage.getItem("selectedGroup");
      if (!groupId) {
        setError("Không xác định được group hiện tại. Vui lòng chọn nhóm!");
        setIsLoading(false);
        return;
      }
      const response = await api.get(
        `/api/shopping-lists/?group_id=${groupId}`
      );
      setLists(response.data);

      // Fetch stats cho từng list
      await fetchListsStats(response.data);
    } catch (error) {
      console.error("Error fetching shopping lists:", error);
      setError(
        error.response?.data?.message ||
          "Không thể tải danh sách mua sắm. Vui lòng thử lại!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // API: Fetch stats cho tất cả lists
  const fetchListsStats = async (listsData) => {
    const statsPromises = listsData.map(async (list) => {
      try {
        const response = await api.get(`/api/shopping-lists/${list.listID}/`);
        return {
          listID: list.listID,
          stats: response.data.stats,
          items: response.data.items.slice(0, 3), // Lấy 3 items đầu để preview
        };
      } catch (error) {
        console.error(`Error fetching stats for list ${list.listID}:`, error);
        return {
          listID: list.listID,
          stats: {
            total_items: 0,
            purchased_items: 0,
            pending_items: 0,
            progress: 0,
          },
          items: [],
        };
      }
    });

    const statsResults = await Promise.all(statsPromises);
    const statsMap = {};
    statsResults.forEach((result) => {
      statsMap[result.listID] = result;
    });
    setListStats(statsMap);
  };

  // Load data when component mounts
  useEffect(() => {
    fetchShoppingLists();
  }, []);

  // Calculate progress for a list
  const calculateProgress = (list) => {
    const stats = listStats[list.listID];
    if (!stats || !stats.stats) return 0;

    const { total_items, purchased_items } = stats.stats;
    if (total_items === 0) return 0;

    const progress = Math.round((purchased_items / total_items) * 100);

    // Debug logging (có thể xóa sau khi test xong)
    console.log(
      `List ${list.listName}: ${purchased_items}/${total_items} = ${progress}%`
    );

    return Math.min(100, Math.max(0, progress)); // Đảm bảo progress trong khoảng 0-100
  };

  // Get list status based on progress
  const getListStatus = (list) => {
    const progress = calculateProgress(list);
    if (progress === 100) return "completed"; // Đã hoàn thành 100%
    if (progress > 0 && progress < 100) return "active"; // Đang mua (0% < progress < 100%)
    return "pending"; // Chưa bắt đầu (progress = 0%)
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get category color based on category value
  const getCategoryColor = (category) => {
    const categoryColors = {
      vegetable: "#10b981",
      fruit: "#f59e0b",
      meat: "#ef4444",
      seafood: "#3b82f6",
      dairy: "#eab308",
      grain: "#f59e0b",
      spices: "#8b5cf6",
      frozen: "#06b6d4",
      other: "#6b7280",
    };
    return categoryColors[category] || "#6b7280";
  };

  // Filter lists based on search term and active filter
  const filteredLists = lists.filter((list) => {
    const matchesSearch = list.listName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "all") return true;
    if (activeFilter === "active") return getListStatus(list) === "active";
    if (activeFilter === "completed")
      return getListStatus(list) === "completed";

    return true;
  });

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          gap: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f4f6",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ color: "#6b7280", fontSize: "16px" }}>
          Đang tải danh sách...
        </p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
          Danh sách mua sắm
        </h1>
        {/* Chỉ admin hoặc housekeeper mới thấy nút tạo danh sách mới */}
        {(userRole === "admin" || userRole === "housekeeper") && (
          <button
            onClick={() => navigate("/add-shopping-list")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#059669")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#10b981")}
          >
            <Plus size={18} />
            Tạo danh sách mới
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "24px",
            fontSize: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>❌ {error}</span>
          <button
            onClick={fetchShoppingLists}
            style={{
              background: "transparent",
              border: "1px solid #dc2626",
              borderRadius: "4px",
              padding: "4px 8px",
              color: "#dc2626",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm danh sách..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 16px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
        />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveFilter("all")}
          style={{
            background: activeFilter === "all" ? "#e5e7eb" : "transparent",
            border: "none",
            padding: "6px 16px",
            borderRadius: "20px",
            fontWeight: activeFilter === "all" ? "600" : "normal",
            color: activeFilter === "all" ? "#000" : "#6b7280",
            cursor: "pointer",
            fontSize: "14px",
            transition: "all 0.2s",
          }}
        >
          Tất cả
        </button>
        <button
          onClick={() => setActiveFilter("active")}
          style={{
            background: activeFilter === "active" ? "#e5e7eb" : "transparent",
            border: "none",
            padding: "6px 16px",
            borderRadius: "20px",
            fontWeight: activeFilter === "active" ? "600" : "normal",
            color: activeFilter === "active" ? "#000" : "#6b7280",
            cursor: "pointer",
            fontSize: "14px",
            transition: "all 0.2s",
          }}
        >
          Đang mua
        </button>
        <button
          onClick={() => setActiveFilter("completed")}
          style={{
            background:
              activeFilter === "completed" ? "#e5e7eb" : "transparent",
            border: "none",
            padding: "6px 16px",
            borderRadius: "20px",
            fontWeight: activeFilter === "completed" ? "600" : "normal",
            color: activeFilter === "completed" ? "#000" : "#6b7280",
            cursor: "pointer",
            fontSize: "14px",
            transition: "all 0.2s",
          }}
        >
          Đã hoàn thành
        </button>
      </div>

      {/* Shopping Lists Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Existing Lists */}
        {filteredLists.map((list) => {
          const progress = calculateProgress(list);
          const stats = listStats[list.listID]?.stats || {
            total_items: 0,
            purchased_items: 0,
            pending_items: 0,
          };
          const previewItems = listStats[list.listID]?.items || [];
          const status = getListStatus(list);

          return (
            <div
              key={list.listID}
              style={{
                background: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #e5e7eb",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 1px 3px rgba(0, 0, 0, 0.1)";
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <h2
                  style={{
                    fontWeight: "600",
                    fontSize: "1.125rem",
                    margin: "0",
                    flex: 1,
                  }}
                >
                  {list.listName}
                </h2>
                <span
                  style={{
                    background:
                      status === "completed"
                        ? "#dcfce7" // Xanh lá nhạt cho hoàn thành
                        : status === "active"
                        ? "#fef3c7" // Vàng nhạt cho đang mua
                        : "#f3f4f6", // Xám nhạt cho chưa bắt đầu
                    color:
                      status === "completed"
                        ? "#166534" // Xanh lá đậm
                        : status === "active"
                        ? "#92400e" // Vàng đậm
                        : "#374151", // Xám đậm
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    marginLeft: "8px",
                  }}
                >
                  {status === "completed"
                    ? `✅ Hoàn thành (${progress}%)`
                    : status === "active"
                    ? `🛒 Đang mua (${progress}%)`
                    : "⏸️ Chưa bắt đầu"}
                </span>
              </div>

              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  margin: "0 0 12px 0",
                }}
              >
                {formatDate(list.date)}
              </p>

              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  marginBottom: "12px",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "#059669" }}>
                  ✅ {stats.purchased_items} đã mua
                </span>
                <span style={{ color: "#dc2626" }}>
                  ⏳ {stats.pending_items} còn lại
                </span>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    Tiến độ
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>
                    {progress}%
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "#e5e7eb",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background:
                        progress === 100
                          ? "#10b981" // Xanh lá cho hoàn thành 100%
                          : progress > 0
                          ? "#f59e0b" // Vàng cho đang mua (0% < progress < 100%)
                          : "#e5e7eb", // Xám cho chưa bắt đầu (0%)
                      borderRadius: "4px",
                      width: `${progress}%`,
                      transition: "width 0.3s ease, background-color 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* List Type Badge */}
              <div style={{ marginBottom: "16px" }}>
                <span
                  style={{
                    background: list.type === "week" ? "#dbeafe" : "#fef3c7",
                    color: list.type === "week" ? "#1e40af" : "#92400e",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {list.type === "week" ? "Hàng tuần" : "Hàng ngày"}
                </span>
              </div>

              {/* Items Preview */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {previewItems.length > 0 ? (
                    <>
                      {previewItems.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            opacity: item.status === "purchased" ? 0.6 : 1,
                            textDecoration:
                              item.status === "purchased"
                                ? "line-through"
                                : "none",
                          }}
                        >
                          <span
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: getCategoryColor(
                                item.product_details?.category || "other"
                              ),
                            }}
                          />
                          <span>
                            {item.product_details?.productName ||
                              `Sản phẩm ${itemIndex + 1}`}
                          </span>
                          <span style={{ color: "#6b7280", fontSize: "12px" }}>
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                      {stats.total_items > 3 && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            marginTop: "4px",
                          }}
                        >
                          + {stats.total_items - 3} sản phẩm khác...
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#9ca3af",
                        fontStyle: "italic",
                      }}
                    >
                      Chưa có sản phẩm nào
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate(`/shopping-list/${list.listID}`)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#f1f5f9")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#f8fafc")}
              >
                <ShoppingCart size={16} />
                Chi tiết
              </button>
            </div>
          );
        })}

        {/* Create New Card - chỉ hiển thị khi có ít nhất 1 danh sách */}
        {lists.length > 0 &&
          (userRole === "admin" || userRole === "housekeeper") && (
            <div
              onClick={() => navigate("/add-shopping-list")}
              style={{
                border: "2px dashed #d1d5db",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#6b7280",
                cursor: "pointer",
                transition: "all 0.2s",
                minHeight: "200px",
                padding: "16px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
                e.currentTarget.style.borderColor = "#9ca3af";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
            >
              <div>
                <Plus size={24} style={{ margin: "0 auto 8px" }} />
                <p style={{ fontWeight: "600", margin: "0 0 4px 0" }}>
                  Tạo danh sách mới
                </p>
                <p style={{ fontSize: "14px", margin: 0 }}>
                  Lên kế hoạch mua sắm ngay
                </p>
              </div>
            </div>
          )}
      </div>

      {/* Empty State - chỉ hiển thị khi không có danh sách nào */}
      {!isLoading &&
        !error &&
        lists.length === 0 &&
        (userRole === "admin" || userRole === "housekeeper") && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#9ca3af",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛒</div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                margin: "0 0 8px 0",
              }}
            >
              Chưa có danh sách nào
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px" }}>
              Tạo danh sách mua sắm đầu tiên của bạn
            </p>
            <button
              onClick={() => navigate("/add-shopping-list")}
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "12px 24px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: "0 auto",
              }}
            >
              <Plus size={16} />
              Tạo danh sách mới
            </button>
          </div>
        )}

      {/* No Search Results - hiển thị khi có data nhưng search không có kết quả */}
      {!isLoading &&
        !error &&
        lists.length > 0 &&
        filteredLists.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#9ca3af",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                margin: "0 0 8px 0",
              }}
            >
              Không tìm thấy kết quả
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px" }}>
              Không có danh sách nào chứa "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm("")}
              style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "10px 20px",
                cursor: "pointer",
                fontSize: "14px",
                margin: "0 auto",
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

      {/* Show count */}
      {!isLoading && !error && filteredLists.length > 0 && (
        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            padding: "16px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Hiển thị {filteredLists.length} / {lists.length} danh sách
          {searchTerm && <span> cho từ khóa "{searchTerm}"</span>}
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
