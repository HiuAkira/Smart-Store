import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../config/api";

const ShoppingListDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // States - phải đặt trước bất kỳ early return nào
  const [list, setList] = useState(null);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "other",
    quantity: 1,
    unit: "cái",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const categories = [
    { value: "vegetable", label: "Rau củ", color: "#10b981" },
    { value: "fruit", label: "Trái cây", color: "#f59e0b" },
    { value: "meat", label: "Thịt", color: "#ef4444" },
    { value: "seafood", label: "Hải sản", color: "#3b82f6" },
    { value: "dairy", label: "Sữa và trứng", color: "#eab308" },
    { value: "grain", label: "Ngũ cốc", color: "#f59e0b" },
    { value: "spices", label: "Gia vị", color: "#8b5cf6" },
    { value: "frozen", label: "Thực phẩm đông lạnh", color: "#06b6d4" },
    { value: "other", label: "Khác", color: "#6b7280" },
  ];

  const units = [
    "kg",
    "g",
    "lít",
    "ml",
    "cái",
    "gói",
    "hộp",
    "túi",
    "lon",
    "chai",
    "bó",
    "ổ",
  ];
  const [showRefrigeratorConfirmModal, setShowRefrigeratorConfirmModal] =
    useState(false);
  const [itemToConfirmRefrigerator, setItemToConfirmRefrigerator] =
    useState(null);
  const [isFridgeModalOpen, setIsFridgeModalOpen] = useState(false);
  const [newFridgeItem, setNewFridgeItem] = useState(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [location, setLocation] = useState("cool");

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdminOrHousekeeper =
    user && (user.role === "admin" || user.role === "housekeeper");

  // API: Lấy chi tiết shopping list
  const fetchShoppingListDetail = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get(`/api/shopping-lists/${id}/`);
      console.log("Response:", response.data);
      console.log("Items với product_details:", response.data.items);
      setList({
        ...response.data.list,
        items: response.data.items || [],
        stats: response.data.stats || {},
      });
    } catch (error) {
      console.error("Error fetching shopping list:", error);
      setError(
        error.response?.data?.message ||
          "Không thể tải danh sách mua sắm. Vui lòng thử lại!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // API: Cập nhật số lượng item
  const updateItemQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;

    try {
      setIsUpdating(true);
      await api.put(`/api/shopping-lists/${id}/items/${itemId}/`, {
        quantity: quantity,
      });

      // Update local state
      setList((prevList) => ({
        ...prevList,
        items: prevList.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        ),
      }));
    } catch (error) {
      console.error("Error updating item quantity:", error);
      alert("Có lỗi xảy ra khi cập nhật số lượng. Vui lòng thử lại!");
    } finally {
      setIsUpdating(false);
    }
  };

  // API: Xóa item
  const removeItem = async (itemId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      setIsUpdating(true);
      await api.delete(`/api/shopping-lists/${id}/items/${itemId}/`);

      // Update local state
      setList((prevList) => ({
        ...prevList,
        items: prevList.items.filter((item) => item.id !== itemId),
      }));

      alert("Đã xóa sản phẩm thành công!");
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại!");
    } finally {
      setIsUpdating(false);
    }
  };

  // API: Tìm product để thêm item
  const findProduct = async (productName) => {
    try {
      const response = await api.get(`/api/products/`);

      // Tìm product có tên khớp với productName (case insensitive)
      const foundProduct = response.data.find((product) =>
        product.productName.toLowerCase().includes(productName.toLowerCase())
      );

      if (foundProduct) {
        return foundProduct.productID;
      }
      return null;
    } catch (error) {
      console.error("Error finding product:", error);
      return null;
    }
  };

  // API: Thêm item mới
  const addItem = async () => {
    if (!newItem.name.trim()) return;

    try {
      setIsUpdating(true);

      // Tìm product ID
      const productId = await findProduct(newItem.name);
      if (!productId) {
        alert(
          `Không tìm thấy sản phẩm "${newItem.name}" trong catalog. Vui lòng chọn sản phẩm khác.`
        );
        return;
      }

      // Thêm item vào shopping list
      await api.post(`/api/shopping-lists/${id}/items/`, {
        product: productId,
        quantity: newItem.quantity,
      });

      // Sau khi thêm thành công, gọi lại API để lấy dữ liệu mới nhất
      await fetchShoppingListDetail();

      // Reset form
      setNewItem({
        name: "",
        category: "other",
        quantity: 1,
        unit: "cái",
      });
      setShowAddForm(false);

      alert("Đã thêm sản phẩm thành công!");
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Có lỗi xảy ra khi thêm sản phẩm. Vui lòng thử lại!");
    } finally {
      setIsUpdating(false);
    }
  };

  // Load data khi component mount
  useEffect(() => {
    if (id) {
      fetchShoppingListDetail();
    }
  }, [id]);

  const calculateProgress = () => {
    if (!list || !list.items || list.items.length === 0) return 0;
    const purchasedItems = list.items.filter(
      (item) => item.purchased || item.status === "purchased"
    ).length;
    return Math.round((purchasedItems / list.items.length) * 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryInfo = (categoryValue) => {
    return (
      categories.find((cat) => cat.value === categoryValue) ||
      categories[categories.length - 1]
    );
  };

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
        <p style={{ color: "#6b7280", fontSize: "16px" }}>Đang tải...</p>
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

  // Error state hoặc không tìm thấy list
  if (error || !list) {
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
        }}
      >
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "12px 20px",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "14px",
              maxWidth: "500px",
              textAlign: "center",
            }}
          >
            ❌ {error}
          </div>
        )}
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
          {error ? "Có lỗi xảy ra" : "Không tìm thấy danh sách"}
        </h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate("/shopping-list")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ← Quay lại danh sách
          </button>
          {error && (
            <button
              onClick={() => fetchShoppingListDetail()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "10px 16px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🔄 Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  // Map category name từ backend sang frontend category values
  const mapCategoryNameToValue = (categoryName) => {
    const categoryMapping = {
      "Rau củ": "vegetable",
      "Trái cây": "fruit",
      Thịt: "meat",
      "Hải sản": "seafood",
      "Sữa và trứng": "dairy",
      "Ngũ cốc": "grain",
      "Gia vị": "spices",
      "Thực phẩm đông lạnh": "frozen",
      Khác: "other",
    };
    return categoryMapping[categoryName] || "other";
  };

  // Group items by category - với safe check
  const groupedItems = (list?.items || []).reduce((acc, item) => {
    // Lấy category name từ product_details hoặc fallback về "Khác"
    const categoryName = item.product_details?.category_name || "Khác";

    // Map category name sang frontend value
    const category = mapCategoryNameToValue(categoryName);

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      ...item,
      name: item.product_details?.productName || item.name || "Sản phẩm",
      purchased: item.status === "purchased" || item.purchased,
      category: category,
      unit: item.product_details?.unit || "cái",
    });
    return acc;
  }, {});

  const progress = calculateProgress();
  const totalItems = list?.items?.length || 0;
  const purchasedItems = (list?.items || []).filter(
    (item) => item.purchased || item.status === "purchased"
  ).length;

  // API: Toggle trạng thái item
  const toggleItemStatus = async (itemId) => {
    try {
      setIsUpdating(true);
      const item = list.items.find((item) => item.id === itemId);
      if (!item) throw new Error("Item không tồn tại");

      const wasPending = !(
        item.status === "purchased" || item.purchased === true
      );

      await api.patch(`/api/shopping-lists/${id}/items/${itemId}/toggle/`);

      const updatedItems = list.items.map((i) => {
        if (i.id === itemId) {
          return { ...i, purchased: !i.purchased };
        }
        return i;
      });

      setList({ ...list, items: updatedItems });

      const nowPurchased =
        updatedItems.find((i) => i.id === itemId)?.purchased === true;

      if (wasPending && nowPurchased) {
        // Chuyển từ pending sang purchased => mở modal
        setItemToConfirmRefrigerator(updatedItems.find((i) => i.id === itemId));
        setShowRefrigeratorConfirmModal(true);
      } else {
        // Không mở modal các trường hợp khác (purchased về pending, hoặc không đổi)
        setItemToConfirmRefrigerator(null);
        setShowRefrigeratorConfirmModal(false);
        fetchShoppingListDetail();
      }
    } catch (error) {
      console.error("Error toggling item status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại!");
    } finally {
      setIsUpdating(false);
    }
  };
  //Xử lý thêm vào tủ lạnh
  const handleConfirmAddToRefrigerator = async (item) => {
    console.log("Confirm item:", item);
    setNewFridgeItem({
      productName: item.product_details?.productName || "",
      quantity: item.quantity,
      unit: item.product_details?.unit || "",
      shoppingListItemId: item.id,
    });
    setExpiryDate(""); // reset ngày hết hạn mỗi lần mở modal
    setLocation("cool"); // mặc định vị trí là tủ lạnh
    setIsFridgeModalOpen(true);
    setShowRefrigeratorConfirmModal(false); // Đóng confirm modal
    setItemToConfirmRefrigerator(null);
  };
  //Xử lý hủy, không thêm vào tủ
  const handleCancelAddToRefrigerator = async () => {
    // Chỉ refresh lại danh sách và đóng modal
    await fetchShoppingListDetail();
    setShowRefrigeratorConfirmModal(false);
    setItemToConfirmRefrigerator(null);
  };

  const handleSubmitFridgeItem = async () => {
    if (!expiryDate) {
      alert("Vui lòng chọn ngày hết hạn");
      return;
    }
    try {
      const groupId = Number(localStorage.getItem("selectedGroup"));
      const payload = {
        productName: newFridgeItem.productName,
        quantity: Number(newFridgeItem.quantity),
        unit: newFridgeItem.unit,
        shoppingListItemId: newFridgeItem.shoppingListItemId,
        expiredDate: expiryDate,
        location: location,
      };

      await api.post(`/api/fridge/?group_id=${groupId}`, payload);

      setIsFridgeModalOpen(false);
      setNewFridgeItem(null);
      setExpiryDate("");
      setLocation("cool");
      alert("Đã thêm sản phẩm vào tủ lạnh thành công!");
    } catch {
      alert("Có lỗi xảy ra khi thêm sản phẩm vào tủ lạnh. Vui lòng thử lại!");
    }
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={() => navigate("/shopping-list")}
            disabled={isUpdating}
            style={{
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "8px 12px",
              cursor: isUpdating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              opacity: isUpdating ? 0.6 : 1,
            }}
          >
            ← Quay lại
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>
              {list.listName}
            </h1>
            <p
              style={{
                margin: "5px 0 0 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              {formatDate(list.date)}
            </p>
          </div>
        </div>
        <button
          disabled={isUpdating}
          style={{
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            padding: "10px 16px",
            cursor: isUpdating ? "not-allowed" : "pointer",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            opacity: isUpdating ? 0.6 : 1,
          }}
        >
          ✏️ Chỉnh sửa
        </button>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "20px",
            background: "white",
          }}
        >
          <div
            style={{ color: "#6b7280", fontSize: "14px", marginBottom: "10px" }}
          >
            Tiến độ
          </div>
          <div style={{ marginBottom: "10px" }}>
            <div
              style={{
                width: "100%",
                height: "8px",
                background: "#f3f4f6",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#10b981",
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
            {progress}%
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "20px",
            background: "white",
          }}
        >
          <div
            style={{ color: "#6b7280", fontSize: "14px", marginBottom: "10px" }}
          >
            Tổng sản phẩm
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
            {totalItems}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "20px",
            background: "white",
          }}
        >
          <div
            style={{ color: "#6b7280", fontSize: "14px", marginBottom: "10px" }}
          >
            Đã mua
          </div>
          <div
            style={{ fontSize: "2rem", fontWeight: "bold", color: "#059669" }}
          >
            {purchasedItems}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "20px",
            background: "white",
          }}
        >
          <div
            style={{ color: "#6b7280", fontSize: "14px", marginBottom: "10px" }}
          >
            Còn lại
          </div>
          <div
            style={{ fontSize: "2rem", fontWeight: "bold", color: "#ea580c" }}
          >
            {totalItems - purchasedItems}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          background: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600" }}>
            Danh sách sản phẩm
          </h2>
          {isAdminOrHousekeeper && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={isUpdating}
              style={{
                background: isUpdating ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "10px 16px",
                cursor: isUpdating ? "not-allowed" : "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ➕ Thêm sản phẩm
            </button>
          )}
        </div>

        <div style={{ padding: "20px" }}>
          {/* Add Form */}
          {showAddForm && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "20px",
                background: "#f8fafc",
                marginBottom: "30px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 15px 0",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                }}
              >
                Thêm sản phẩm mới
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "15px",
                  marginBottom: "15px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Tên sản phẩm
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên sản phẩm"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    disabled={isUpdating}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      opacity: isUpdating ? 0.6 : 1,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Danh mục
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({ ...newItem, category: e.target.value })
                    }
                    disabled={isUpdating}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      opacity: isUpdating ? 0.6 : 1,
                    }}
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    disabled={isUpdating}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      opacity: isUpdating ? 0.6 : 1,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Đơn vị
                  </label>
                  <select
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit: e.target.value })
                    }
                    disabled={isUpdating}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      opacity: isUpdating ? 0.6 : 1,
                    }}
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={addItem}
                  disabled={!newItem.name.trim() || isUpdating}
                  style={{
                    background:
                      !newItem.name.trim() || isUpdating
                        ? "#9ca3af"
                        : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 16px",
                    cursor:
                      !newItem.name.trim() || isUpdating
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {isUpdating ? "Đang thêm..." : "➕ Thêm"}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={isUpdating}
                  style={{
                    background: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "10px 16px",
                    cursor: isUpdating ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    opacity: isUpdating ? 0.6 : 1,
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Items by Category */}
          {Object.entries(groupedItems).map(
            ([category, categoryItems], index) => {
              const categoryInfo = getCategoryInfo(category);

              return (
                <div key={category} style={{ marginBottom: "30px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "15px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: categoryInfo.color,
                      }}
                    />
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.1rem",
                        fontWeight: "600",
                      }}
                    >
                      {categoryInfo.label}
                    </h3>
                    <span
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {categoryItems.length}
                    </span>
                  </div>

                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    {/* Table Header */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "50px 1fr 150px 80px 80px",
                        background: "#f9fafb",
                        padding: "12px",
                        borderBottom: "1px solid #e5e7eb",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#6b7280",
                      }}
                    >
                      <div>✓</div>
                      <div>Sản phẩm</div>
                      <div>Số lượng</div>
                      <div>Đơn vị</div>
                      <div>Thao tác</div>
                    </div>

                    {/* Table Body */}
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "50px 1fr 150px 80px 80px",
                          padding: "12px",
                          borderBottom: "1px solid #e5e7eb",
                          background: item.purchased ? "#f9fafb" : "white",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <input
                            type="checkbox"
                            checked={item.purchased}
                            onChange={() => toggleItemStatus(item.id)}
                            disabled={isUpdating}
                            style={{
                              width: "16px",
                              height: "16px",
                              cursor: isUpdating ? "not-allowed" : "pointer",
                            }}
                          />
                        </div>

                        <div>
                          <span
                            style={{
                              fontWeight: "500",
                              textDecoration: item.purchased
                                ? "line-through"
                                : "none",
                              color: item.purchased ? "#9ca3af" : "#374151",
                            }}
                          >
                            {item.name}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <button
                            onClick={() =>
                              updateItemQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1 || isUpdating}
                            style={{
                              background: "white",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              width: "24px",
                              height: "24px",
                              cursor:
                                item.quantity > 1 && !isUpdating
                                  ? "pointer"
                                  : "not-allowed",
                              fontSize: "12px",
                              opacity:
                                item.quantity > 1 && !isUpdating ? 1 : 0.5,
                            }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(
                                item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            disabled={isUpdating}
                            style={{
                              width: "60px",
                              height: "32px",
                              textAlign: "center",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "14px",
                              opacity: isUpdating ? 0.6 : 1,
                            }}
                          />
                          <button
                            onClick={() =>
                              updateItemQuantity(item.id, item.quantity + 1)
                            }
                            disabled={isUpdating}
                            style={{
                              background: "white",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              width: "24px",
                              height: "24px",
                              cursor: isUpdating ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              opacity: isUpdating ? 0.6 : 1,
                            }}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          {item.product_details?.unit || item.unit || "cái"}
                        </div>

                        <div>
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={isUpdating}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: isUpdating ? "not-allowed" : "pointer",
                              color: isUpdating ? "#9ca3af" : "#ef4444",
                              fontSize: "16px",
                              width: "24px",
                              height: "24px",
                              borderRadius: "4px",
                            }}
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Separator between categories */}
                  {index < Object.keys(groupedItems).length - 1 && (
                    <div
                      style={{
                        height: "1px",
                        background: "#e5e7eb",
                        margin: "20px 0",
                      }}
                    />
                  )}
                </div>
              );
            }
          )}

          {/* Empty State */}
          {list.items.length === 0 && isAdminOrHousekeeper && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#9ca3af",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "15px" }}>🛒</div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  margin: "0 0 10px 0",
                }}
              >
                Chưa có sản phẩm nào
              </h3>
              <p style={{ margin: "0 0 20px 0", fontSize: "14px" }}>
                Thêm sản phẩm đầu tiên vào danh sách của bạn
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                disabled={isUpdating}
                style={{
                  background: isUpdating ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 16px",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  margin: "0 auto",
                }}
              >
                ➕ Thêm sản phẩm
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal xác nhận "thêm vào tủ lạnh" */}
      {showRefrigeratorConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "28rem",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "16px",
                margin: "0 0 16px 0",
              }}
            >
              Đã cập nhật trạng thái sản phẩm!
            </h2>
            <p
              style={{
                marginBottom: "24px",
                margin: "0 0 24px 0",
                color: "#6b7280",
              }}
            >
              Bạn có muốn thêm sản phẩm này vào tủ lạnh không?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                gap: "12px",
              }}
            >
              <button
                onClick={() =>
                  handleConfirmAddToRefrigerator(itemToConfirmRefrigerator)
                }
                style={{
                  background: "#10b981",
                  color: "white",
                  padding: "8px 24px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.background = "#059669")}
                onMouseOut={(e) => (e.target.style.background = "#10b981")}
              >
                Có, thêm vào tủ lạnh
              </button>
              <button
                onClick={handleCancelAddToRefrigerator}
                style={{
                  background: "#d1d5db",
                  color: "#374151",
                  padding: "8px 24px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.background = "#9ca3af")}
                onMouseOut={(e) => (e.target.style.background = "#d1d5db")}
              >
                Không
              </button>
            </div>
          </div>
        </div>
      )}
      {isFridgeModalOpen && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              Xác nhận thêm sản phẩm vào tủ lạnh
            </h2>

            {/* Ngày hết hạn */}
            <div>
              <label className="block font-medium text-sm text-gray-700 mb-1">
                Ngày hết hạn
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Vị trí */}
            <div className="mt-4">
              <label className="block font-medium text-sm text-gray-700 mb-1">
                Vị trí
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="cool">Tủ lạnh</option>
                <option value="freeze">Ngăn đông</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsFridgeModalOpen(false);
                  setNewFridgeItem(null);
                  setExpiryDate("");
                  setLocation("cool");
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitFridgeItem}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShoppingListDetail;
