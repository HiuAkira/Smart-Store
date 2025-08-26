import React, { useState, useEffect } from "react";
import { Save, Upload, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import api from "../config/api";

const Recipes = () => {
  const location = useLocation();
  const [recipes, setRecipes] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    recipeName: "",
    description: "",
    instruction: "",
    ingredients: [],
    image: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [mainSearchTerm, setMainSearchTerm] = useState("");
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Lấy user từ localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  // Khôi phục dữ liệu form và thêm nguyên liệu mới nếu quay lại từ trang Thêm sản phẩm (AddProduct)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newProductID = params.get("newProductID");
    const savedFormData = localStorage.getItem("recipeFormData");

    if (newProductID) {
      // Lấy ra các nguyên liệu mới tạo
      const fetchNewProduct = async () => {
        try {
          const response = await api.get(`/api/products/${newProductID}/`);
          const product = response.data;
          setFormData((prev) => ({
            ...prev,
            ingredients: [
              ...prev.ingredients,
              {
                productID: product.productID,
                productName: product.productName,
                unit: product.unit,
              },
            ],
          }));
          setIsAddModalOpen(true);
          // Clean up query params
          window.history.replaceState({}, document.title, location.pathname);
        } catch (err) {
          console.error("Error fetching new product:", err);
          setMessage("Lỗi khi tải thông tin nguyên liệu mới");
        }
      };
      fetchNewProduct();
    }

    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      setFormData({
        recipeName: parsedData.recipeName,
        description: parsedData.description,
        instruction: parsedData.instruction,
        ingredients: parsedData.ingredients,
        image: null,
      });
      setImagePreview(parsedData.imagePreview || "");
      setIsAddModalOpen(true);
      setIsEditMode(parsedData.isEditMode || false);
      localStorage.removeItem("recipeFormData");
    }
  }, [location]);

  // Fetch recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/recipes/");
        console.log("Recipes API response:", response.data);
        const fetchedRecipes = response.data.map((recipe) => ({
          id: recipe.recipeID,
          title: recipe.recipeName,
          description: recipe.description,
          instructions: recipe.instruction,
          image: recipe.image || "/images/default.jpg",
          ingredients: recipe.ingredient_set,
        }));
        setRecipes(fetchedRecipes);
        setFilteredRecipes(fetchedRecipes);
      } catch (err) {
        setMessage("Lỗi khi lấy thực đơn");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  // Lấy danh sách công thức yêu thích khi load trang
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await api.get("/api/favorite-recipes/");
        if (res.data && res.data.success) {
          setFavoriteIds(res.data.favorite_recipes || []);
        }
      } catch {
        // Có thể bỏ qua lỗi nếu chưa đăng nhập
      }
    };
    fetchFavorites();
  }, []);

  // Handle main search
  const handleMainSearch = (e) => {
    const term = e.target.value;
    setMainSearchTerm(term);
    if (term.trim() === "") {
      setFilteredRecipes(recipes);
      return;
    }
    const lowerCaseTerm = term.toLowerCase();
    const filtered = recipes.filter((recipe) => {
      const matchesRecipeName = recipe.title
        .toLowerCase()
        .includes(lowerCaseTerm);
      const matchesIngredients = recipe.ingredients.some((ing) =>
        ing.productName.toLowerCase().includes(lowerCaseTerm)
      );
      return matchesRecipeName || matchesIngredients;
    });
    setFilteredRecipes(filtered);
  };

  // Handle search cho catalog ingredients
  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length < 1) {
      setFilteredIngredients([]);
      return;
    }
    try {
      // Gọi đúng endpoint search, lấy thêm image, unit, price, categoryName
      const response = await api.get("/api/products/search/", {
        params: { q: term },
      });
      setFilteredIngredients(
        response.data.slice(0, 15).map((product) => ({
          productID: product.productID,
          productName: product.productName,
          image: product.image,
          unit: product.unit,
          price: product.price,
          categoryName: product.category_name || product.categoryName || "",
        }))
      );
    } catch {
      setFilteredIngredients([]);
    }
  };

  // Select catalog ingredient
  const handleSelectIngredient = (ingredient) => {
    if (
      !formData.ingredients.some(
        (ing) => ing.productID === ingredient.productID
      )
    ) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [
          ...prev.ingredients,
          {
            productID: ingredient.productID,
            productName: ingredient.productName,
            unit: ingredient.unit,
          },
        ],
      }));
    }
    setSearchTerm("");
    setFilteredIngredients([]);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Remove image
  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview("");
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      recipeName: "",
      description: "",
      instruction: "",
      ingredients: [],
      image: null,
    });
    setImagePreview("");
    setSearchTerm("");
    setFilteredIngredients([]);
    setMessage("");
  };

  // Handle edit
  const handleEdit = () => {
    if (!isAdmin) return;
    setFormData({
      recipeName: selectedRecipe.title,
      description: selectedRecipe.description,
      instruction: selectedRecipe.instructions,
      ingredients: Array.isArray(selectedRecipe.ingredients)
        ? selectedRecipe.ingredients.map((ing) => ({
            productID: ing.product?.productID || ing.productID,
            productName: ing.product?.productName || ing.productName || "",
            unit: ing.product?.unit || ing.unit || "",
          }))
        : [],
      image: null,
    });
    setImagePreview(selectedRecipe.image);
    setIsEditMode(true);
    setIsDetailsModalOpen(false);
    setIsAddModalOpen(true);

    console.log("selectedRecipe.ingredients", selectedRecipe.ingredients);
    selectedRecipe.ingredients.forEach((ing, idx) => {
      console.log(
        `Ingredient ${idx}:`,
        ing,
        "product:",
        ing.product,
        "productName:",
        ing.productName
      );
    });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!isAdmin) return;
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa công thức "${selectedRecipe.title}"?`
      )
    )
      return;
    try {
      await api.delete(`/api/recipes/${selectedRecipe.id}/`);
      setRecipes(recipes.filter((recipe) => recipe.id !== selectedRecipe.id));
      setFilteredRecipes(
        filteredRecipes.filter((recipe) => recipe.id !== selectedRecipe.id)
      );
      setIsDetailsModalOpen(false);
      setMessage("Xóa công thức thành công");
    } catch (err) {
      setMessage("Lỗi khi xóa công thức");
      console.error(err);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (
      !formData.recipeName ||
      !formData.description ||
      !formData.instruction
    ) {
      setMessage("Vui lòng điền đầy đủ tên món ăn, mô tả và hướng dẫn.");
      return;
    }
    setLoading(true);
    setMessage("");

    const formDataToSend = new FormData();
    formDataToSend.append("recipeName", formData.recipeName);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("instruction", formData.instruction);
    formDataToSend.append("isCustom", false); // Always false since only admins add recipes
    if (formData.image) {
      formDataToSend.append("image_upload", formData.image);
    }
    formData.ingredients.forEach((item, index) => {
      if (item.productID) {
        formDataToSend.append(
          `ingredients[${index}]`,
          parseInt(item.productID, 10)
        );
      }
    });

    try {
      let response;
      if (isEditMode && selectedRecipe) {
        response = await api.put(
          `/api/recipes/${selectedRecipe.id}/`,
          formDataToSend
        );
        setMessage("Cập nhật công thức thành công");
        setRecipes((prev) =>
          prev.map((recipe) =>
            recipe.id === selectedRecipe.id
              ? {
                  ...recipe,
                  title: formData.recipeName,
                  description: formData.description,
                  instructions: formData.instruction,
                  ingredients: formData.ingredients,
                  image: response.data.image || recipe.image,
                }
              : recipe
          )
        );
        setFilteredRecipes((prev) =>
          prev.map((recipe) =>
            recipe.id === selectedRecipe.id
              ? {
                  ...recipe,
                  title: formData.recipeName,
                  description: formData.description,
                  instructions: formData.instruction,
                  ingredients: formData.ingredients,
                  image: response.data.image || recipe.image,
                }
              : recipe
          )
        );
      } else {
        response = await api.post("/api/recipes/", formDataToSend);
        setMessage("Thêm công thức thành công");
        const newRecipe = {
          id: response.data.recipeID,
          title: formData.recipeName,
          description: formData.description,
          instructions: formData.instruction,
          image: response.data.image || "/images/default.jpg",
          tags: formData.recipeName.split(" ").slice(0, 3),
          liked: false,
          ingredients: formData.ingredients,
        };
        setRecipes((prev) => [...prev, newRecipe]);
        setFilteredRecipes((prev) => [...prev, newRecipe]);
      }
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data, null, 2) ||
        "Unknown error";
      setMessage(`Có lỗi xảy ra khi lưu công thức: ${errorMessage}`);
      if (err.response?.data?.ingredients) {
        console.error(
          "Error response ingredients:",
          err.response.data.ingredients
        );
      }
      console.error("Error response:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Save form state before navigating to AddProduct
  const handleAddNewIngredient = () => {
    localStorage.setItem(
      "recipeFormData",
      JSON.stringify({
        recipeName: formData.recipeName,
        description: formData.description,
        instruction: formData.instruction,
        ingredients: formData.ingredients,
        imagePreview: imagePreview,
        isEditMode: isEditMode,
      })
    );
    window.location.href = "/add-product";
  };

  // Toggle favorite
  const toggleFavorite = async (recipeId) => {
    try {
      if (favoriteIds.includes(recipeId)) {
        await api.delete("/api/favorite-recipes/", {
          data: { recipe_id: recipeId },
        });
        setFavoriteIds(favoriteIds.filter((id) => id !== recipeId));
      } else {
        await api.post("/api/favorite-recipes/", { recipe_id: recipeId });
        setFavoriteIds([...favoriteIds, recipeId]);
      }
    } catch {
      // Không làm gì
    }
  };

  // Thêm log trước khi render nguyên liệu trong form
  console.log("formData.ingredients", formData.ingredients);

  return (
    <div className="space-y-3 max-w-6xl mx-auto p-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-3xl font-bold text-gray-900">Công thức nấu ăn</h1>
      </div>

      <div className="flex justify-end gap-2 mb-4">
        {isAdmin && (
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setIsEditMode(false);
              resetForm();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm rounded-lg"
          >
            Thêm công thức
          </button>
        )}
        <button
          onClick={() => (window.location.href = "/fridge")}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm rounded-lg"
        >
          Gợi ý từ tủ lạnh
        </button>
        <button
          onClick={() => setShowFavoritesOnly((prev) => !prev)}
          className={
            (showFavoritesOnly
              ? "bg-pink-500 hover:bg-pink-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800") +
            " px-4 py-2 text-sm rounded-lg"
          }
        >
          {showFavoritesOnly ? "Hiện tất cả" : "Xem công thức yêu thích"}
        </button>
      </div>

      <input
        type="text"
        placeholder="Tìm kiếm công thức hoặc nguyên liệu..."
        value={mainSearchTerm}
        onChange={handleMainSearch}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {message && (
        <p
          className={`text-sm text-center ${
            message.includes("thành công") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
              <span className="text-blue-500 text-lg">
                Đang tải công thức...
              </span>
            </div>
          </div>
        ) : (showFavoritesOnly
            ? filteredRecipes.filter((r) => favoriteIds.includes(r.id))
            : filteredRecipes
          ).length > 0 ? (
          (showFavoritesOnly
            ? filteredRecipes.filter((r) => favoriteIds.includes(r.id))
            : filteredRecipes
          ).map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
            >
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-40 object-cover rounded mb-3"
                onError={(e) => {
                  e.target.src = "/images/default.jpg";
                }}
              />
              <h2 className="text-xl font-semibold mb-1">{recipe.title}</h2>
              <p className="text-gray-500 text-sm mb-2">{recipe.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => toggleFavorite(recipe.id)}
                  className={
                    `text-2xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-pink-400 ` +
                    (favoriteIds.includes(recipe.id)
                      ? "text-pink-600 drop-shadow-lg scale-125"
                      : "text-gray-400 hover:text-pink-400 hover:scale-110")
                  }
                  title={
                    favoriteIds.includes(recipe.id)
                      ? "Bỏ khỏi yêu thích"
                      : "Thêm vào yêu thích"
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    boxShadow: "none",
                  }}
                  aria-label={
                    favoriteIds.includes(recipe.id)
                      ? "Bỏ khỏi yêu thích"
                      : "Thêm vào yêu thích"
                  }
                >
                  {favoriteIds.includes(recipe.id) ? "♥" : "♡"}
                </button>
                <button
                  onClick={() => {
                    setSelectedRecipe(recipe);
                    setIsDetailsModalOpen(true);
                  }}
                  className="flex-1 text-sm text-center border border-gray-300 rounded py-1 hover:bg-gray-50"
                >
                  Xem chi tiết
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        setIsEditMode(true);
                        setFormData({
                          ingredients: recipe.ingredients.map((ing) => ({
                            productID: ing.product?.productID || ing.productID,
                            productName:
                              ing.product?.productName || ing.productName || "",
                            unit: ing.product?.unit || ing.unit || "",
                          })),
                        });
                        setImagePreview(recipe.image);
                        setIsAddModalOpen(true);
                      }}
                      className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        handleDelete();
                      }}
                      className="ml-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center col-span-full">
            Không tìm thấy công thức phù hợp.
          </p>
        )}
      </div>

      {/* Add/Edit Recipe Modal */}
      {isAddModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {isEditMode ? "Cập nhật công thức" : "Thêm công thức mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên món ăn *
                </label>
                <input
                  type="text"
                  name="recipeName"
                  value={formData.recipeName}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hướng dẫn *
                </label>
                <textarea
                  name="instruction"
                  value={formData.instruction}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nguyên liệu
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm nguyên liệu..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto border rounded bg-white shadow-lg z-50">
                      {filteredIngredients.length > 0 ? (
                        filteredIngredients.map((ingredient) => (
                          <div
                            key={ingredient.productID}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            onClick={() => handleSelectIngredient(ingredient)}
                          >
                            <div className="w-10 h-10 flex-shrink-0">
                              <img
                                src={ingredient.image || "/images/default.jpg"}
                                alt={ingredient.productName}
                                className="w-full h-full object-cover rounded border"
                                onError={(e) => {
                                  e.target.src = "/images/default.jpg";
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {ingredient.productName}
                              </h4>
                              <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                {ingredient.unit && (
                                  <span>Đơn vị: {ingredient.unit}</span>
                                )}
                                {ingredient.categoryName && (
                                  <span>
                                    Danh mục: {ingredient.categoryName}
                                  </span>
                                )}
                              </div>
                              {ingredient.price && (
                                <p className="text-xs text-green-600 mt-1">
                                  Giá:{" "}
                                  {ingredient.price.toLocaleString("vi-VN")}đ
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-gray-500 text-center">
                          <p>Không tìm thấy nguyên liệu</p>
                          <Link
                            to="/add-product"
                            onClick={handleAddNewIngredient}
                            className="mt-2 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm"
                          >
                            Thêm nguyên liệu mới
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.ingredients.map((ing, index) => (
                    <span
                      key={ing.productID || index}
                      className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm"
                    >
                      {ing.productName && ing.productName !== ""
                        ? ing.productName
                        : "Không rõ"}
                      <button
                        type="button"
                        className="ml-1 text-red-500 hover:text-red-700"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            ingredients: prev.ingredients.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }}
                      >
                        <X className="h-3 w-3 inline-block" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                />
                {imagePreview && (
                  <div className="relative w-full max-w-[200px] mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        e.target.src = "/images/default.jpg";
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1.5 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {loading ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedRecipe && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl flex max-h-[90vh] overflow-y-auto">
            <div className="w-1/2">
              <img
                src={selectedRecipe.image}
                alt={selectedRecipe.title}
                className="w-full h-[500px] object-cover rounded"
                onError={(e) => {
                  e.target.src = "/images/default.jpg";
                }}
              />
            </div>
            <div className="w-1/2 pl-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold">
                  {selectedRecipe.title}
                </h2>
                {isAdmin && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleEdit}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-base rounded"
                    >
                      Cập nhật
                    </button>
                    <button
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-base rounded"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-600 mt-3 text-lg">
                {selectedRecipe.description}
              </p>
              <h3 className="text-xl font-semibold mt-6">Nguyên liệu</h3>
              <div className="flex flex-wrap gap-3 mt-3">
                {selectedRecipe.ingredients.map((ing, idx) => (
                  <span
                    key={ing.product?.productID || ing.productID || idx}
                    className="px-3 py-1 rounded text-base bg-gray-100 text-gray-600"
                  >
                    {ing.product?.productName || ing.productName}
                  </span>
                ))}
              </div>
              <h3 className="text-xl font-semibold mt-6">Hướng dẫn</h3>
              <p className="text-gray-600 mt-3 text-lg whitespace-pre-line">
                {selectedRecipe.instructions}
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
    </div>
  );
};

export default Recipes;
