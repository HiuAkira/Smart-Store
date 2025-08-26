// Store.jsx - đã cập nhật thêm 2 nút + routing + responsive cho admin

import React, { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, Eye, Edit, Trash2, List } from "lucide-react";
import api from "../config/api";
import { Link, useNavigate } from "react-router-dom";

const Store = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user && user.role === "admin";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  // New states for shopping list modal
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [shoppingLists, setShoppingLists] = useState([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState(null);
  const [loadingShoppingLists, setLoadingShoppingLists] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [sortOption, setSortOption] = useState("default");
  const [popularProducts, setPopularProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;

  const searchTimeout = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let productRes, categoryRes;
        if (search.length >= 2) {
          setSearchLoading(true);
          productRes = await api.get("/api/products/search/", {
            params: { q: search },
          });
          categoryRes = await api.get("/api/categories/");
          setProducts(productRes.data);
          setCategories(categoryRes.data);
          setSearchLoading(false);
        } else {
          [productRes, categoryRes] = await Promise.all([
            api.get("/api/products/"),
            api.get("/api/categories/"),
          ]);
          setProducts(productRes.data);
          setCategories(categoryRes.data);
        }
      } catch {
        alert("Có lỗi xảy ra khi tải dữ liệu!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [search]);

  // New function to fetch shopping lists
  const fetchShoppingLists = async () => {
    try {
      setLoadingShoppingLists(true);
      const groupId = localStorage.getItem("selectedGroup");
      const response = await api.get("/api/shopping-lists/", {
        params: { group_id: groupId },
      });
      setShoppingLists(response.data);
    } catch {
      alert("Có lỗi xảy ra khi tải danh sách mua sắm!");
    } finally {
      setLoadingShoppingLists(false);
    }
  };

  // Modified handleAddToCart function
  const handleAddToCart = async (product) => {
    setSelectedProductToAdd(product);
    setQuantity(1);
    setShowShoppingListModal(true);
    await fetchShoppingLists();
  };

  // New function to add product to shopping list
  const handleAddToShoppingList = async (listId) => {
    const productId = selectedProductToAdd.productID;
    setAddingToCart((prev) => ({ ...prev, [productId]: true }));

    try {
      const groupId = localStorage.getItem("selectedGroup");
      await api.post(`/api/shopping-lists/${listId}/items/`, {
        product: productId,
        quantity: quantity,
        group_id: groupId,
      });
      alert(
        `Đã thêm ${selectedProductToAdd.productName} vào danh sách mua sắm thành công!`
      );
      setShowShoppingListModal(false);
      setSelectedProductToAdd(null);
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("unique")
      ) {
        alert("Sản phẩm này đã có trong danh sách mua sắm!");
      } else {
        alert("Có lỗi xảy ra khi thêm vào danh sách mua sắm!");
      }
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Close shopping list modal
  const closeShoppingListModal = () => {
    setShowShoppingListModal(false);
    setSelectedProductToAdd(null);
    setQuantity(1);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    setDeletingProduct(productId);
    try {
      await api.delete(`/api/products/${productId}/`);
      setProducts(products.filter((p) => p.productID !== productId));
      alert("Đã xóa sản phẩm thành công!");
    } catch {
      alert("Có lỗi xảy ra khi xóa sản phẩm!");
    } finally {
      setDeletingProduct(null);
    }
  };

  const closeProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  // Hàm lấy sản phẩm phổ biến
  const fetchPopularProducts = async () => {
    try {
      const groupId = localStorage.getItem("selectedGroup");
      const response = await api.get("/api/shopping-lists/", {
        params: { group_id: groupId },
      });
      if (response.data && Array.isArray(response.data)) {
        const productFrequency = {};
        const detailPromises = response.data.slice(0, 10).map(async (list) => {
          try {
            const detailResponse = await api.get(
              `/api/shopping-lists/${list.listID}/`
            );
            return detailResponse.data.items || [];
          } catch {
            return [];
          }
        });
        const allItemsArrays = await Promise.all(detailPromises);
        const allItems = allItemsArrays.flat();
        allItems.forEach((item) => {
          const productId = item.product_details?.productID || item.productID;
          if (productId) {
            productFrequency[productId] =
              (productFrequency[productId] || 0) + 1;
          }
        });
        const topProductIDs = Object.entries(productFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([productID]) => Number(productID));
        setPopularProducts(topProductIDs);
      }
    } catch {
      setPopularProducts([]);
    }
  };

  useEffect(() => {
    if (filterTab === "popular") {
      fetchPopularProducts();
    }
  }, [filterTab]);

  let sortedProducts = [...products].filter(
    (p) => !selectedCategory || p.categoryID === Number(selectedCategory)
  );

  if (filterTab === "popular") {
    sortedProducts = sortedProducts
      .filter((p) => popularProducts.includes(p.productID))
      .sort(
        (a, b) =>
          popularProducts.indexOf(a.productID) -
          popularProducts.indexOf(b.productID)
      );
  } else if (filterTab === "discount") {
    sortedProducts = sortedProducts.filter((p) => p.discount > 0);
  }

  if (sortOption === "price-asc") {
    sortedProducts.sort(
      (a, b) => (a.price || a.original_price) - (b.price || b.original_price)
    );
  } else if (sortOption === "price-desc") {
    sortedProducts.sort(
      (a, b) => (b.price || b.original_price) - (a.price || a.original_price)
    );
  } else if (sortOption === "name-asc") {
    sortedProducts.sort((a, b) => a.productName.localeCompare(b.productName));
  } else if (sortOption === "name-desc") {
    sortedProducts.sort((a, b) => b.productName.localeCompare(a.productName));
  } else if (sortOption === "newest") {
    sortedProducts.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  } else if (sortOption === "oldest") {
    sortedProducts.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
  }

  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, filterTab, sortOption]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-bold">Cửa hàng thực phẩm</h1>

        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <Link
              to="/add-product"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
            >
              <Plus size={16} /> Thêm sản phẩm
            </Link>
            <Link
              to="/add-category"
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm"
            >
              <Plus size={16} /> Thêm danh mục
            </Link>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <input
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(() => {
              setSearch(value);
            }, 400);
          }}
          className="flex-1 px-4 py-2 border rounded"
          placeholder="Tìm kiếm sản phẩm..."
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border px-4 py-2 rounded w-full md:w-auto"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.categoryID} value={cat.categoryID}>
              {cat.categoryName}
            </option>
          ))}
        </select>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border px-4 py-2 rounded w-full md:w-auto"
        >
          <option value="default">Sắp xếp mặc định</option>
          <option value="price-asc">Giá tăng dần</option>
          <option value="price-desc">Giá giảm dần</option>
          <option value="name-asc">Tên A-Z</option>
          <option value="name-desc">Tên Z-A</option>
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
        </select>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "all", label: "Tất cả sản phẩm" },
          { key: "popular", label: "Phổ biến" },
          { key: "discount", label: "Khuyến mãi" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-1 rounded-full font-medium text-sm ${
              filterTab === tab.key
                ? "bg-gray-900 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setFilterTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {searchLoading ? (
        <p>Đang tìm kiếm sản phẩm...</p>
      ) : loading ? (
        <p>Đang tải sản phẩm...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProducts.map((product) => {
            const hasDiscount = product.discount > 0;
            const discountPercentage = hasDiscount
              ? Math.round(product.discount)
              : 0;

            return (
              <div
                key={product.productID}
                className="bg-white rounded-lg shadow relative p-4"
              >
                {hasDiscount && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Giảm {discountPercentage}%
                  </div>
                )}

                <div className="h-40 bg-gray-100 mb-3 flex items-center justify-center overflow-hidden">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.productName}
                      className="object-contain h-full"
                    />
                  )}
                </div>

                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {product.category_name}
                  </span>
                  <span className="flex items-center gap-1">
                    ⭐ {product.rating || 4.5}
                  </span>
                </div>

                <h2 className="text-lg font-semibold mb-1">
                  {product.productName}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  {product.description}
                </p>

                <div className="mb-2">
                  {hasDiscount ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-600">
                          {Number(product.price).toLocaleString()}đ
                        </span>
                        <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                          -{discountPercentage}%
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm line-through text-gray-400">
                          Giá gốc:{" "}
                          {Number(product.original_price).toLocaleString()}đ
                        </span>
                        {/* <span className="text-sm text-gray-500">
                          /{product.unit}
                        </span> */}
                      </div>
                      {product.discount_amount && (
                        <p className="text-xs text-green-600">
                          Tiết kiệm:{" "}
                          {Number(product.discount_amount).toLocaleString()}đ
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {Number(
                          product.price || product.original_price
                        ).toLocaleString()}
                        đ
                      </span>
                      {/* <span className="text-sm text-gray-500">
                        /{product.unit}
                      </span> */}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart[product.productID]}
                  >
                    <ShoppingCart size={16} />
                    {addingToCart[product.productID]
                      ? "Đang thêm..."
                      : "Thêm vào danh sách"}
                  </button>

                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
                    onClick={() => handleViewProduct(product)}
                    title="Xem chi tiết"
                  >
                    <Eye size={16} />
                  </button>

                  {isAdmin && (
                    <>
                      <Link
                        to={`/edit-product/${product.productID}`}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded flex items-center justify-center"
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </Link>

                      <button
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded disabled:opacity-50"
                        onClick={() => handleDeleteProduct(product.productID)}
                        disabled={deletingProduct === product.productID}
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedProduct.productName}
                </h2>
                <button
                  onClick={closeProductDetail}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Product Image */}
              <div className="mb-6">
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedProduct.image ? (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.productName}
                      className="object-contain h-full w-full"
                    />
                  ) : (
                    <div className="text-gray-400 text-6xl">📦</div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Thông tin sản phẩm
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600">Tên sản phẩm:</span>
                      <p className="font-medium">
                        {selectedProduct.productName}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-600">Danh mục:</span>
                      <p className="font-medium">
                        {selectedProduct.category_name || "Chưa phân loại"}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-600">Đơn vị:</span>
                      <p className="font-medium">{selectedProduct.unit}</p>
                    </div>

                    <div>
                      <span className="text-gray-600">Hạn sử dụng:</span>
                      <p className="font-medium">
                        {selectedProduct.shelfLife} ngày
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-600">Loại sản phẩm:</span>
                      <p className="font-medium">
                        {selectedProduct.isCustom
                          ? "Sản phẩm tùy chỉnh"
                          : "Sản phẩm hệ thống"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Giá cả</h3>

                  <div className="space-y-3">
                    {selectedProduct.discount > 0 ? (
                      <>
                        <div>
                          <span className="text-gray-600">Giá hiện tại:</span>
                          <p className="text-2xl font-bold text-red-600">
                            {Number(selectedProduct.price).toLocaleString()}đ
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-600">Giá gốc:</span>
                          <p className="text-lg line-through text-gray-400">
                            {Number(
                              selectedProduct.original_price
                            ).toLocaleString()}
                            đ
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-600">Giảm giá:</span>
                          <p className="text-lg font-semibold text-green-600">
                            {Math.round(selectedProduct.discount)}% (
                            {Number(
                              selectedProduct.discount_amount || 0
                            ).toLocaleString()}
                            đ)
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <span className="text-gray-600">Giá:</span>
                        <p className="text-2xl font-bold text-gray-900">
                          {Number(
                            selectedProduct.price ||
                              selectedProduct.original_price
                          ).toLocaleString()}
                          đ
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">Mô tả</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                  }}
                  disabled={addingToCart[selectedProduct.productID]}
                >
                  <ShoppingCart size={20} />
                  {addingToCart[selectedProduct.productID]
                    ? "Đang thêm..."
                    : "Thêm vào danh sách"}
                </button>

                {isAdmin && (
                  <>
                    <Link
                      to={`/edit-product/${selectedProduct.productID}`}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium"
                      onClick={closeProductDetail}
                    >
                      <Edit size={20} />
                      Chỉnh sửa
                    </Link>

                    <button
                      className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium"
                      onClick={() => {
                        handleDeleteProduct(selectedProduct.productID);
                        closeProductDetail();
                      }}
                      disabled={deletingProduct === selectedProduct.productID}
                    >
                      <Trash2 size={20} />
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping List Modal */}
      {showShoppingListModal && selectedProductToAdd && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">
                  Thêm vào danh sách mua sắm
                </h2>
                <button
                  onClick={closeShoppingListModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Selected Product Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                    {selectedProductToAdd.image ? (
                      <img
                        src={selectedProductToAdd.image}
                        alt={selectedProductToAdd.productName}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <span className="text-gray-400">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {selectedProductToAdd.productName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {Number(
                        selectedProductToAdd.price ||
                          selectedProductToAdd.original_price
                      ).toLocaleString()}
                      đ
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600 ml-2">
                    {selectedProductToAdd.unit}
                  </span>
                </div>
              </div>

              {/* Shopping Lists */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Chọn danh sách mua sắm
                </h3>

                {loadingShoppingLists ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-600 mt-2">
                      Đang tải danh sách...
                    </p>
                  </div>
                ) : shoppingLists.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-4xl mb-2">📝</div>
                    <p className="text-sm text-gray-600 mb-3">
                      Bạn chưa có danh sách mua sắm nào
                    </p>
                    <button
                      onClick={() => {
                        closeShoppingListModal();
                        navigate("/add-shopping-list");
                      }}
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      Tạo danh sách mới
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {shoppingLists.map((list) => (
                      <div
                        key={list.listID}
                        onClick={() => handleAddToShoppingList(list.listID)}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {list.listName}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(list.date).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <div className="flex items-center text-gray-400">
                            <List size={16} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create New List Button */}
              {shoppingLists.length > 0 && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => {
                      closeShoppingListModal();
                      navigate("/add-shopping-list");
                    }}
                    className="w-full py-2 text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    + Tạo danh sách mua sắm mới
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Store;
