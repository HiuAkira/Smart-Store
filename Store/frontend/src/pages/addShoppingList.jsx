import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, ShoppingCart, List } from "lucide-react";
import api from "../config/api";

const AddShoppingList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy group_id từ localStorage khi khởi tạo
  const groupId = localStorage.getItem("selectedGroup") || 1;

  const [listData, setListData] = useState({
    name: "",
    description: "",
    items: [],
    totalEstimatedPrice: 0,
    createdDate: new Date(),
    type: "day",
    group: groupId,
  });

  const [currentItem, setCurrentItem] = useState({
    name: "",
    quantity: 1,
    unit: "kg",
    category: "other",
    note: "",
    estimatedPrice: "",
    priority: "medium",
  });

  const [editingItemId, setEditingItemId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // States for product suggestions
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

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
    "vỉ",
    "bó",
  ];

  const priorities = [
    { value: "low", label: "Thấp", color: "#6b7280" },
    { value: "medium", label: "Trung bình", color: "#3b82f6" },
    { value: "high", label: "Cao", color: "#ef4444" },
  ];

  const createShoppingList = async (listInfo) => {
    try {
      const response = await api.post("/api/shopping-lists/", {
        listName: listInfo.name,
        date: new Date().toISOString().split("T")[0],
        group: parseInt(listInfo.group),
        type: listInfo.type,
        user: JSON.parse(localStorage.getItem("user"))?.id,
      });
      return response.data.data;
    } catch (error) {
      console.error("Error creating shopping list:", error);
      throw error;
    }
  };

  const addItemToList = async (listId, productId, quantity) => {
    try {
      const response = await api.post(`/api/shopping-lists/${listId}/items/`, {
        product: productId,
        quantity: quantity,
      });
      return response.data.data;
    } catch (error) {
      console.error("Error adding item to list:", error);
      throw error;
    }
  };

  const findOrCreateProduct = async (itemData) => {
    try {
      const response = await api.get(`/api/products/`);
      console.log(`Total products in catalog: ${response.data.length}`);
      console.log(`Looking for product: "${itemData.name}"`);

      // Log một vài sản phẩm đầu tiên để debug
      if (response.data.length > 0) {
        console.log(
          "First few products:",
          response.data.slice(0, 3).map((p) => p.productName)
        );
      }

      // Tìm product có tên khớp với itemData.name (case insensitive)
      // Ưu tiên tìm kiếm chính xác trước, sau đó mới tìm kiếm gần đúng
      let foundProduct = response.data.find(
        (product) =>
          product.productName.toLowerCase() === itemData.name.toLowerCase()
      );

      if (!foundProduct) {
        foundProduct = response.data.find((product) =>
          product.productName
            .toLowerCase()
            .includes(itemData.name.toLowerCase())
        );
      }

      if (foundProduct) {
        console.log(
          `✅ Found product: ${foundProduct.productName} (ID: ${foundProduct.productID})`
        );
        return foundProduct.productID;
      } else {
        console.warn(`❌ Product "${itemData.name}" not found in catalog`);
        console.log(
          "Available products:",
          response.data.map((p) => p.productName)
        );
        return null;
      }
    } catch (error) {
      console.error("Error finding product:", error);
      return null;
    }
  };

  const addItem = () => {
    if (!currentItem.name.trim()) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }

    const quantity = currentItem.quantity || 1;
    const estimatedPrice = currentItem.estimatedPrice
      ? parseFloat(currentItem.estimatedPrice)
      : 0;
    const totalPrice = estimatedPrice * quantity;

    const newItem = {
      ...currentItem,
      id: editingItemId || Date.now().toString(),
      isCompleted: false,
      estimatedPrice: estimatedPrice,
      quantity: quantity,
      totalPrice: totalPrice,
    };

    if (editingItemId) {
      const updatedItems = listData.items.map((item) =>
        item.id === editingItemId ? newItem : item
      );
      const newTotal = updatedItems.reduce(
        (total, item) => total + (item.totalPrice || 0),
        0
      );

      setListData((prev) => ({
        ...prev,
        items: updatedItems,
        totalEstimatedPrice: newTotal,
      }));
      setEditingItemId(null);
    } else {
      setListData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
        totalEstimatedPrice:
          prev.totalEstimatedPrice + (newItem.totalPrice || 0),
      }));
    }

    setCurrentItem({
      name: "",
      quantity: 1,
      unit: "kg",
      category: "other",
      note: "",
      estimatedPrice: "",
      priority: "medium",
    });
  };

  const removeItem = (itemId) => {
    const removedItem = listData.items.find((item) => item.id === itemId);
    setListData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
      totalEstimatedPrice:
        prev.totalEstimatedPrice - (removedItem?.totalPrice || 0),
    }));
  };

  const toggleItemCompleted = (itemId) => {
    setListData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
      ),
    }));
  };

  const editItem = (item) => {
    setCurrentItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      note: item.note,
      estimatedPrice: item.estimatedPrice ? item.estimatedPrice.toString() : "",
      priority: item.priority,
    });
    setEditingItemId(item.id);
  };

  const saveList = async () => {
    if (!listData.name.trim()) {
      alert("Vui lòng nhập tên danh sách mua sắm!");
      return;
    }

    if (listData.items.length === 0) {
      alert("Vui lòng thêm ít nhất một sản phẩm vào danh sách!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Lấy group_id mới nhất từ localStorage trước khi lưu
      const currentGroupId = localStorage.getItem("selectedGroup") || 1;
      const createdList = await createShoppingList({
        ...listData,
        group: currentGroupId,
      });
      console.log("Created shopping list:", createdList);

      const addedItems = [];
      for (const item of listData.items) {
        try {
          console.log(`Processing item: "${item.name}"`);
          const productId = await findOrCreateProduct(item);

          if (productId) {
            console.log(
              `Adding item "${item.name}" with productId: ${productId}`
            );
            const addedItem = await addItemToList(
              createdList.listID,
              productId,
              item.quantity
            );
            addedItems.push(addedItem);
            console.log(`Successfully added item:`, addedItem);
          } else {
            console.warn(
              `Skipping item "${item.name}" - product not found in catalog`
            );
          }
        } catch (itemError) {
          console.error(`Error adding item "${item.name}":`, itemError);
        }
      }

      console.log("Added items:", addedItems);

      localStorage.setItem("lastShoppingList", JSON.stringify(listData));

      alert(
        `Đã tạo danh sách thành công! Đã thêm ${addedItems.length}/${listData.items.length} sản phẩm.`
      );

      navigate(`/shopping-list/${createdList.listID}`);
    } catch (error) {
      console.error("Error saving shopping list:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi lưu danh sách. Vui lòng thử lại!"
      );

      localStorage.setItem("shoppingList", JSON.stringify(listData));
    } finally {
      setIsLoading(false);
    }
  };

  const exportList = () => {
    if (listData.items.length === 0) {
      alert("Danh sách trống, không thể xuất!");
      return;
    }

    const listText = `
DANH SÁCH MUA SẮM: ${listData.name}
${listData.description ? `Mô tả: ${listData.description}` : ""}
Ngày tạo: ${listData.createdDate.toLocaleDateString("vi-VN")}

DANH SÁCH SẢN PHẨM:
${listData.items
  .map(
    (item) =>
      `☐ ${item.name} - ${item.quantity} ${item.unit}${
        item.estimatedPrice
          ? ` (~${item.estimatedPrice.toLocaleString()}đ)`
          : ""
      }${item.note ? ` - ${item.note}` : ""}`
  )
  .join("\n")}

TỔNG ƯỚC TÍNH: ${listData.totalEstimatedPrice.toLocaleString()}đ
Tổng số mặt hàng: ${listData.items.length}
    `.trim();

    const blob = new Blob([listText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${listData.name || "shopping-list"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryInfo = (category) => {
    return (
      categories.find((c) => c.value === category) ||
      categories[categories.length - 1]
    );
  };

  const getPriorityInfo = (priority) => {
    return priorities.find((p) => p.value === priority) || priorities[1];
  };

  const completedItems = listData.items.filter((item) => item.isCompleted);
  const pendingItems = listData.items.filter((item) => !item.isCompleted);

  // API: Fetch all products for suggestions
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await api.get("/api/products/");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Load products when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle product name input change with suggestions
  const handleProductNameChange = (value) => {
    setCurrentItem({ ...currentItem, name: value });

    if (value.trim().length >= 2) {
      const filtered = products.filter((product) =>
        product.productName.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8)); // Limit to 8 suggestions
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (product) => {
    // Map category name từ backend sang frontend categories
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

    setCurrentItem({
      ...currentItem,
      name: product.productName,
      category: categoryMapping[product.category_name] || "other",
      estimatedPrice: product.estimatedPrice
        ? product.estimatedPrice.toString()
        : "",
      unit: product.unit || "cái",
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Khi vào trang, nếu có location.state.items thì tự động điền vào listData.items (chỉ khi items rỗng)
  useEffect(() => {
    if (
      location.state &&
      Array.isArray(location.state.items) &&
      location.state.items.length > 0 &&
      listData.items.length === 0
    ) {
      // Chuyển đổi dữ liệu sang format phù hợp với listData.items
      const mappedItems = location.state.items.map((item, idx) => ({
        id: Date.now().toString() + idx,
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || "kg",
        category: "other",
        note: item.recipe ? `Cho món: ${item.recipe}` : "",
        estimatedPrice: "",
        priority: "medium",
        isCompleted: false,
        totalPrice: 0,
      }));
      setListData((prev) => ({
        ...prev,
        items: mappedItems,
        totalEstimatedPrice: 0,
      }));
    }
  }, [location.state, listData.items.length]);

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          ❌ {error}
        </div>
      )}

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
            disabled={isLoading}
            style={{
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "8px 12px",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            ← Quay lại danh sách
          </button>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>
            Tạo danh sách mua sắm
          </h1>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={exportList}
            disabled={listData.items.length === 0 || isLoading}
            style={{
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "10px 16px",
              cursor:
                listData.items.length > 0 && !isLoading
                  ? "pointer"
                  : "not-allowed",
              opacity: listData.items.length > 0 && !isLoading ? 1 : 0.5,
              fontSize: "14px",
            }}
          >
            📥 Xuất danh sách
          </button>
          <button
            onClick={saveList}
            disabled={isLoading}
            style={{
              background: isLoading ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "10px 16px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #ffffff40",
                    borderTop: "2px solid #ffffff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Đang lưu...
              </>
            ) : (
              <>💾 Lưu danh sách</>
            )}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: "30px",
          "@media (max-width: 768px)": {
            gridTemplateColumns: "1fr",
          },
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "20px",
              background: "white",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                fontSize: "1.2rem",
                fontWeight: "600",
              }}
            >
              Thông tin danh sách
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
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
                  Tên danh sách *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mua sắm cuối tuần"
                  value={listData.name}
                  onChange={(e) =>
                    setListData({ ...listData, name: e.target.value })
                  }
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    opacity: isLoading ? 0.6 : 1,
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
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  placeholder="Ghi chú thêm về danh sách này..."
                  value={listData.description}
                  onChange={(e) =>
                    setListData({ ...listData, description: e.target.value })
                  }
                  disabled={isLoading}
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    resize: "vertical",
                    opacity: isLoading ? 0.6 : 1,
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
                  Loại danh sách
                </label>
                <select
                  value={listData.type}
                  onChange={(e) =>
                    setListData({ ...listData, type: e.target.value })
                  }
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  <option value="day">Mua sắm hàng ngày</option>
                  <option value="week">Mua sắm hàng tuần</option>
                </select>
              </div>
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
            <h3
              style={{
                margin: "0 0 15px 0",
                fontSize: "1.2rem",
                fontWeight: "600",
              }}
            >
              {editingItemId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
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
                    Tên sản phẩm *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder={
                        isLoadingProducts
                          ? "Đang tải sản phẩm..."
                          : "Ví dụ: Cà chua"
                      }
                      value={currentItem.name}
                      onChange={(e) => handleProductNameChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        if (
                          currentItem.name.trim().length >= 2 &&
                          suggestions.length > 0
                        ) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow selection
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      disabled={isLoading}
                      style={{
                        width: "100%",
                        padding: "10px",
                        paddingRight: isLoadingProducts ? "35px" : "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    />

                    {/* Loading spinner inside input */}
                    {isLoadingProducts && (
                      <div
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "16px",
                          height: "16px",
                          border: "2px solid #f3f4f6",
                          borderTop: "2px solid #3b82f6",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                          zIndex: 1000,
                          maxHeight: "250px",
                          overflowY: "auto",
                        }}
                      >
                        {suggestions.map((product, index) => {
                          // Map category name từ backend sang frontend để lấy color
                          const getCategoryInfoFromName = (categoryName) => {
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

                            const categoryValue =
                              categoryMapping[categoryName] || "other";
                            return (
                              categories.find(
                                (cat) => cat.value === categoryValue
                              ) || categories[categories.length - 1]
                            );
                          };

                          const categoryInfo = getCategoryInfoFromName(
                            product.category_name
                          );

                          return (
                            <div
                              key={product.productID}
                              onClick={() => selectSuggestion(product)}
                              style={{
                                padding: "12px",
                                cursor: "pointer",
                                borderBottom:
                                  index < suggestions.length - 1
                                    ? "1px solid #f3f4f6"
                                    : "none",
                                background:
                                  selectedSuggestionIndex === index
                                    ? "#f8fafc"
                                    : "white",
                                transition: "background-color 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                              onMouseEnter={() =>
                                setSelectedSuggestionIndex(index)
                              }
                            >
                              {/* Product Image */}
                              <div
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  backgroundColor: "#f3f4f6",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.productName}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display =
                                        "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  style={{
                                    display: product.image ? "none" : "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                    height: "100%",
                                    fontSize: "20px",
                                    color: "#9ca3af",
                                  }}
                                >
                                  🛒
                                </div>
                              </div>

                              {/* Product Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "6px",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: "600",
                                      fontSize: "15px",
                                      color: "#111827",
                                      lineHeight: "1.3",
                                    }}
                                  >
                                    {product.productName}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#9ca3af",
                                      marginLeft: "8px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {product.unit || "cái"}
                                  </div>
                                </div>

                                {/* Category */}
                                <div style={{ marginBottom: "4px" }}>
                                  <span
                                    style={{
                                      background: categoryInfo.color + "15",
                                      color: categoryInfo.color,
                                      padding: "3px 8px",
                                      borderRadius: "12px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      border: `1px solid ${categoryInfo.color}30`,
                                    }}
                                  >
                                    📂{" "}
                                    {product.category_name ||
                                      categoryInfo.label}
                                  </span>
                                </div>

                                {/* Price */}
                                {product.estimatedPrice ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "#6b7280",
                                        fontWeight: "500",
                                      }}
                                    >
                                      Giá:
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "14px",
                                        fontWeight: "700",
                                        color: "#059669",
                                      }}
                                    >
                                      {product.estimatedPrice.toLocaleString()}đ
                                    </span>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#9ca3af",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    Chưa có giá
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Footer with total count */}
                        <div
                          style={{
                            padding: "8px 12px",
                            background: "#f8fafc",
                            borderTop: "1px solid #f3f4f6",
                            fontSize: "11px",
                            color: "#6b7280",
                            textAlign: "center",
                          }}
                        >
                          {suggestions.length} trong tổng số {products.length}{" "}
                          sản phẩm
                        </div>
                      </div>
                    )}

                    {/* No suggestions message */}
                    {showSuggestions &&
                      suggestions.length === 0 &&
                      currentItem.name.trim().length >= 2 &&
                      !isLoadingProducts && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "white",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            zIndex: 1000,
                            padding: "16px 12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#fef3c7",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "18px",
                                flexShrink: 0,
                              }}
                            >
                              🔍
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: "500",
                                  fontSize: "14px",
                                  color: "#111827",
                                  marginBottom: "2px",
                                }}
                              >
                                Không tìm thấy sản phẩm "{currentItem.name}"
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#6b7280" }}
                              >
                                Bạn vẫn có thể nhập tên sản phẩm tùy chỉnh và
                                tiếp tục thêm vào danh sách
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
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
                      Số lượng
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          quantity: parseFloat(e.target.value) || 1,
                        })
                      }
                      disabled={isLoading}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        opacity: isLoading ? 0.6 : 1,
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
                      value={currentItem.unit}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, unit: e.target.value })
                      }
                      disabled={isLoading}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        opacity: isLoading ? 0.6 : 1,
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
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "15px",
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
                    Danh mục
                  </label>
                  <select
                    value={currentItem.category}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        category: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      opacity: isLoading ? 0.6 : 1,
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
                    Độ ưu tiên
                  </label>
                  <select
                    value={currentItem.priority}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        priority: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
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
                    Giá ước tính (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Tùy chọn"
                    value={currentItem.estimatedPrice}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        estimatedPrice: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  />
                </div>
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
                  Ghi chú (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mua loại tươi, không quá chín"
                  value={currentItem.note}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, note: e.target.value })
                  }
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={addItem}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    background: isLoading ? "#9ca3af" : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "12px 16px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  ➕{" "}
                  {editingItemId ? "Cập nhật sản phẩm" : "Thêm vào danh sách"}
                </button>
                {editingItemId && (
                  <button
                    onClick={() => {
                      setEditingItemId(null);
                      setCurrentItem({
                        name: "",
                        quantity: 1,
                        unit: "kg",
                        category: "other",
                        note: "",
                        estimatedPrice: "",
                        priority: "medium",
                      });
                    }}
                    disabled={isLoading}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      padding: "12px 16px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {listData.items.length > 0 && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "20px",
                background: "white",
              }}
            >
              <h3
                style={{
                  margin: "0 0 15px 0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                }}
              >
                🛒 Danh sách sản phẩm ({listData.items.length} mặt hàng)
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {pendingItems.length > 0 && (
                  <div>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "14px",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Cần mua ({pendingItems.length})
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {pendingItems.map((item) => {
                        const categoryInfo = getCategoryInfo(item.category);
                        const priorityInfo = getPriorityInfo(item.priority);

                        return (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "15px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              background: "#fafafa",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={() => toggleItemCompleted(item.id)}
                              style={{
                                width: "16px",
                                height: "16px",
                                cursor: "pointer",
                              }}
                            />

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                  marginBottom: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: "500",
                                    fontSize: "15px",
                                  }}
                                >
                                  {item.name}
                                </span>
                                <span
                                  style={{
                                    background: "#f3f4f6",
                                    color: "#374151",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  {item.quantity} {item.unit}
                                </span>
                                <span
                                  style={{
                                    background: categoryInfo.color + "20",
                                    color: categoryInfo.color,
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {categoryInfo.label}
                                </span>
                                <span
                                  style={{
                                    background: priorityInfo.color + "20",
                                    color: priorityInfo.color,
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {priorityInfo.label}
                                </span>
                              </div>
                              {item.note && (
                                <p
                                  style={{
                                    margin: "4px 0",
                                    fontSize: "13px",
                                    color: "#6b7280",
                                  }}
                                >
                                  {item.note}
                                </p>
                              )}
                              {item.estimatedPrice > 0 && (
                                <p
                                  style={{
                                    margin: "4px 0",
                                    fontSize: "13px",
                                    color: "#059669",
                                    fontWeight: "500",
                                  }}
                                >
                                  ~
                                  {item.totalPrice
                                    ? item.totalPrice.toLocaleString()
                                    : (
                                        item.estimatedPrice * item.quantity
                                      ).toLocaleString()}
                                  đ
                                  {item.quantity > 1 && (
                                    <span
                                      style={{
                                        color: "#6b7280",
                                        fontSize: 12,
                                        marginLeft: 4,
                                      }}
                                    >
                                      ({item.estimatedPrice.toLocaleString()}đ x{" "}
                                      {item.quantity})
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: "5px" }}>
                              <button
                                onClick={() => editItem(item)}
                                disabled={isLoading}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: isLoading ? "not-allowed" : "pointer",
                                  padding: "6px",
                                  borderRadius: "4px",
                                  fontSize: "16px",
                                  color: isLoading ? "#9ca3af" : "#6b7280",
                                }}
                                title="Chỉnh sửa"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => removeItem(item.id)}
                                disabled={isLoading}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: isLoading ? "not-allowed" : "pointer",
                                  padding: "6px",
                                  borderRadius: "4px",
                                  fontSize: "16px",
                                  color: isLoading ? "#9ca3af" : "#ef4444",
                                }}
                                title="Xóa"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {completedItems.length > 0 && (
                  <div>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "14px",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Đã mua ({completedItems.length})
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {completedItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "15px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            background: "#f9fafb",
                            opacity: 0.6,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={() => toggleItemCompleted(item.id)}
                            style={{
                              width: "16px",
                              height: "16px",
                              cursor: "pointer",
                            }}
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexWrap: "wrap",
                                marginBottom: "4px",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: "500",
                                  fontSize: "15px",
                                  textDecoration: "line-through",
                                }}
                              >
                                {item.name}
                              </span>
                              <span
                                style={{
                                  background: "#f3f4f6",
                                  color: "#374151",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                            {item.estimatedPrice > 0 && (
                              <p
                                style={{
                                  margin: "4px 0",
                                  fontSize: "13px",
                                  color: "#059669",
                                  fontWeight: "500",
                                }}
                              >
                                ~
                                {item.totalPrice
                                  ? item.totalPrice.toLocaleString()
                                  : (
                                      item.estimatedPrice * item.quantity
                                    ).toLocaleString()}
                                đ
                                {item.quantity > 1 && (
                                  <span
                                    style={{
                                      color: "#6b7280",
                                      fontSize: 12,
                                      marginLeft: 4,
                                    }}
                                  >
                                    ({item.estimatedPrice.toLocaleString()}đ x{" "}
                                    {item.quantity})
                                  </span>
                                )}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={isLoading}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: isLoading ? "not-allowed" : "pointer",
                              padding: "6px",
                              borderRadius: "4px",
                              fontSize: "16px",
                              color: isLoading ? "#9ca3af" : "#ef4444",
                            }}
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "20px",
              background: "white",
              position: "sticky",
              top: "20px",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                fontSize: "1.1rem",
                fontWeight: "600",
              }}
            >
              Tổng quan danh sách
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  Tổng số mặt hàng:
                </span>
                <span
                  style={{
                    background: "#e5e7eb",
                    color: "#374151",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {listData.items.length}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  Đã mua:
                </span>
                <span
                  style={{
                    background: "#dcfce7",
                    color: "#059669",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {completedItems.length}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  Còn lại:
                </span>
                <span
                  style={{
                    background: "#fed7aa",
                    color: "#ea580c",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {pendingItems.length}
                </span>
              </div>

              {listData.totalEstimatedPrice > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "12px",
                    borderTop: "1px solid #e5e7eb",
                    marginTop: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    Tổng ước tính:
                  </span>
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#059669",
                    }}
                  >
                    {listData.totalEstimatedPrice.toLocaleString()}đ
                  </span>
                </div>
              )}
            </div>

            {listData.items.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Theo danh mục:
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {categories.map((category) => {
                    const count = listData.items.filter(
                      (item) => item.category === category.value
                    ).length;
                    if (count === 0) return null;
                    return (
                      <div
                        key={category.value}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            background: category.color + "20",
                            color: category.color,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {category.label}
                        </span>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {listData.items.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#9ca3af",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "10px" }}>🛒</div>
                <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
                  Chưa có sản phẩm nào
                </p>
                <p style={{ margin: 0, fontSize: "12px" }}>
                  Thêm sản phẩm đầu tiên vào danh sách
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddShoppingList;
