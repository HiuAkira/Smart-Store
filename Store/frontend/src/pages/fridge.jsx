import React, { useState, useEffect } from "react";
import api from "../config/api";
import { triggerNotificationRefreshWithDelay } from "../utils/notificationUtils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Fridge = () => {
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 4; // Show 4 cards per page
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
    "miếng",
    "bịch",
  ];
  const [fridgeItems, setFridgeItems] = useState([]);
  const [stats, setStats] = useState({
    total_products: 0,
    expired_products: 0,
    expiring_soon_products: 0,
    popular_categories: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cool");
  const [groupId, setGroupId] = useState(null);
  const [newItem, setNewItem] = useState({
    productName: "",
    productID: null,
    quantity: "",
    unit: "",
    categoryID: "",
    expiredDate: "",
    location: "cool",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTermProduct, setSearchTermProduct] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isFromCatalog, setIsFromCatalog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const navigate = useNavigate();
  const DEBUG = true;

  // Mapping danh mục
  const categoryInfo = {
    "Rau củ": { color: "#10b981", label: "Rau củ" },
    "Trái cây": { color: "#f59e0b", label: "Trái cây" },
    Thịt: { color: "#ef4444", label: "Thịt" },
    "Hải sản": { color: "#3b82f6", label: "Hải sản" },
    "Sữa và trứng": { color: "#eab308", label: "Sữa và trứng" },
    "Ngũ cốc": { color: "#f59e0b", label: "Ngũ cốc" },
    "Gia vị": { color: "#8b5cf6", label: "Gia vị" },
    "Thực phẩm đông lạnh": { color: "#06b6d4", label: "Thực phẩm đông lạnh" },
    Khác: { color: "#6b7280", label: "Khác" },
  };

  // Gom nhóm sản phẩm theo danh mục
  const groupedFridgeItems = fridgeItems.reduce((acc, item) => {
    const category = item.product_category_name || "Khác";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Hàm đề xuất cách bảo quản phù hợp
  function suggestStorage(item) {
    const name = (item.product_name || "").toLowerCase();
    const category = (item.product_category_name || "").toLowerCase();
    if (
      category.includes("thịt") ||
      category.includes("hải sản") ||
      name.includes("thịt") ||
      name.includes("cá") ||
      name.includes("tôm") ||
      name.includes("mực")
    ) {
      return "Nên để ngăn đông để bảo quản lâu hơn";
    }
    if (
      category.includes("rau") ||
      category.includes("trái cây") ||
      category.includes("sữa") ||
      name.includes("rau") ||
      name.includes("trứng") ||
      name.includes("sữa")
    ) {
      return "Nên để tủ lạnh để giữ tươi ngon";
    }
    if (
      category.includes("gia vị") ||
      category.includes("ngũ cốc") ||
      category.includes("khác")
    ) {
      return "Bảo quản nơi khô ráo, thoáng mát hoặc tủ lạnh nếu đã mở";
    }
    return "Nên để tủ lạnh";
  }

  const resetNewItemForm = () => {
    setNewItem({
      productName: "",
      productID: null,
      quantity: "",
      unit: "",
      categoryID: "",
      expiredDate: "",
      location: "cool",
    });
    setSearchTermProduct("");
    setSearchResults([]);
    setIsFromCatalog(false);
    setEditingItem(null);
  };

  const fetchFridgeList = async () => {
    try {
      setIsLoading(true);
      const params = groupId ? { group_id: groupId } : {};
      const response = await api.get("/api/fridge/", { params });
      const filteredItems = (response.data.items || []).filter(
        (item) => item.location === activeTab
      );
      setFridgeItems(filteredItems);
      setStats(
        response.data.stats || {
          total_products: 0,
          expired_products: 0,
          expiring_soon_products: 0,
          popular_categories: [],
        }
      );
    } catch (error) {
      console.error(
        "Không thể tải danh sách thực phẩm trong tủ lạnh. Thử lại sau"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async (page = 1) => {
    try {
      const params = { page, page_size: pageSize };
      if (groupId) params.group_id = groupId;
      const response = await api.get("/api/fridge/recommendation/", { params });
      setRecommendations(response.data.recommendations || []);
      setTotalPages(response.data.total_pages || 1);
      setCurrentPage(response.data.page || 1);
    } catch (error) {
      console.error("Không thể tải gợi ý công thức. Thử lại sau.");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Không thể tải danh mục. Vui lòng thử lại.");
    }
  };

  const handleSearchProduct = async (e) => {
    const term = e.target.value;
    setSearchTermProduct(term);
    setNewItem({
      ...newItem,
      productName: term,
      productID: null,
      unit: "",
      categoryID: "",
    });
    setIsFromCatalog(false);

    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await api.get("/api/products/search/", {
        params: { q: term },
      });
      setSearchResults(
        response.data.map((product) => ({
          productID: product.productID,
          productName: product.productName,
          unit: product.unit,
          categoryID: product.categoryID || "",
          categoryName: product.categoryName || "Không phân loại",
        }))
      );
    } catch (err) {
      setSearchResults([]);
    }
  };

  const handleSelectSuggestedProduct = (product) => {
    setNewItem({
      ...newItem,
      productName: product.productName,
      productID: product.productID,
      categoryID: product.categoryID || "",
      unit: product.unit,
    });
    setIsFromCatalog(true);
    setSearchTermProduct(product.productName);
    setSearchResults([]);
  };

  const handleAddNewProductManually = () => {
    setNewItem({
      ...newItem,
      productID: null,
      productName: searchTermProduct.trim(),
      unit: "",
      categoryID: "",
    });
    setIsFromCatalog(false);
    setSearchResults([]);
  };

  const handleAddItem = async () => {
    if (
      !newItem.productName ||
      !newItem.quantity ||
      !newItem.unit ||
      !newItem.categoryID ||
      !newItem.expiredDate ||
      !newItem.location
    ) {
      console.error(
        "Vui lòng điền đầy đủ thông tin sản phẩm (Tên, Số lượng, Đơn vị, Danh mục, Ngày hết hạn, Vị trí)."
      );
      return;
    }

    const payload = {
      quantity: Number(newItem.quantity),
      location: newItem.location,
      expiredDate: newItem.expiredDate,
      productName: newItem.productName,
      unit: newItem.unit,
      category_id: newItem.categoryID,
    };
    if (isFromCatalog && newItem.productID) {
      payload.product_id = newItem.productID;
    }

    try {
      const res = await api.post("/api/fridge/", payload);
      setIsModalOpen(false);
      resetNewItemForm();
      fetchFridgeList();
      fetchRecommendations(currentPage);
      triggerNotificationRefreshWithDelay();
    } catch (error) {
      console.error(
        "Lỗi khi thêm sản phẩm: " +
          (error.response ? JSON.stringify(error.response.data) : error.message)
      );
    }
  };

  const handleUpdateItem = async () => {
    if (
      !editingItem ||
      !newItem.quantity ||
      !newItem.expiredDate ||
      !newItem.location
    ) {
      console.error(
        "Vui lòng điền đầy đủ các trường bắt buộc (Số lượng, Ngày hết hạn, Vị trí) hoặc không có sản phẩm nào được chọn."
      );
      return;
    }

    const payload = {
      quantity: Number(newItem.quantity),
      expiredDate: newItem.expiredDate,
      location: newItem.location,
      category_id: newItem.categoryID,
    };

    try {
      const res = await api.patch(`/api/fridge/${editingItem.id}/`, payload);
      setIsModalOpen(false);
      resetNewItemForm();
      fetchFridgeList();
      fetchRecommendations(currentPage);
      triggerNotificationRefreshWithDelay();
    } catch (error) {
      console.error(
        "Lỗi khi cập nhật sản phẩm: " +
          (error.response ? JSON.stringify(error.response.data) : error.message)
      );
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    const formattedExpiredDate = item.expiredDate
      ? new Date(item.expiredDate).toISOString().split("T")[0]
      : "";
    setNewItem({
      productName: item.product_name,
      productID: item.product || null,
      quantity: item.quantity,
      unit: item.product_unit,
      categoryID: item.category_id || "",
      expiredDate: formattedExpiredDate,
      location: item.location,
    });
    setSearchTermProduct(item.product_name);
    setIsFromCatalog(!!item.product);
    setIsModalOpen(true);
  };

  const deleteItem = async (id) => {
    try {
      console.log("Deleting item with ID:", id);
      await api.delete(`/api/fridge/${id}/`);
      fetchFridgeList();
      fetchRecommendations(currentPage);
      triggerNotificationRefreshWithDelay();
    } catch (error) {
      console.error(
        error.response?.data?.detail || "Không thể xóa sản phẩm. Thử lại sau."
      );
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    const storedGroupId = localStorage.getItem("selectedGroup");
    if (storedGroupId) {
      setGroupId(storedGroupId);
    }
  }, []);

  useEffect(() => {
    if (groupId) {
      fetchCategories();
      fetchFridgeList();
      fetchRecommendations();
    }
  }, [groupId, activeTab]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {isLoading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Quản lý tủ lạnh</h1>
            <button
              onClick={() => {
                resetNewItemForm();
                setIsModalOpen(true);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              + Thêm sản phẩm mới
            </button>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">
                  {editingItem ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium text-sm text-gray-700 mb-1">
                      Tên sản phẩm
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên sản phẩm hoặc tìm trong catalog"
                      value={
                        editingItem ? newItem.productName : searchTermProduct
                      }
                      onChange={handleSearchProduct}
                      disabled={!!editingItem || isFromCatalog}
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {!editingItem &&
                      searchTermProduct.length > 0 &&
                      searchResults.length > 0 &&
                      !isFromCatalog && (
                        <ul className="border rounded mt-1 max-h-40 overflow-y-auto bg-white shadow z-10">
                          {searchResults.map((product) => (
                            <li
                              key={product.productID}
                              className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                              onClick={() =>
                                handleSelectSuggestedProduct(product)
                              }
                            >
                              {product.productName} — {product.unit} (
                              {product.categoryName || "Không phân loại"})
                            </li>
                          ))}
                          {searchTermProduct.length > 0 &&
                            !searchResults.some(
                              (p) =>
                                p.productName.toLowerCase() ===
                                searchTermProduct.toLowerCase()
                            ) && (
                              <li
                                className="p-2 hover:bg-green-100 cursor-pointer text-blue-500 border-t"
                                onClick={handleAddNewProductManually}
                              >
                                Thêm sản phẩm mới:{" "}
                                <strong>{searchTermProduct}</strong>
                              </li>
                            )}
                        </ul>
                      )}
                    {!editingItem &&
                      !isFromCatalog &&
                      searchTermProduct.length > 0 &&
                      searchResults.length === 0 && (
                        <div
                          className="p-2 hover:bg-green-100 cursor-pointer text-blue-500 border rounded mt-1 bg-white shadow z-10"
                          onClick={handleAddNewProductManually}
                        >
                          Thêm sản phẩm mới:{" "}
                          <strong>{searchTermProduct}</strong>
                        </div>
                      )}
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block font-medium text-sm text-gray-700 mb-1">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        min={1}
                        placeholder="Số lượng"
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem({ ...newItem, quantity: e.target.value })
                        }
                        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block font-medium text-sm text-gray-700 mb-1">
                        Đơn vị
                      </label>
                      <select
                        value={newItem.unit || ""}
                        onChange={(e) =>
                          setNewItem({ ...newItem, unit: e.target.value })
                        }
                        disabled={!!editingItem || isFromCatalog}
                        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Chọn đơn vị</option>
                        {units.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-sm text-gray-700 mb-1">
                      Danh mục
                    </label>
                    <select
                      value={newItem.categoryID || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, categoryID: e.target.value })
                      }
                      disabled={isFromCatalog}
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.categoryID} value={cat.categoryID}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-sm text-gray-700 mb-1">
                      Ngày hết hạn
                    </label>
                    <input
                      type="date"
                      value={newItem.expiredDate}
                      onChange={(e) =>
                        setNewItem({ ...newItem, expiredDate: e.target.value })
                      }
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-sm text-gray-700 mb-1">
                      Vị trí
                    </label>
                    <select
                      value={newItem.location}
                      onChange={(e) =>
                        setNewItem({ ...newItem, location: e.target.value })
                      }
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="cool">Tủ lạnh</option>
                      <option value="freeze">Ngăn đông</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetNewItemForm();
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={editingItem ? handleUpdateItem : handleAddItem}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    {editingItem ? "Lưu thay đổi" : "Thêm"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <p className="text-sm text-gray-500">Tổng sản phẩm</p>
              <p className="text-2xl font-semibold">{stats.total_products}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-sm text-gray-500">Sản phẩm sắp hết hạn</p>
              <p className="text-2xl font-semibold text-yellow-500">
                {stats.expiring_soon_products}
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-sm text-gray-500">Sản phẩm đã hết hạn</p>
              <p className="text-2xl font-semibold text-red-500">
                {stats.expired_products}
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-sm text-gray-500">Phân loại phổ biến</p>
              <p className="text-2xl font-semibold">
                {stats.popular_categories[0]?.categoryName || "Không có"}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gợi ý món ăn từ tủ lạnh</h2>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full ${
                      currentPage === 1
                        ? "bg-gray-200 cursor-not-allowed"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full ${
                      currentPage === totalPages
                        ? "bg-gray-200 cursor-not-allowed"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            {recommendations.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-300">
                {recommendations.map((recipe) => (
                  <div
                    key={recipe.recipeID}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
                  >
                    <img
                      src={recipe.image || "/images/default.jpg"}
                      alt={recipe.recipeName}
                      className="w-full h-40 object-cover rounded mb-3"
                      onError={(e) => {
                        e.target.src = "/images/default.jpg";
                      }}
                    />
                    <h3 className="text-lg font-semibold mb-1">
                      {recipe.recipeName}
                    </h3>
                    <p className="text-gray-500 text-sm mb-2">
                      Khớp: {recipe.match_percentage}% (
                      {recipe.matching_ingredients_count}/
                      {recipe.total_ingredients})
                    </p>
                    <button
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        setIsDetailsModalOpen(true);
                      }}
                      className="w-full text-sm text-center border border-gray-300 rounded py-1 hover:bg-gray-50"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <span className="text-5xl">👨‍🍳</span>
                <p className="mt-2">
                  Hãy thêm nhiều nguyên liệu hơn vào tủ lạnh để nhận gợi ý món
                  ăn
                </p>
              </div>
            )}
          </div>

          {isDetailsModalOpen && selectedRecipe && (
            <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl flex max-h-[90vh] overflow-y-auto">
                <div className="w-1/2">
                  <img
                    src={selectedRecipe.image || "/images/default.jpg"}
                    alt={selectedRecipe.recipeName}
                    className="w-full h-[500px] object-cover rounded"
                    onError={(e) => {
                      e.target.src = "/images/default.jpg";
                    }}
                  />
                </div>
                <div className="w-1/2 pl-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-semibold">
                      {selectedRecipe.recipeName}
                    </h2>
                  </div>
                  <p className="text-gray-600 mt-3 text-lg">
                    {selectedRecipe.description || "Không có mô tả"}
                  </p>
                  <h3 className="text-xl font-semibold mt-6">Nguyên liệu</h3>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {selectedRecipe.ingredient_set.map((ing) => {
                      // Check if the ingredient matches any item in fridgeItems
                      const isMatching = fridgeItems.some(
                        (item) =>
                          item.product_id === ing.product.productID ||
                          item.product_name.toLowerCase() ===
                            ing.product.productName.toLowerCase()
                      );
                      return (
                        <span
                          key={ing.product.productID}
                          className={`px-3 py-1 rounded text-base ${
                            isMatching
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {ing.product.productName}
                        </span>
                      );
                    })}
                  </div>
                  <h3 className="text-xl font-semibold mt-6">Hướng dẫn</h3>
                  <p className="text-gray-600 mt-3 text-lg whitespace-pre-line">
                    {selectedRecipe.instruction || "Không có hướng dẫn"}
                  </p>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="mt-6 bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-lg"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              className={`px-3 py-1 rounded ${
                activeTab === "cool"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
              onClick={() => setActiveTab("cool")}
            >
              Tủ lạnh
            </button>
            <button
              className={`px-3 py-1 rounded ${
                activeTab === "freeze"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
              onClick={() => setActiveTab("freeze")}
            >
              Ngăn đông
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên thực phẩm..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border rounded px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="border rounded px-3 py-2 w-full md:w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Tất cả danh mục</option>
              {Object.keys(groupedFridgeItems).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* --- PHÂN LOẠI THEO DANH MỤC --- */}
          {Object.keys(groupedFridgeItems).length > 0 ? (
            Object.entries(groupedFridgeItems)
              .filter(
                ([category]) => !searchCategory || category === searchCategory
              )
              .map(([category, items]) => {
                const info = categoryInfo[category] || categoryInfo["Khác"];
                return (
                  <div key={category} className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        style={{ background: info.color }}
                        className="w-4 h-4 rounded-full inline-block"
                      ></span>
                      <span className="font-semibold">{info.label}</span>
                      <span className="bg-gray-100 px-2 rounded text-xs">
                        {items.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`bg-white border p-4 rounded shadow relative ${
                            item.expiredDate &&
                            new Date(item.expiredDate) < new Date()
                              ? "border-red-300"
                              : item.isExpiringSoon
                              ? "border-yellow-300"
                              : "border-gray-200"
                          }`}
                        >
                          <h3 className="text-lg font-semibold">
                            {item.product_name || "Sản phẩm"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {item.quantity} {item.product_unit}
                          </p>
                          <p className="text-sm mt-2 font-medium">
                            Ngày hết hạn:{" "}
                            {new Date(item.expiredDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </p>
                          <p className="text-sm mt-1 font-medium">
                            {item.expiredDate &&
                            new Date(item.expiredDate) < new Date() ? (
                              <span className="text-red-500">
                                ⚠ Đã hết hạn!
                              </span>
                            ) : item.isExpiringSoon ? (
                              <span className="text-yellow-500">
                                ⚠ Sắp hết hạn!
                              </span>
                            ) : (
                              <span className="text-green-500">Còn hạn</span>
                            )}
                          </p>
                          <p className="text-sm mt-1 font-medium">
                            Danh mục:{" "}
                            {item.product_category_name || "Không phân loại"}
                          </p>
                          <p className="text-xs text-blue-600 mt-1 italic">
                            {suggestStorage(item)}
                          </p>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Separator giữa các danh mục */}
                    <div className="h-px bg-gray-200 my-6" />
                  </div>
                );
              })
          ) : (
            <p className="text-gray-500">
              Không có thực phẩm trong{" "}
              {activeTab === "cool" ? "tủ lạnh" : "ngăn đông"}.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default Fridge;
